<script setup lang="ts">
import { computed } from 'vue';
import { useCheckIn } from 'vue-airport';
import TransformerParamInput from './TransformParam.vue';
import type { ObjectNodeData, ObjectTransformerContext } from '.';
import { ObjectTransformerDeskKey, TransformSelect, filterTransformsByType, getNodeType } from '.';
import { computePathFromNode } from './recipe/recipe-recorder';

interface Props {
  nodeId: string;
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  class: '',
});

const { checkIn } = useCheckIn<ObjectNodeData, ObjectTransformerContext>();
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

const hasParams = (transformName: string) => {
  const transform = desk!.findTransform(transformName);
  return transform?.params && transform.params.length > 0;
};

const handleParamChange = () => {
  if (!node.value) return;

  // 🟢 RECORD THE PARAMETER CHANGE
  // When params change, record the complete transform state
  const path = computePathFromNode(node.value, desk!.mode?.value);
  if ((desk as any).recorder) {
    const isModelMode = desk!.mode?.value === 'model';
    const isTemplateRoot = path.length === 0;

    if (!isModelMode || !isTemplateRoot) {
      const transforms = node.value.transforms.map((t) => ({
        name: t.name,
        params: t.params || [],
      }));
      (desk as any).recorder.recordSetTransforms(path, transforms);
    }
  }

  // Force re-computation by triggering propagation
  desk!.propagateTransform(node.value);
  if (node.value.parent) {
    desk!.propagateTransform(node.value.parent);
  }
};
</script>

<template>
  <template v-if="node?.transforms.length">
    <!-- Chaque transformation = 1 ou 2 wrappers (ligne params optionnelle + ligne transform) -->
    <template v-for="(t, index) in node.transforms" :key="`${t.name}-${index}`">
      <!-- Ligne de paramètres (seulement si la transformation a des params) -->
      <div v-if="hasParams(t.name)" class="transform-row-wrapper">
        <!-- Colonne 1: Vide -->
        <div class="transform-spacer"></div>

        <!-- Colonne 2: Paramètres avec labels -->
        <div class="transform-params-content">
          <div
            v-for="(_p, pi) in t.params"
            :key="`param-${index}-${pi}`"
            class="transform-param-item"
          >
            <label class="transform-param-label">
              {{ getParamConfig(t.name, pi)?.label || `Param ${pi + 1}` }}
            </label>
            <TransformerParamInput
              v-model="t.params![pi]"
              :config="getParamConfig(t.name, pi)"
              @change="handleParamChange()"
            />
          </div>
        </div>
      </div>

      <!-- Ligne de transformation : valeur + select -->
      <!-- Afficher pour tous SAUF les structural qui ne sont PAS conditionnels -->
      <div
        v-if="!isStructuralTransform(index) || t.name.startsWith('If ')"
        class="transform-row-wrapper"
      >
        <!-- Colonne 1: Vide -->
        <div class="transform-spacer"></div>

        <!-- Colonne 2: Valeur transformée + select suivant -->
        <div class="transform-item-content">
          <!-- Valeur transformée -->
          <span class="transform-value">
            {{ formatStepValue(index) }}
          </span>

          <!-- Select suivant -->
          <TransformSelect
            v-if="transforms.length > 1"
            :key="`select-${index + 1}`"
            :node-id="nodeId"
            :step-index="index"
            remove-label="This & following"
          />
        </div>
      </div>
    </template>
  </template>
</template>

<style>
/* NodeTransformsList styles - using ObjectNode variables */

/* Wrapper pour chaque ligne de transformation - display:contents pour participer à la grille parent */
.transform-row-wrapper {
  display: contents;
}

/* Mettre en valeur la valeur transformée quand sa ligne est hoverée */
.transform-row-wrapper:hover .transform-value {
  color: var(--object-node-primary-foreground);
}

.transform-spacer {
  grid-column: 1;
  padding-top: var(--object-node-row-my);
  padding-bottom: var(--object-node-row-my);
  padding-left: 0.375rem;
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}

.transforms-list-wrapper {
  overflow-x: auto;
}

.transform-item {
  margin-top: var(--object-node-row-my);
  margin-bottom: var(--object-node-row-my);
}

.transform-item-content {
  grid-column: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--object-node-row-gap);
  padding-top: var(--object-node-row-my);
  padding-bottom: var(--object-node-row-my);
  padding-right: 0.375rem;
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}

.transform-params-content {
  grid-column: 2;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  padding-top: var(--object-node-row-my);
  padding-bottom: var(--object-node-row-my);
  padding-right: 0.375rem;
  padding-left: 0.5rem;
  background-color: transparent;
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}

.transform-param-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  width: 120px;
}

/* Checkbox param items should be smaller */
.transform-param-item:has(.transform-param-checkbox-wrapper) {
  width: auto;
  min-width: fit-content;
}

.transform-param-label {
  font-size: 0.625rem;
  line-height: 0.875rem;
  color: var(--object-node-muted-foreground);
  font-weight: 500;
  text-align: right;
}

.transform-value {
  color: var(--object-node-muted-foreground);
  font-size: 0.75rem;
  line-height: 1rem;
  transition-property: color;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}

/* Desktop styles - simple flex layout in grid column */
@media (min-width: 768px) {
  .transform-item-content {
    min-height: 1.5rem;
  }

  .transform-value {
    flex: 0 0 auto;
  }
}
</style>
