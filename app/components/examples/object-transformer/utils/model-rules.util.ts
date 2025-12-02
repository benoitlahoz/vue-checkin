import type { ObjectNodeData, Transform } from '..';
import { getStructuralTransformHandler } from './structural-transform-handlers.util';
import { mergeWithTemplate } from './model-mode.util';

/**
 * A model rule represents a transformation pattern that can be applied to multiple objects
 */
export interface ModelRule {
  path: string[]; // Path to the property in the object
  originalType: string; // Original type before transformations
  transformations: Array<{
    name: string;
    params: any[];
  }>;
  deleted?: boolean;
  renamed?: {
    from: string;
    to: string;
  };
}

/**
 * Extract model rules from a template node
 * Rules are abstract patterns (no concrete values)
 */
export const extractModelRules = (node: ObjectNodeData, path: string[] = []): ModelRule[] => {
  const rules: ModelRule[] = [];

  // Use originalKey in path if property was renamed (to find it in other objects)
  const keyForPath = node.key && node.originalKey && node.keyModified ? node.originalKey : node.key;

  // Build current path
  const currentPath = keyForPath && path.length > 0 ? [...path, keyForPath] : path;

  // Extract rule for this node if it has modifications (transformations, deletion, or rename)
  const hasModifications = node.transforms.length > 0 || node.deleted || node.keyModified;

  // Only extract rules for properties that have actual modifications
  // Skip the root container (which has no key)
  if (node.key && hasModifications) {
    // Use originalKey in path if property was renamed, so we can find it in other objects
    const keyInPath = node.originalKey && node.keyModified ? node.originalKey : node.key;

    const rule: ModelRule = {
      path: [...path, keyInPath],
      originalType: node.type,
      transformations: node.transforms.map((t) => ({
        name: t.name,
        params: t.params || [],
      })),
    };

    if (node.deleted) {
      rule.deleted = true;
    }

    if (node.keyModified && node.originalKey && node.originalKey !== node.key) {
      rule.renamed = {
        from: node.originalKey,
        to: node.key,
      };
    }

    console.warn(`📝 [extractModelRules] Found rule for ${keyInPath}:`, rule);
    rules.push(rule);
  }

  // Recursively extract rules from children
  if (node.children) {
    node.children.forEach((child) => {
      // Skip root node key in path
      const nextPath = node.key && path.length === 0 ? [] : currentPath;
      rules.push(...extractModelRules(child, nextPath));
    });
  }

  return rules;
};

/**
 * Apply a single rule to an object at the specified path
 */
export const applyRuleToObject = (
  obj: any,
  rule: ModelRule,
  availableTransforms: Transform[]
): any => {
  const result = JSON.parse(JSON.stringify(obj)); // Deep clone

  // Navigate to the parent of the target property
  let current: any = result;
  for (let i = 0; i < rule.path.length - 1; i++) {
    const segment = rule.path[i];

    if (!segment) continue;

    // Create intermediate object if missing
    if (current[segment] === undefined) {
      current[segment] = {};
    }

    current = current[segment];
  }

  const key = rule.path[rule.path.length - 1];
  if (!key) return result;

  // Create property if missing
  if (current[key] === undefined) {
    // Create with appropriate default value based on original type
    if (rule.originalType === 'object') {
      current[key] = {};
    } else if (rule.originalType === 'array') {
      current[key] = [];
    } else {
      current[key] = undefined;
    }
  }

  // Apply transformations (only if there are transformations to apply)
  let value = current[key];
  let wasStructural = false;
  let wasTransformed = false;

  if (rule.transformations.length > 0) {
    for (const transform of rule.transformations) {
      const transformFn = availableTransforms.find((t) => t.name === transform.name);
      if (transformFn) {
        value = transformFn.fn(value, ...transform.params);
        wasTransformed = true;

        // Handle structural transforms
        if (value?.__structuralChange) {
          const handler = getStructuralTransformHandler(value.action);

          if (handler) {
            // If the property is marked as deleted, set removeSource to true
            if (rule.deleted) {
              value.removeSource = true;
            }

            handler(current, key, value);
            wasStructural = true;
            // Don't continue processing transforms after structural change
            break;
          } else {
            console.warn(
              `Structural transform action "${value.action}" not registered. ` +
                `Use registerStructuralTransformHandler to add support for this action.`
            );
          }
        }
      }
    }
  }

  // Assign value if we applied transformations (even if result is undefined)
  // or if value is not undefined and wasn't handled by structural transform
  if (!wasStructural && (wasTransformed || value !== undefined)) {
    current[key] = value;
  }

  // Handle deletion (only for non-structural transforms)
  if (!wasStructural && rule.deleted) {
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete current[key];
  }

  // Handle rename (skip if structural transform was applied or if deleted)
  if (!wasStructural && rule.renamed && !rule.deleted) {
    const newKey = rule.renamed.to;

    // The path (key) points to the OLD key name
    // We need to rename it to the new key
    if (current[key] !== undefined && key !== newKey) {
      current[newKey] = current[key];
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete current[key];
    }
  }

  return result;
};

/**
 * Apply all model rules to an object
 */
export const applyModelRulesToObject = (
  obj: any,
  rules: ModelRule[],
  availableTransforms: Transform[]
): any => {
  let result = obj;

  // Apply each rule in sequence
  for (const rule of rules) {
    result = applyRuleToObject(result, rule, availableTransforms);
  }

  return result;
};

/**
 * Apply model rules to all items in an array
 */
export const applyModelRulesToArray = (
  items: any[],
  rules: ModelRule[],
  availableTransforms: Transform[],
  templateIndex: number,
  includeTemplate = false
): any[] => {
  console.warn('🚀 [applyModelRulesToArray] Called - items:', items.length, 'rules:', rules.length);

  if (!Array.isArray(items) || items.length === 0) return items;

  const template = items[templateIndex];

  const result = items.map((item, index) => {
    // Skip the template object itself unless includeTemplate is true
    if (index === templateIndex && !includeTemplate) {
      console.warn(`⏭️ [applyModelRulesToArray] Skipping template at index ${index}`);
      return item;
    }

    console.warn(`🔧 [applyModelRulesToArray] Processing item ${index}`);

    // First, merge with template to ensure all properties exist
    const normalized = mergeWithTemplate(item, template);

    // Then apply transformations
    const transformed = applyModelRulesToObject(normalized, rules, availableTransforms);
    console.warn(`✨ [applyModelRulesToArray] Item ${index} transformed:`, transformed);

    return transformed;
  });

  return result;
};
