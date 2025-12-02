<script setup lang="ts">
import { computed } from 'vue';
import { useCheckIn } from 'vue-airport';
import TransformerParamInput from './TransformerParam.vue';
import TransformSelect from './transforms/TransformSelect.vue';
import type { ObjectNode, ObjectTransformerContext } from './index';
import { ObjectTransformerDeskKey } from './index';
import { filterTransformsByType, applyStepTransform } from './utils/node-transforms.util';
import { getNodeType } from './utils/type-guards.util';

interface Props {
  nodeId: string;
  paddingLeft: string;
}

const props = defineProps<Props>();

const { checkIn } = useCheckIn<ObjectNode, ObjectTransformerContext>();
const { desk } = checkIn(ObjectTransformerDeskKey);

const node = computed(() => desk!.getNode(props.nodeId));

const transforms = computed(() =>
  node.value ? filterTransformsByType(desk!.transforms.value, getNodeType(node.value)) : []
);

const formatStepValue = (index: number) => {
  if (!node.value) return '';
  return desk!.formatStepValue(node.value, index);
};

const isStructuralTransform = (index: number) => {
  if (!node.value) return false;
  return desk!.isStructuralTransform(node.value, index);
};

const getParamConfig = (transformName: string, paramIndex: number) => {
  return desk!.getParamConfig(transformName, paramIndex);
};

const handleParamChange = () => {
  if (!node.value) return;
  desk!.propagateTransform(node.value);
  if (node.value.parent) desk!.propagateTransform(node.value.parent);
};

// Gestion interne de stepSelect via le desk
const getStepSelectValue = (index: number): string | null => {
  if (!node.value) return null;

  // Le select affiche la transformation à index + 1 (la suivante)
  const nextIndex = index + 1;

  // Si une transformation existe à cet index, retourner son nom
  if (nextIndex < node.value.transforms.length) {
    return node.value.transforms[nextIndex]?.name || null;
  }

  // Sinon, récupérer la sélection stockée
  const stepSelect = desk!.getStepSelection(node.value);
  return stepSelect[nextIndex] || null;
};

const handleStepTransform = (index: number, name: unknown) => {
  if (!node.value) return;

  applyStepTransform(node.value, index, name as string | null, desk!);

  if (name === 'None') {
    // Clean up all selections after the removed index
    const currentStepSelect = desk!.getStepSelection(node.value);
    const newStepSelect = Object.fromEntries(
      Object.entries(currentStepSelect).filter(([key]) => parseInt(key) <= index)
    );
    desk!.setStepSelection(node.value, newStepSelect);
  } else if (typeof name === 'string') {
    const currentStepSelect = desk!.getStepSelection(node.value);
    desk!.setStepSelection(node.value, { ...currentStepSelect, [index + 1]: name });
  }
};
</script>

<template>
  <div v-if="node?.transforms.length" class="">
    <div class="md:overflow-x-auto">
      <div v-for="(t, index) in node.transforms" :key="`${t.name}-${index}`" class="my-2">
        <div
          class="flex flex-col md:flex-row md:items-center md:justify-between gap-2 p-2 md:p-0 border md:border-0 rounded-md md:rounded-none bg-card md:bg-transparent transition-all group hover:bg-accent/30 min-w-fit"
        >
          <!-- Valeur transformée -->
          <span
            class="text-muted-foreground text-xs"
            :style="{ paddingLeft: paddingLeft }"
            :class="{ 'max-md:pl-0!': true }"
          >
            {{ formatStepValue(index) }}
          </span>

          <!-- Paramètres + Select suivant (si pas structurel) -->
          <template v-if="!isStructuralTransform(index)">
            <div class="flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
              <!-- Paramètres -->
              <div v-if="t.params" class="flex flex-col md:flex-row gap-2 md:gap-3">
                <TransformerParamInput
                  v-for="(_p, pi) in t.params"
                  :key="`param-${index}-${pi}`"
                  v-model="t.params[pi]"
                  :config="getParamConfig(t.name, pi)"
                  @change="handleParamChange()"
                />
              </div>

              <!-- Select suivant -->
              <TransformSelect
                v-if="transforms.length > 1"
                :key="`select-${index + 1}`"
                :model-value="getStepSelectValue(index)"
                :transforms="transforms"
                remove-label="Remove this & following"
                class="w-full md:w-auto"
                @update:model-value="handleStepTransform(index, $event)"
              />
            </div>
          </template>

          <!-- Si structurel, juste les params -->
          <template v-else>
            <div v-if="t.params" class="flex flex-col md:flex-row gap-2 md:gap-3">
              <TransformerParamInput
                v-for="(_p, pi) in t.params"
                :key="`param-${index}-${pi}`"
                v-model="t.params[pi]"
                :config="getParamConfig(t.name, pi)"
                @change="handleParamChange()"
              />
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>
