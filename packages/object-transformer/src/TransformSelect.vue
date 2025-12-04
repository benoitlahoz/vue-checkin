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
const transformsPartition = computed(() =>
  partition(availableTransforms.value, (t) => t.structural === true)
);

const structuralTransforms = computed(() => transformsPartition.value[0]);
const regularTransforms = computed(() => transformsPartition.value[1]);

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
    data-slot="transform-select"
    :class="cn('transform-select-container', props.class)"
    :style="props.style"
  >
    <div class="transform-select-wrapper">
      <select
        v-if="node"
        :value="currentSelection || ''"
        :disabled="node.deleted"
        class="transform-select"
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
      </select>
      <ChevronDown class="transform-select-icon" />
    </div>
  </div>
</template>

<style>
/* TransformSelect styles - cohérent avec ObjectNode et NodeKeyEditor */
.transform-select-container {
  display: flex;
  align-items: center;
}

.transform-select-wrapper {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.transform-select {
  height: 1.5rem;
  width: 120px;
  padding: 0.125rem 1.75rem 0.125rem 0.5rem;
  font-size: 0.75rem;
  line-height: 1rem;
  border-width: 1px;
  border-style: solid;
  border-color: var(--object-node-input-border);
  border-radius: 0.375rem;
  background-color: var(--object-node-input-bg);
  color: inherit;
  outline: none;
  cursor: pointer;
  transition-property: border-color, box-shadow;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* When showing placeholder (empty value), use muted color */
.transform-select[value=''] {
  color: var(--object-node-muted-foreground);
}

.transform-select option[value=''][disabled] {
  color: var(--object-node-muted-foreground);
}

.transform-select option {
  color: initial;
}

.transform-select:hover:not(:disabled) {
  border-color: var(--object-node-input-ring);
}

.transform-select:focus {
  border-color: var(--object-node-input-ring);
  box-shadow: 0 0 0 3px oklch(from var(--object-node-input-ring) l c h / 0.1);
}

.transform-select:not(:focus) {
  box-shadow: none;
}

.transform-select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.transform-select-icon {
  position: absolute;
  right: 0.375rem;
  top: 50%;
  transform: translateY(-50%);
  width: 1rem;
  height: 1rem;
  pointer-events: none;
  color: var(--object-node-muted-foreground);
}

@media (max-width: 768px) {
  .transform-select {
    width: auto;
    min-width: 80px;
  }
}
</style>
