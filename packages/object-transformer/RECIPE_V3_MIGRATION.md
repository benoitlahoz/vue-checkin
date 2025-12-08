# Recipe System v3.0 - Migration Guide

## Architecture Overview

### Before (v2.x): Mixed Concerns
```
┌─────────────────────────────────────┐
│  Tree Editor + Recipe Recording    │
│  (tightly coupled)                  │
│                                     │
│  - Tree mutations                   │
│  - Operation recording              │
│  - sourceData dependencies          │
│  - Complex path tracking            │
└─────────────────────────────────────┘
```

### After (v3.0): Pure Separation
```
┌──────────────────────┐    ┌──────────────────────┐
│   Tree Editor        │    │   Recipe Pipeline    │
│   (Interactive UI)   │    │   (Pure Functions)   │
│                      │    │                      │
│ - Node manipulation  │    │ - Data in           │
│ - Real-time preview  │    │ - Operations        │
│ - User interactions  │    │ - Data out          │
│ - Records deltas  ───┼───>│ - Path mapping      │
└──────────────────────┘    └──────────────────────┘
```

## Key Concepts

### 1. Path Mapping Registry

The PathMapping tracks how paths evolve:

```typescript
interface PathMapping {
  forward: Map<string, Path>;  // original → current
  reverse: Map<string, Path>;  // current → original
  deleted: Set<string>;        // deleted paths
}
```

Example:
```typescript
// Original data: { name: "John" }
// After rename: { fullName: "John" }

mapping.forward.get("name") → ["fullName"]
mapping.reverse.get("fullName") → ["name"]
```

### 2. Pure Operations

Each operation is a pure function:
```typescript
(data, pathMapping) → { data: newData, pathMapping: newPathMapping }
```

**v2.x (impure):**
```typescript
// Needs sourceData, has side effects
applyRestoreEntry(data, op, sourceData)
```

**v3.0 (pure):**
```typescript
// Self-contained, no external dependencies
applyMovePath(data, op, pathMapping)
```

### 3. Operation Types

#### v2.x Operations (Complex)
- `createEntry` - creates new entry
- `softDeleteEntry` - marks as deleted
- `restoreEntry` - restores deleted (needs sourceData!)
- `renameEntry` - renames key
- `applyConditions` - applies transforms with conditions

#### v3.0 Operations (Simple & Composable)
- `transformValue` - transforms value only (non-structural)
- `createPath` - creates new path
- `deletePath` - removes path
- `movePath` - moves value from A to B
- `renamePath` - renames key (special case of movePath)

## Migration Scenarios

### Scenario: name → toObject → delete → rename → restore

#### v2.x Recipe (Problematic)
```json
{
  "version": "2.1.0",
  "operations": [
    { "type": "applyConditions", "path": ["name"], ... },  // Structural transform
    { "type": "softDeleteEntry", "path": ["name"] },
    { "type": "renameEntry", "oldName": "name_object", "newName": "name" },
    { "type": "restoreEntry", "path": ["name_1"] }  // ❌ Needs sourceData
  ]
}
```

**Problems:**
- `applyConditions` mixes transform + structure creation
- `restoreEntry` depends on external `sourceData`
- Path `name_1` doesn't exist in source
- Double-wrapping of transformations

#### v3.0 Recipe (Clean)
```json
{
  "version": "3.0.0",
  "operations": [
    // Create the object structure
    { "type": "createPath", "path": ["name_object"], "valueType": "object", "initialValue": {} },
    { "type": "createPath", "path": ["name_object", "value"], "valueType": "primitive", "initialValue": null },
    
    // Copy value from name to name_object.value
    { "type": "transformValue", "path": ["name_object", "value"], "transformName": "Copy", "params": ["name"] },
    
    // Delete original name
    { "type": "deletePath", "path": ["name"] },
    
    // Rename name_object to name
    { "type": "renamePath", "parentPath": [], "fromKey": "name_object", "toKey": "name" },
    
    // Move deleted name back as name_1
    { "type": "movePath", "fromPath": ["<deleted>", "name"], "toPath": ["name_1"] }
  ]
}
```

