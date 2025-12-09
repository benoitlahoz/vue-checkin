import type { Recipe } from '../src/recipe/types-v4';
import type { Transform } from '../src/types';

// --- Transforms ---
export const transforms: Transform[] = [
  {
    name: 'uppercase',
    fn: (val: string) => val.toUpperCase(),
  },
  {
    name: 'add',
    fn: (val: number, amount: number) => val + amount,
  },
  {
    name: 'multiply',
    fn: (val: number, factor: number) => val * factor,
  },
  {
    name: 'isGreaterThan',
    fn: (val: any) => val,
    condition: (val: number, threshold: number) => val > threshold,
  },
  {
    name: 'splitString',
    fn: (val: string, separator: string) => ({
      __structuralChange: true,
      action: 'split',
      parts: val.split(separator),
      removeSource: true,
    }),
  },
  {
    name: 'expandObject',
    fn: (val: any) => ({
      __structuralChange: true,
      action: 'toObject',
      object: val,
      removeSource: true,
    }),
  },
  {
    name: 'flatten',
    fn: (val: any) => ({
      __structuralChange: true,
      action: 'toObject',
      object: val,
      removeSource: true,
    }),
  },
];

// --- Data Generators ---

export const generateSimpleData = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    name: `user-${i}`,
    stats: {
      score: i * 10,
      level: 1,
    },
    tags: ['a', 'b', 'c'],
  }));
};

export const generateComplexData = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: `user-${i}`,
    profile: {
      personal: {
        firstName: `John${i}`,
        lastName: `Doe${i}`,
        age: 20 + (i % 50),
      },
      contact: {
        email: `john${i}@example.com`,
        address: {
          street: `${i} Main St`,
          city: i % 2 === 0 ? 'New York' : 'London',
          country: i % 2 === 0 ? 'USA' : 'UK',
          zip: `1000${i}`,
        },
      },
    },
    orders: {
      lastOrder: { id: `ord-${i}`, total: 100 + i },
      totalSpent: i * 100,
    },
    metadata: {
      created: '2023-01-01',
      tags: `vip,active,${i % 2 === 0 ? 'premium' : 'standard'}`,
    },
  }));
};

// --- Recipes ---

export const recipeSimple: Recipe = {
  version: '4.0.0',
  deltas: [
    { op: 'transform', key: 'name', transformName: 'uppercase', params: [] },
    { op: 'transform', key: 'score', transformName: 'add', params: [10], parentKey: 'stats' },
  ],
  metadata: {
    rootType: 'object',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
};

export const recipeStructural: Recipe = {
  version: '4.0.0',
  deltas: [
    { op: 'rename', from: 'name', to: 'fullName' },
    { op: 'delete', key: 'level', parentKey: 'stats' },
    { op: 'insert', key: 'processed', value: true },
  ],
  metadata: {
    rootType: 'object',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
};

export const recipeConditional: Recipe = {
  version: '4.0.0',
  deltas: [
    {
      op: 'transform',
      key: 'score',
      transformName: 'multiply',
      params: [2],
      parentKey: 'stats',
      conditionStack: [{ conditionName: 'isGreaterThan', conditionParams: [500] }],
    },
  ],
  metadata: {
    rootType: 'object',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
};

export const recipeHeavy: Recipe = {
  version: '4.0.0',
  deltas: [
    { op: 'rename', from: 'name', to: 'fullName' },
    { op: 'transform', key: 'fullName', transformName: 'uppercase', params: [] },
    { op: 'delete', key: 'tags' },
    {
      op: 'transform',
      key: 'score',
      transformName: 'add',
      params: [1000],
      parentKey: 'stats',
      conditionStack: [{ conditionName: 'isGreaterThan', conditionParams: [500] }],
    },
    { op: 'insert', key: 'processedAt', value: '2025-12-06' },
  ],
  metadata: {
    rootType: 'object',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
};

export const recipeStructuralComplex: Recipe = {
  version: '4.0.0',
  deltas: [
    { op: 'transform', key: 'name', transformName: 'splitString', params: ['-'] },
    { op: 'transform', key: 'stats', transformName: 'expandObject', params: [] },
  ],
  metadata: {
    rootType: 'object',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
};

export const recipeExtreme: Recipe = {
  version: '4.0.0',
  deltas: [
    {
      op: 'transform',
      key: 'personal',
      transformName: 'flatten',
      params: [],
      parentKey: 'profile',
    },
    { op: 'rename', from: 'profile_personal_firstName', to: 'firstName' },
    { op: 'rename', from: 'profile_personal_lastName', to: 'lastName' },
    { op: 'rename', from: 'profile_personal_age', to: 'age' },
    { op: 'transform', key: 'lastName', transformName: 'uppercase', params: [] },
    {
      op: 'transform',
      key: 'address',
      transformName: 'flatten',
      params: [],
      parentKey: 'contact',
    },
    {
      op: 'transform',
      key: 'tags',
      transformName: 'splitString',
      params: [','],
      parentKey: 'metadata',
    },
    { op: 'delete', key: 'profile' },
    { op: 'delete', key: 'created', parentKey: 'metadata' },
    { op: 'insert', key: 'migratedAt', value: new Date().toISOString() },
  ],
  metadata: {
    rootType: 'object',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
};

export const scenarios = [
  {
    id: 'simple',
    name: 'Simple',
    description: 'Basic value transformations (uppercase, add).',
    recipe: recipeSimple,
    dataGenerator: generateSimpleData,
    sampleInput: generateSimpleData(1)[0],
  },
  {
    id: 'structural',
    name: 'Structural',
    description: 'Renaming keys, deleting keys, adding static values.',
    recipe: recipeStructural,
    dataGenerator: generateSimpleData,
    sampleInput: generateSimpleData(1)[0],
  },
  {
    id: 'conditional',
    name: 'Conditional',
    description: 'Applying transforms only if a condition is met (e.g. score > 500).',
    recipe: recipeConditional,
    dataGenerator: generateSimpleData,
    sampleInput: generateSimpleData(1)[0],
  },
  {
    id: 'heavy',
    name: 'Heavy',
    description: 'Combination of all above: rename, transform, delete, conditional, add.',
    recipe: recipeHeavy,
    dataGenerator: generateSimpleData,
    sampleInput: generateSimpleData(1)[0],
  },
  // Commented out complex recipes that need more work
  // {
  //   id: 'structural_complex',
  //   name: 'Structural Complex',
  //   description:
  //     'Advanced structural changes: splitting strings into multiple keys and flattening objects.',
  //   recipe: recipeStructuralComplex,
  //   dataGenerator: generateSimpleData,
  //   sampleInput: generateSimpleData(1)[0],
  // },
  // {
  //   id: 'extreme',
  //   name: 'Extreme (Deep Nested)',
  //   description: 'Deeply nested object flattening, multiple renames, splits, and deletions.',
  //   recipe: recipeExtreme,
  //   dataGenerator: generateComplexData,
  //   sampleInput: generateComplexData(1)[0],
  // },
];
