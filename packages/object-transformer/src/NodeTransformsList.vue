<script setup lang="ts">
import { computed } from 'vue';
import { useCheckIn } from 'vue-airport';
import TransformerParamInput from './TransformParam.vue';
import type { ObjectNodeData, ObjectTransformerContext } from '.';
import { ObjectTransformerDeskKey, TransformSelect, filterTransformsByType, getNodeType } from '.';

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

const handleParamChange = () => {
  if (!node.value) return;
  desk!.propagateTransform(node.value);
  if (node.value.parent) desk!.propagateTransform(node.value.parent);
};
</script>

<template>
  <template v-if="node?.transforms.length">
    <!-- Chaque transformation = wrapper avec display:contents contenant 2 éléments de grille -->
    <div
      v-for="(t, index) in node.transforms"
      :key="`${t.name}-${index}`"
      class="transform-row-wrapper"
    >
      <!-- Colonne 1: Vide -->
      <div class="transform-spacer"></div>

      <!-- Colonne 2: Valeur transformée + params + select -->
      <div class="transform-item-content">
        <!-- Valeur transformée -->
        <span class="transform-value">
          {{ formatStepValue(index) }}
        </span>

        <!-- Paramètres + Select suivant (si pas structurel) -->
        <template v-if="!isStructuralTransform(index)">
          <div class="transform-controls">
            <!-- Paramètres -->
            <div v-if="t.params" class="transform-params">
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
              :node-id="nodeId"
              :step-index="index"
              remove-label="This & following"
            />
          </div>
        </template>

        <!-- Si structurel, juste les params -->
        <template v-else>
          <div v-if="t.params" class="transform-params">
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
  gap: var(--object-node-row-gap);
  padding-top: var(--object-node-row-my);
  padding-bottom: var(--object-node-row-my);
  padding-right: 0.375rem;
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}

.transform-value {
  color: var(--object-node-muted-foreground);
  font-size: 0.75rem;
  line-height: 1rem;
  transition-property: color;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}

.transform-controls {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.75rem;
  margin-left: auto;
}

.transform-params {
  display: flex;
  flex-direction: row;
  gap: 0.75rem;
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
