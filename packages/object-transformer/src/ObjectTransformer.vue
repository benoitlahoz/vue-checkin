<script setup lang="ts">
import { toRef, type HTMLAttributes } from 'vue';
import { useCheckIn } from 'vue-airport';
import { cn } from './lib/utils';
import {
  ObjectTransformerDeskKey,
  type ObjectNodeData,
  type ObjectNodeType,
  type ObjectTransformerContext,
  type ObjectTransformerDesk,
  type TransformerMode,
  keyGuards,
  registerCommonStructuralHandlers,
} from '.';
import { initializeTransformer } from './utils/initialization/initialize-transformer.util';
import { createDataWatcher } from './utils/initialization/create-data-watcher.util';
import { createTransformerContext } from './utils/context/create-transformer-context.util';

export interface ObjectTransformerProps {
  data?: Record<string, any> | any[];
  forbiddenKeys?: string[];
  mode?: TransformerMode;
  templateIndex?: number;
  class?: HTMLAttributes['class'];
}

const props = withDefaults(defineProps<ObjectTransformerProps>(), {
  data: () => ({}),
  forbiddenKeys: () => keyGuards,
  mode: undefined,
  templateIndex: undefined,
  class: '',
});

const { createDesk } = useCheckIn<ObjectNodeData, ObjectTransformerContext>();

// Initialize transformer state
const initialization = initializeTransformer(props.data, props.mode, props.templateIndex);

// Primitive types constant
const primitiveTypes: ObjectNodeType[] = [
  'string',
  'number',
  'boolean',
  'bigint',
  'symbol',
  'undefined',
  'null',
  'date',
  'function',
];

// Create context first
const context = createTransformerContext({
  initialData: initialization.initialData,
  initialMode: initialization.mode,
  initialTemplateIndex: initialization.templateIndex,
  originalData: props.data,
  forbiddenKeys: props.forbiddenKeys || keyGuards,
  primitiveTypes,
});

// Create desk with context
const { desk } = createDesk(ObjectTransformerDeskKey, {
  devTools: true,
  context,
});

// Inject desk reference into context
context.setDesk(desk);

// Register common structural handlers once desk is created
registerCommonStructuralHandlers(desk as ObjectTransformerDesk);

// Watch for data changes
createDataWatcher({
  desk: desk as ObjectTransformerDesk,
  propsData: toRef(props, 'data'),
});

// Expose desk for parent components to access via template ref
defineExpose({
  desk,
});
</script>

<template>
  <div data-slot="object-transformer" :class="cn(props.class)">
    <slot :desk="desk" />
  </div>
</template>