**Pipeline execution with PathMapping:**
```typescript
// Initial: { name: "John" }
// PathMapping: { forward: {}, reverse: {}, deleted: {} }

// After createPath ["name_object"]:
// Data: { name: "John", name_object: {} }
// Mapping: forward: {}, reverse: { "name_object": ["name_object"] }

// After createPath ["name_object", "value"]:
// Data: { name: "John", name_object: { value: null } }

// After transformValue (copy):
// Data: { name: "John", name_object: { value: "John" } }

// After deletePath ["name"]:
// Data: { name_object: { value: "John" } }
// Mapping: deleted: { "name" }

// After renamePath "name_object" → "name":
// Data: { name: { value: "John" } }
// Mapping: forward: { "name_object": ["name"] }, reverse: { "name": ["name_object"] }

// After movePath (restore with rename):
// Data: { name: { value: "John" }, name_1: "John" }
// ✅ Perfect!
```

## Code Changes Required

### 1. Update Recorder to Generate v3.0 Operations

**File: `utils/node/node-transforms.util.ts`**

```typescript
// OLD v2.x
if (node.transforms.some(t => isStructural(t))) {
  desk.recorder.recordSetTransforms(path, allTransforms);
  desk.recorder.recordCreateEntry(newPath, 'object', value);
}

// NEW v3.0
if (node.transforms.some(t => isStructural(t))) {
  // Don't record structural transforms
  const nonStructural = node.transforms.filter(t => !isStructural(t));
  
  // Record only value transforms
  for (const t of nonStructural) {
    desk.recorder.recordTransformValue(path, t.name, t.params);
  }
  
  // Record path creation for structural results
  desk.recorder.recordCreatePath(newPath, valueType, value);
}
```

### 2. Update Delete/Restore Logic

**File: `utils/context/node-operations.util.ts`**

```typescript
// OLD v2.x
if (wasDeleted && !node.deleted) {
  desk.recorder.recordRestoreEntry(path);
  handleRestoreConflict(node.parent, node, desk.recorder, desk.mode.value);
}

// NEW v3.0
if (wasDeleted && !node.deleted) {
  const originalPath = getOriginalPath(node);
  
  if (hasConflict(node)) {
    const newPath = findUniquePath(node);
    desk.recorder.recordMovePath(originalPath, newPath, {
      description: 'Restore with auto-rename to avoid conflict'
    });
  } else {
    desk.recorder.recordMovePath(originalPath, path, {
      description: 'Restore to original location'
    });
  }
}
```

### 3. Update Rename Logic

**File: `utils/context/key-editing.util.ts`**

```typescript
// OLD v2.x
desk.recorder.recordRenameEntry(parentPath, oldKey, newKey);

// NEW v3.0 (same, but different operation type)
desk.recorder.recordRenamePath(parentPath, oldKey, newKey);
```

## Testing

Create test file `recipe-v3.test.ts`:

```typescript
import { applyOperationsPipeline } from './operations-v3';
import { createRecipeRecorder } from './recipe-recorder';

test('name → toObject → delete → rename → restore', () => {
  const sourceData = { name: 'marina abramović' };
  
  const recorder = createRecipeRecorder();
  
  // Simulate user actions
  recorder.recordCreatePath(['name_object'], 'object', {});
  recorder.recordCreatePath(['name_object', 'value'], 'primitive', 'marina abramović');
  recorder.recordDeletePath(['name']);
  recorder.recordRenamePath([], 'name_object', 'name');
  recorder.recordMovePath(['name'], ['name_1'], { description: 'restore with conflict' });
  
  const recipe = recorder.build(['To Object'], 'object');
  const result = applyOperationsPipeline(sourceData, recipe.operations, new Map());
  
  expect(result).toEqual({
    name: { value: 'marina abramović' },
    name_1: 'marina abramović'
  });
});
```

## Benefits

✅ **Pure Functions**: No side effects, easier to test and reason about
✅ **Path Mapping**: Explicit tracking of structural changes
✅ **Composability**: Operations can be combined in any order
✅ **No sourceData**: Recipe is self-contained
✅ **Simpler Operations**: Each operation does one thing well
✅ **Better Debugging**: Path mapping shows transformation history

## Backward Compatibility

The system supports both v2.x and v3.0 recipes:

```typescript
export const applyRecipe = (data, recipe, transforms, sourceData?) => {
  if (recipe.version === '3.0.0') {
    return applyOperationsPipeline(data, recipe.operations, transformsMap);
  }
  
  // v2.x fallback
  return applyOperations(data, sortedOps, transformsMap, sourceData);
};
```

Existing v2.x recipes continue to work, but new recordings will use v3.0 format.
