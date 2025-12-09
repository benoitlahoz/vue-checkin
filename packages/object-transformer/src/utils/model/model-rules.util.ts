import type {
  ObjectNodeData,
  Transform,
  ObjectTransformerContext,
  StructuralTransformResult,
} from '../../types';
import { getStructuralTransformHandler } from '../transform/structural-transform-handlers.util';
import { logger } from '../logger.util';
import { mergeWithTemplate } from './model-mode.util';
import { getOriginalKey, isKeyModified } from '../node/node-key-metadata.util';

export interface ModelRule {
  path: string[];
  originalType: string;
  transformations: Array<{ name: string; params: unknown[] }>;
  deleted?: boolean;
  renamed?: { from: string; to: string };
}

export const extractModelRules = (node: ObjectNodeData, path: string[] = []): ModelRule[] => {
  const rules: ModelRule[] = [];
  const isRoot = path.length === 0;

  const originalKey = getOriginalKey(node);
  const keyForPath = node.key && originalKey && isKeyModified(node) ? originalKey : node.key;
  const currentPath = keyForPath && !isRoot ? [...path, keyForPath] : path;

  const hasModifications = node.transforms.length > 0 || node.deleted || isKeyModified(node);

  if (!isRoot && node.key && hasModifications) {
    const keyInPath = originalKey && isKeyModified(node) ? originalKey : node.key;

    const rule: ModelRule = {
      path: [...path, keyInPath],
      originalType: node.type,
      transformations: node.transforms.map((t) => ({ name: t.name, params: t.params || [] })),
    };

    if (node.deleted) rule.deleted = true;
    if (isKeyModified(node) && originalKey && originalKey !== node.key) {
      rule.renamed = { from: originalKey, to: node.key };
    }

    rules.push(rule);
  }

  if (node.children) {
    node.children.forEach((child) => {
      const nextPath = node.key ? currentPath : [];
      rules.push(...extractModelRules(child, nextPath));
    });
  }

  return rules;
};

const deepClone = (obj: unknown): unknown => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (Array.isArray(obj)) return obj.map(deepClone);

  const cloned: Record<string, unknown> = {};
  const objRecord = obj as Record<string, unknown>;
  for (const key in objRecord) {
    if (Object.prototype.hasOwnProperty.call(objRecord, key)) {
      cloned[key] = deepClone(objRecord[key]);
    }
  }
  return cloned;
};

export const applyRuleToObject = (
  obj: unknown,
  rule: ModelRule,
  availableTransforms: Transform[],
  desk?: ObjectTransformerContext
): unknown => {
  const result = deepClone(obj) as Record<string, unknown>;
  let current: Record<string, unknown> = result;
  for (let i = 0; i < rule.path.length - 1; i++) {
    const segment = rule.path[i];
    if (!segment) continue;
    if (current[segment] === undefined) current[segment] = {};
    current = current[segment] as Record<string, unknown>;
  }

  const key = rule.path[rule.path.length - 1];
  if (!key) return result;

  if (current[key] === undefined) {
    if (rule.originalType === 'object') current[key] = {};
    else if (rule.originalType === 'array') current[key] = [];
    else current[key] = undefined;
  }

  let value: unknown = current[key];
  let wasStructural = false;
  let wasTransformed = false;

  if (rule.transformations.length > 0) {
    for (const transform of rule.transformations) {
      const transformFn = availableTransforms.find((t) => t.name === transform.name);
      if (transformFn) {
        value = transformFn.fn(value, ...transform.params);
        wasTransformed = true;

        // Type guard pour StructuralTransformResult
        if (
          value !== null &&
          typeof value === 'object' &&
          '__structuralChange' in value &&
          value.__structuralChange === true &&
          'action' in value &&
          typeof value.action === 'string'
        ) {
          const handler = getStructuralTransformHandler(value.action, desk);
          if (handler) {
            if (rule.deleted) {
              (value as StructuralTransformResult).removeSource = true;
            }

            // 🔥 v4.0: Record insert operations for nodes created by structural transforms
            // Each created property is recorded with metadata tracking the transform that created it
            if (desk.recorder && value.action === 'toObject' && value.object) {
              Object.keys(value.object).forEach((objKey) => {
                const newKey = `${key}_${objKey}`;
                desk.recorder!.recordInsert(newKey, value.object![objKey], {
                  createdBy: {
                    transformName: 'To Object',
                    params: [],
                  },
                  description: `Created by toObject transformation on ${key}`,
                });
              });
            }

            // Similarly for split transformations
            if (desk.recorder && value.action === 'split' && Array.isArray(value.parts)) {
              value.parts.forEach((part, index) => {
                const newKey = `${key}_${index}`;
                desk.recorder!.recordInsert(newKey, part, {
                  createdBy: {
                    transformName: 'Split',
                    params: [],
                  },
                  description: `Created by split transformation on ${key}`,
                });
              });
            }

            handler(current, key, value as StructuralTransformResult);
            wasStructural = true;
            break;
          } else {
            logger.warn(`Structural transform action "${value.action}" not registered.`);
          }
        }
      }
    }
  }

  if (!wasStructural && (wasTransformed || value !== undefined)) {
    current[key] = value;
  }

  if (!wasStructural && rule.deleted) {
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete current[key];
  }

  if (!wasStructural && rule.renamed && !rule.deleted) {
    const newKey = rule.renamed.to;
    if (current[key] !== undefined && key !== newKey) {
      current[newKey] = current[key];
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete current[key];
    }
  }

  return result;
};

export const applyModelRulesToObject = (
  obj: unknown,
  rules: ModelRule[],
  availableTransforms: Transform[],
  desk?: ObjectTransformerContext
): unknown => {
  let result = obj;
  for (const rule of rules) result = applyRuleToObject(result, rule, availableTransforms, desk);
  return result;
};

export const applyModelRulesToArray = (
  items: unknown[],
  rules: ModelRule[],
  availableTransforms: Transform[],
  templateIndex: number,
  includeTemplate = false,
  desk?: ObjectTransformerContext
): unknown[] => {
  if (!Array.isArray(items) || items.length === 0) return items;
  const template = items[templateIndex];
  const result = items.map((item, index) => {
    if (index === templateIndex && !includeTemplate) return item;
    const normalized = mergeWithTemplate(item, template);
    const transformed = applyModelRulesToObject(normalized, rules, availableTransforms, desk);
    return transformed;
  });
  return result;
};
