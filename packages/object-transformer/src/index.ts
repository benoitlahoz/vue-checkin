// Entry point for @vue-airport/object-transformer
// Re-export types, core utils and Vue components bundled in this package

export * from './types';

// Core utilities
export * from './utils/type-guards.util';
export * from './utils/node/node-builder.util';
export * from './utils/node/node-key-metadata.util';
export * from './utils/transform/structural-transform-handlers.util';
export * from './utils/transform/transform-propagation.util';
export * from './utils/transform/copy-on-write-clone.util';
export * from './utils/node/node-utilities.util';
export * from './utils/node/node-transforms.util';
export * from './utils/node/node-editing.util';
export * from './utils/model/model-mode.util';

// 🟢 Recipe system v2 (functional & immutable)
export * from './recipe';

// Vue components (SFC)
export { default as ObjectTransformer } from './ObjectTransformer.vue';
export { default as ObjectPreview } from './ObjectPreview.vue';
export { default as RecipePreview } from './RecipePreview.vue';
export { default as ObjectNode } from './ObjectNode.vue';
export { default as TransformSelect } from './TransformSelect.vue';
export { default as TransformParam } from './TransformParam.vue';
export { default as NodeKeyEditor } from './NodeKeyEditor.vue';
export { default as NodeActions } from './NodeActions.vue';
export { default as NodeOpen } from './NodeOpen.vue';
export { default as NodeTransformsList } from './NodeTransformsList.vue';

// Transforms (register via useCheckIn in each file)
export { default as TransformString } from './transforms/TransformString.vue';
export { default as TransformNumber } from './transforms/TransformNumber.vue';
export { default as TransformDate } from './transforms/TransformDate.vue';
export { default as TransformBoolean } from './transforms/TransformBoolean.vue';
export { default as TransformObject } from './transforms/TransformObject.vue';
export { default as TransformArray } from './transforms/TransformArray.vue';

// Conditions (now structural transforms that branch)
export { default as ConditionString } from './conditions/ConditionString.vue';
export { default as ConditionNumber } from './conditions/ConditionNumber.vue';
export { default as ConditionArray } from './conditions/ConditionArray.vue';
export { default as ConditionObject } from './conditions/ConditionObject.vue';

// Model rules util
export * from './utils/model/model-rules.util';
export * from './utils/transform/common-structural-handlers.util';

export default {};
