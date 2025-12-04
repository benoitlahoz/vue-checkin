import type { ObjectNodeData, Transform, ObjectTransformerContext } from '../../types';
import { getStructuralTransformHandler } from '../transform/structural-transform-handlers.util';
import { mergeWithTemplate } from './model-mode.util';

export interface ModelRule {
  path: string[];
  originalType: string;
  transformations: Array<{ name: string; params: any[] }>;
  deleted?: boolean;
  renamed?: { from: string; to: string };
}

export const extractModelRules = (node: ObjectNodeData, path: string[] = []): ModelRule[] => {
  const rules: ModelRule[] = [];
  const isRoot = path.length === 0;

  const keyForPath = node.key && node.originalKey && node.keyModified ? node.originalKey : node.key;
  const currentPath = keyForPath && !isRoot ? [...path, keyForPath] : path;

  const hasModifications = node.transforms.length > 0 || node.deleted || node.keyModified;

  if (!isRoot && node.key && hasModifications) {
    const keyInPath = node.originalKey && node.keyModified ? node.originalKey : node.key;

    const rule: ModelRule = {
      path: [...path, keyInPath],
      originalType: node.type,
      transformations: node.transforms.map((t) => ({ name: t.name, params: t.params || [] })),
    };

    if (node.deleted) rule.deleted = true;
    if (node.keyModified && node.originalKey && node.originalKey !== node.key) {
      rule.renamed = { from: node.originalKey, to: node.key };
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

const deepClone = (obj: any): any => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (Array.isArray(obj)) return obj.map(deepClone);

  const cloned: any = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  return cloned;
};

export const applyRuleToObject = (
  obj: any,
  rule: ModelRule,
  availableTransforms: Transform[],
  desk?: ObjectTransformerContext
): any => {
  const result = deepClone(obj);
  let current: any = result;
  for (let i = 0; i < rule.path.length - 1; i++) {
    const segment = rule.path[i];
    if (!segment) continue;
    if (current[segment] === undefined) current[segment] = {};
    current = current[segment];
  }

  const key = rule.path[rule.path.length - 1];
  if (!key) return result;

  if (current[key] === undefined) {
    if (rule.originalType === 'object') current[key] = {};
    else if (rule.originalType === 'array') current[key] = [];
    else current[key] = undefined;
  }

  let value = current[key];
  let wasStructural = false;
  let wasTransformed = false;

  if (rule.transformations.length > 0) {
    for (const transform of rule.transformations) {
      const transformFn = availableTransforms.find((t) => t.name === transform.name);
      if (transformFn) {
        value = transformFn.fn(value, ...transform.params);
        wasTransformed = true;

        if (value?.__structuralChange) {
          const handler = getStructuralTransformHandler(value.action, desk);
          if (handler) {
            if (rule.deleted) value.removeSource = true;
            handler(current, key, value);
            wasStructural = true;
            break;
          } else {
            console.warn(`Structural transform action "${value.action}" not registered.`);
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
  obj: any,
  rules: ModelRule[],
  availableTransforms: Transform[],
  desk?: ObjectTransformerContext
): any => {
  let result = obj;
  for (const rule of rules) result = applyRuleToObject(result, rule, availableTransforms, desk);
  return result;
};

export const applyModelRulesToArray = (
  items: any[],
  rules: ModelRule[],
  availableTransforms: Transform[],
  templateIndex: number,
  includeTemplate = false,
  desk?: ObjectTransformerContext
): any[] => {
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
