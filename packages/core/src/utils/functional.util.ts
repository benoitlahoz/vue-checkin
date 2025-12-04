/**
 * Functional utilities - Pure functions for composition
 * Generic utilities that can be used across different packages
 */

// Pipe: compose functions left to right
export const pipe =
  <T>(...fns: Array<(arg: T) => T>) =>
  (value: T): T =>
    fns.reduce((acc, fn) => fn(acc), value);

// Compose: compose functions right to left
export const compose =
  <T>(...fns: Array<(arg: T) => T>) =>
  (value: T): T =>
    fns.reduceRight((acc, fn) => fn(acc), value);

// Map with index
export const mapWithIndex =
  <T, R>(fn: (item: T, index: number) => R) =>
  (arr: T[]): R[] =>
    arr.map(fn);

// Filter and map in one pass
export const filterMap =
  <T, R>(predicate: (item: T) => boolean, mapper: (item: T) => R) =>
  (arr: T[]): R[] =>
    arr.reduce((acc, item) => (predicate(item) ? [...acc, mapper(item)] : acc), [] as R[]);

// Reduce to object
export const toObject =
  <T>(keyFn: (item: T) => string, valueFn: (item: T) => any) =>
  (arr: T[]): Record<string, any> =>
    arr.reduce((acc, item) => ({ ...acc, [keyFn(item)]: valueFn(item) }), {});

// When: conditional execution
export const when =
  <T>(predicate: (value: T) => boolean, fn: (value: T) => T) =>
  (value: T): T =>
    predicate(value) ? fn(value) : value;

// Unless: opposite of when
export const unless =
  <T>(predicate: (value: T) => boolean, fn: (value: T) => T) =>
  (value: T): T =>
    predicate(value) ? value : fn(value);

// Maybe: safe execution with fallback
export const maybe =
  <T, R>(fn: (value: T) => R, fallback: R) =>
  (value: T): R => {
    try {
      return fn(value);
    } catch {
      return fallback;
    }
  };

// Tap: execute side effect and return value
export const tap =
  <T>(fn: (value: T) => void) =>
  (value: T): T => {
    fn(value);
    return value;
  };

// Identity function
export const identity = <T>(value: T): T => value;

// Always: return constant function
export const always =
  <T>(value: T) =>
  (): T =>
    value;

// Not: negate predicate
export const not =
  <T>(predicate: (value: T) => boolean) =>
  (value: T): boolean =>
    !predicate(value);

// Both: combine predicates with AND
export const both =
  <T>(p1: (value: T) => boolean, p2: (value: T) => boolean) =>
  (value: T): boolean =>
    p1(value) && p2(value);

// Either: combine predicates with OR
export const either =
  <T>(p1: (value: T) => boolean, p2: (value: T) => boolean) =>
  (value: T): boolean =>
    p1(value) || p2(value);

// All: check if all predicates pass
export const all =
  <T>(...predicates: Array<(value: T) => boolean>) =>
  (value: T): boolean =>
    predicates.every((p) => p(value));

// Any: check if any predicate passes
export const any =
  <T>(...predicates: Array<(value: T) => boolean>) =>
  (value: T): boolean =>
    predicates.some((p) => p(value));

// Partition: split array into two based on predicate
export const partition = <T>(arr: T[], predicate: (item: T) => boolean): [T[], T[]] => {
  const pass: T[] = [];
  const fail: T[] = [];
  arr.forEach((item) => {
    if (predicate(item)) {
      pass.push(item);
    } else {
      fail.push(item);
    }
  });
  return [pass, fail];
};
