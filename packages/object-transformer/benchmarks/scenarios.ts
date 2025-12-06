import type { Recipe } from '../src/recipe/types';
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
  version: '2.0.0',
  metadata: {
    rootType: 'object',
    createdAt: '2025-12-06',
    requiredTransforms: ['uppercase', 'add'],
  },
  operations: [
    { type: 'transform', path: ['name'], transformName: 'uppercase', params: [] },
    { type: 'transform', path: ['stats', 'score'], transformName: 'add', params: [10] },
  ],
};

export const recipeStructural: Recipe = {
  version: '2.0.0',
  metadata: {
    rootType: 'object',
    createdAt: '2025-12-06',
    requiredTransforms: [],
  },
  operations: [
    { type: 'rename', path: [], from: 'name', to: 'fullName' },
    { type: 'delete', path: ['stats', 'level'] },
    { type: 'add', path: [], key: 'processed', value: true },
  ],
};

export const recipeConditional: Recipe = {
  version: '2.0.0',
  metadata: {
    rootType: 'object',
    createdAt: '2025-12-06',
    requiredTransforms: ['isGreaterThan', 'multiply'],
  },
  operations: [
    {
      type: 'applyConditions',
      path: ['stats', 'score'],
      conditions: [
        {
          predicate: { name: 'isGreaterThan', params: [500] },
          transforms: [{ name: 'multiply', params: [2] }],
        },
      ],
    },
  ],
};

export const recipeHeavy: Recipe = {
  version: '2.0.0',
  metadata: {
    rootType: 'object',
    createdAt: '2025-12-06',
    requiredTransforms: ['uppercase', 'isGreaterThan', 'add'],
  },
  operations: [
    { type: 'rename', path: [], from: 'name', to: 'fullName' },
    { type: 'transform', path: ['fullName'], transformName: 'uppercase', params: [] },
    { type: 'delete', path: ['tags'] },
    {
      type: 'applyConditions',
      path: ['stats', 'score'],
      conditions: [
        {
          predicate: { name: 'isGreaterThan', params: [500] },
          transforms: [{ name: 'add', params: [1000] }],
        },
      ],
    },
    { type: 'add', path: [], key: 'processedAt', value: '2025-12-06' },
  ],
};

export const recipeStructuralComplex: Recipe = {
  version: '2.0.0',
  metadata: {
    rootType: 'object',
    createdAt: '2025-12-06',
    requiredTransforms: ['splitString', 'expandObject'],
  },
  operations: [
    // Split 'name' (user-1) into name_0 (user) and name_1 (1)
    { type: 'transform', path: ['name'], transformName: 'splitString', params: ['-'] },
    // Expand 'stats' into stats_score and stats_level
    { type: 'transform', path: ['stats'], transformName: 'expandObject', params: [] },
  ],
};

export const recipeExtreme: Recipe = {
  version: '2.0.0',
  metadata: {
    rootType: 'object',
    createdAt: '2025-12-06',
    requiredTransforms: ['flatten', 'splitString', 'uppercase', 'rename'],
  },
  operations: [
    // 1. Flatten Personal Info
    { type: 'transform', path: ['profile', 'personal'], transformName: 'flatten', params: [] },
    // Result: profile_personal_firstName, profile_personal_lastName, profile_personal_age

    // 2. Rename flattened keys to nicer ones
    { type: 'rename', path: [], from: 'profile_personal_firstName', to: 'firstName' },
    { type: 'rename', path: [], from: 'profile_personal_lastName', to: 'lastName' },
    { type: 'rename', path: [], from: 'profile_personal_age', to: 'age' },

    // 3. Transform Name
    { type: 'transform', path: ['lastName'], transformName: 'uppercase', params: [] },

    // 4. Flatten Address
    {
      type: 'transform',
      path: ['profile', 'contact', 'address'],
      transformName: 'flatten',
      params: [],
    },
    // Result: profile_contact_address_street, etc.

    // 5. Split Tags
    { type: 'transform', path: ['metadata', 'tags'], transformName: 'splitString', params: [','] },
    // Result: metadata_tags_0, metadata_tags_1...

    // 6. Delete original deep structures if they are empty or not needed (flatten removes source by default in our transform)
    { type: 'delete', path: ['profile'] }, // Remove the rest of profile
    { type: 'delete', path: ['metadata', 'created'] },

    // 7. Add timestamp
    { type: 'add', path: [], key: 'migratedAt', value: new Date().toISOString() },
  ],
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
  {
    id: 'structural_complex',
    name: 'Structural Complex',
    description:
      'Advanced structural changes: splitting strings into multiple keys and flattening objects.',
    recipe: recipeStructuralComplex,
    dataGenerator: generateSimpleData,
    sampleInput: generateSimpleData(1)[0],
  },
  {
    id: 'extreme',
    name: 'Extreme (Deep Nested)',
    description: 'Deeply nested object flattening, multiple renames, splits, and deletions.',
    recipe: recipeExtreme,
    dataGenerator: generateComplexData,
    sampleInput: generateComplexData(1)[0],
  },
];
