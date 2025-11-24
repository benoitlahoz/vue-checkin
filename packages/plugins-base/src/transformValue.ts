import type { CheckInPlugin, CheckInPluginMethods } from 'vue-airport';

// Utility to merge union types into intersection
type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void
  ? I
  : never;

// For each key, the type returned by the transform
export type TransformResultMap<Transforms extends Record<string, TransformConfig<any, any>>> = {
  [K in keyof Transforms]: Transforms[K] extends TransformConfig<any, any>
    ? ReturnType<Transforms[K]['fn']>
    : {};
};

// Merge all transform results into a single enriched type
export type MergeTransformResults<
  T,
  Transforms extends Record<string, TransformConfig<any, any>>,
> = T & UnionToIntersection<TransformResultMap<Transforms>[keyof Transforms]>;

export type TransformConfig<T, Item = any> = {
  fn: (value: T, item: Item, key: string) => Partial<Item> | undefined | null;
  strict?: boolean;
};

export type Transforms<T> = {
  [K in keyof T]?: TransformConfig<T[K], T>;
};

export type TransformValuePluginExports<T> = TransformValuePluginMethods<T>;

export interface TransformValuePluginMethods<T> extends CheckInPluginMethods<T> {
  /**
   * Add or update a transform for a property
   */
  addTransform<K extends keyof T>(key: K, config: TransformConfig<T[K]>): void;
  /**
   * Remove a transform for a property
   */
  removeTransform<K extends keyof T>(key: K): void;
}

export function createTransformValuePlugin<T>(
  initialTransforms: Transforms<T> = {}
): CheckInPlugin<T, TransformValuePluginMethods<T>> {
  const transforms: Transforms<T> = { ...initialTransforms };
  return {
    name: 'transform-value',
    version: '1.0.0',

    install: (_desk) => {
      return () => {
        // Cleanup if necessary
      };
    },

    /**
     * Apply all transforms to an item and return the transformed result
     */
    applyTransforms(id, item) {
      const result = { ...item };
      for (const key in transforms) {
        const config = transforms[key];
        if (config && config.fn) {
          const transformResult = config.fn(item[key], result, key);
          if (transformResult && typeof transformResult === 'object') {
            Object.assign(result, transformResult);
          }
        }
      }
      return result;
    },

    /**
     * Apply transforms to the item in-place before check-in. Returns false if a strict transform fails, true otherwise.
     */
    onBeforeCheckIn(id, item) {
      let hasStrictError = false;
      for (const key in transforms) {
        const config = transforms[key];
        if (config && config.fn) {
          try {
            const transformResult = config.fn(item[key], item, key);
            if (transformResult && typeof transformResult === 'object') {
              Object.assign(item, transformResult);
            } else if (transformResult === undefined || transformResult === null) {
              if (config.strict) {
                hasStrictError = true;
                break;
              }
            }
          } catch {
            if (config.strict) {
              hasStrictError = true;
              break;
            }
          }
        }
      }
      return !hasStrictError;
    },

    methods: {
      addTransform(key, config) {
        transforms[key] = config;
      },
      removeTransform(key) {
        transforms[key] = undefined;
      },
    },
  };
}
