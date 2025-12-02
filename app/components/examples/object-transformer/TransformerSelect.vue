<script setup lang="ts">
import { computed } from 'vue';
import { useCheckIn } from 'vue-airport';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
} from '@/components/ui/select';
import {
  type ObjectNode,
  type ObjectTransformerContext,
  ObjectTransformerDeskKey,
  filterTransformsByType,
  applyNodeTransform,
  applyStepTransform,
} from '.';

type DeskWithContext = typeof desk & ObjectTransformerContext;

interface Props {
  nodeId: string;
  stepIndex?: number; // Si défini, gère un step transform au lieu du node transform
  placeholder?: string;
  removeLabel?: string;
}

const props = withDefaults(defineProps<Props>(), {
  stepIndex: undefined,
  placeholder: '+',
  removeLabel: 'All',
});

const { checkIn } = useCheckIn<ObjectNode, ObjectTransformerContext>();
const { desk } = checkIn(ObjectTransformerDeskKey);
const deskWithContext = desk as DeskWithContext;

// Get node
const node = computed(() => {
  const n = deskWithContext.getNode(props.nodeId);
  if (!n) {
    console.warn('TransformerSelect: Node not found:', props.nodeId);
  }
  return n;
});

// Available transforms based on original type
const availableTransforms = computed(() => {
  if (!node.value) return [];
  return filterTransformsByType(deskWithContext.transforms.value, node.value.type);
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
const handleTransformChange = (name: unknown) => {
  if (!node.value) return;

  // Step transform mode
  if (props.stepIndex !== undefined) {
    applyStepTransform(node.value, props.stepIndex, name as string | null, deskWithContext);

    if (name === 'None') {
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
    return;
  }

  // Node transform mode
  applyNodeTransform(node.value, name as string | null, deskWithContext, currentSelection.value);

  if (name === 'None') {
    currentSelection.value = null;
  } else if (typeof name === 'string') {
    currentSelection.value = name;
  }
};
</script>

<template>
  <Select v-if="node" :model-value="currentSelection" @update:model-value="handleTransformChange">
    <SelectTrigger
      class="h-auto max-h-6 px-2 py-0.5 text-xs group-hover:border-primary min-w-[120px]"
    >
      <SelectValue :placeholder="placeholder" class="text-xs">
        {{ currentSelection || placeholder }}
      </SelectValue>
    </SelectTrigger>
    <SelectContent class="text-xs">
      <SelectGroup v-if="currentSelection">
        <SelectLabel>Remove</SelectLabel>
        <SelectItem value="None" class="text-xs">{{ removeLabel }}</SelectItem>
      </SelectGroup>
      <SelectGroup>
        <SelectLabel>Transformations</SelectLabel>
        <SelectItem
          v-for="tr in availableTransforms"
          :key="tr.name"
          :value="tr.name"
          class="text-xs"
        >
          {{ tr.name }}
        </SelectItem>
      </SelectGroup>
    </SelectContent>
  </Select>
</template>
