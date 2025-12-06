<script setup lang="ts">
import { computed, type HTMLAttributes } from 'vue';
import { useCheckIn, partition } from 'vue-airport';
import { ChevronDown } from 'lucide-vue-next';
import { cn } from './lib/utils';
import {
  type ObjectNodeData,
  type ObjectTransformerContext,
  ObjectTransformerDeskKey,
  filterTransformsByType,
  applyNodeTransform,
  applyStepTransform,
} from '.';
import { getTypeFromValue } from './utils/type-guards.util';

type DeskWithContext = typeof desk & ObjectTransformerContext;

interface Props {
  nodeId: string;
  stepIndex?: number; // Si défini, gère un step transform au lieu du node transform
  placeholder?: string;
  removeLabel?: string;
  class?: HTMLAttributes['class'];
  style?: HTMLAttributes['style'];
}

const props = withDefaults(defineProps<Props>(), {
  stepIndex: undefined,
  placeholder: '+',
  removeLabel: 'All',
  class: '',
  style: undefined,
});

const { checkIn } = useCheckIn<ObjectNodeData, ObjectTransformerContext>();
const { desk } = checkIn(ObjectTransformerDeskKey);
const deskWithContext = desk as DeskWithContext;

// Get node
const node = computed(() => {
  const n = deskWithContext.getNode(props.nodeId);
  return n;
});

// Get the type of the test value
const testValueType = computed(() => {
  if (!node.value) return 'unknown';

  // For the first/main node transform selector, use ORIGINAL value type
  if (props.stepIndex === undefined) {
    return getTypeFromValue(node.value.value);
  }

  // For step transforms, use the updated node type (which reflects propagation)
  return node.value.type;
});

// Available transforms based on test value type
const availableTransforms = computed(() => {
  if (!node.value) return [];
  return filterTransformsByType(deskWithContext.transforms.value, testValueType.value);
});

// Separate structural and non-structural transforms using partition
// Also exclude transforms with 'condition' property (they go to availableConditions)
const transformsPartition = computed(() =>
  partition(
    availableTransforms.value.filter((t) => !t.condition),
    (t) => t.structural === true
  )
);

const structuralTransforms = computed(() => transformsPartition.value[0]);
const regularTransforms = computed(() => transformsPartition.value[1]);

// Available conditions based on test value type
// Conditions are transforms with a 'condition' property
const availableConditions = computed(() => {
  if (!node.value) return [];
  // Filter transforms that have a condition property (conditional transforms)
  return availableTransforms.value.filter((t) => t.condition !== undefined);
});

// Current selection
const currentSelection = computed({
  get: () => {
    if (!node.value) return null;

    // Step transform mode
    if (props.stepIndex !== undefined) {
      const nextIndex = props.stepIndex + 1;

      // Si une transformation existe à cet index, retourner son nom
      if (nextIndex < node.value.transforms.length) {
        return node.value.transforms[nextIndex]?.name || null;
      }

      // Sinon, récupérer la sélection stockée
      const stepSelect = deskWithContext.getStepSelection(node.value);
      return stepSelect[nextIndex] || null;
    }

    // Node transform mode
    return deskWithContext.getNodeSelection(node.value);
  },
  set: (value) => {
    if (!node.value) return;

    // Step transform mode
    if (props.stepIndex !== undefined) {
      if (value === 'None') {
        // Clean up all selections after the removed index
        const currentStepSelect = deskWithContext.getStepSelection(node.value);
        const newStepSelect = Object.fromEntries(
          Object.entries(currentStepSelect).filter(([key]) => parseInt(key) <= props.stepIndex!)
        );
        deskWithContext.setStepSelection(node.value, newStepSelect);
      } else if (typeof value === 'string') {
        const currentStepSelect = deskWithContext.getStepSelection(node.value);
        deskWithContext.setStepSelection(node.value, {
          ...currentStepSelect,
          [props.stepIndex + 1]: value,
        });
      }
    } else {
      // Node transform mode
      deskWithContext.setNodeSelection(node.value, value);
    }
  },
});

// Handle transform change
const handleTransformChange = (event: Event) => {
  const target = event.target as HTMLSelectElement;
  const value = target.value;

  if (!node.value) {
    return;
  }

  const name = value === '' ? null : value === 'None' ? 'None' : value;

  // Step transform mode
  if (props.stepIndex !== undefined) {
    applyStepTransform(node.value, props.stepIndex, name as string | null, deskWithContext);

    if (name === 'None' || name === null) {
      const currentStepSelect = deskWithContext.getStepSelection(node.value);
      const newStepSelect = Object.fromEntries(
        Object.entries(currentStepSelect).filter(([key]) => parseInt(key) <= props.stepIndex!)
      );
      deskWithContext.setStepSelection(node.value, newStepSelect);
    } else if (typeof name === 'string') {
      const currentStepSelect = deskWithContext.getStepSelection(node.value);
      deskWithContext.setStepSelection(node.value, {
        ...currentStepSelect,
        [props.stepIndex + 1]: name,
      });
    }

    // Blur the select after selection
    target.blur();
    return;
  }

  // Node transform mode
  applyNodeTransform(node.value, name as string | null, deskWithContext, currentSelection.value);

  if (name === 'None' || name === null) {
    currentSelection.value = null;
  } else if (typeof name === 'string') {
    currentSelection.value = name;
  }

  // Blur the select after selection
  target.blur();
};
</script>

<template>
  <div
    data-slot="ot-select"
    :class="cn('transform-select-container', props.class)"
    :style="props.style"
  >
    <div class="ot-select-wrapper">
      <select
        v-if="node"
        :value="currentSelection || ''"
        :disabled="node.deleted"
        class="ot-select"
        @change="handleTransformChange"
      >
        <option value="" disabled hidden>{{ placeholder }}</option>
        <optgroup v-if="currentSelection" label="Remove">
          <option value="None">{{ removeLabel }}</option>
        </optgroup>
        <optgroup v-if="regularTransforms.length" label="Transformations">
          <option v-for="tr in regularTransforms" :key="tr.name" :value="tr.name">
            {{ tr.name }}
          </option>
        </optgroup>
        <optgroup v-if="structuralTransforms.length" label="Structural">
          <option v-for="tr in structuralTransforms" :key="tr.name" :value="tr.name">
            {{ tr.name }}
          </option>
        </optgroup>
        <optgroup v-if="availableConditions.length" label="Conditions">
          <option v-for="cond in availableConditions" :key="cond.name" :value="cond.name">
            {{ cond.name }}
          </option>
        </optgroup>
      </select>
      <ChevronDown class="ot-select-icon" />
    </div>
  </div>
</template>
