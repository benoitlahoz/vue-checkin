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

const hasParams = (transformName: string) => {
  const transform = desk!.findTransform(transformName);
  return transform?.params && transform.params.length > 0;
};

const handleParamChange = () => {
  if (!node.value) return;

  // 🟢 RECORD THE PARAMETER CHANGE (v4.0 Delta)
  // Record each transform with updated params
  const key = node.value.key;
  if ((desk as any).recorder && key) {
    const isModelMode = desk!.mode?.value === 'model';
    const isTemplateRoot = !node.value.parent;

    if (!isModelMode || !isTemplateRoot) {
      // Structural transforms are handled elsewhere, skip them
      const structuralTransformNames = ['To Object', 'Split', 'Split Regex', 'Array to Properties'];

      for (const transform of node.value.transforms) {
        if (structuralTransformNames.includes(transform.name)) continue;

        (desk as any).recorder.recordTransform(key, transform.name, transform.params || [], {
          isCondition: !!transform.condition,
        });
      }
    }
  }

  // Force re-computation by triggering propagation
  desk!.propagateTransform(node.value);
  if (node.value.parent) {
    desk!.propagateTransform(node.value.parent);
  }
};

const getAvailableTransforms = () => {
  return transforms.value;
};
</script>

<template>
  <slot
    :node="node"
    :transforms="node?.transforms || []"
    :helpers="{
      formatStepValue,
      isStructuralTransform,
      getParamConfig,
      hasParams,
      handleParamChange,
      getAvailableTransforms,
    }"
    :components="{
      TransformSelect,
      TransformerParamInput,
    }"
  >
    <!-- Fallback: Default layout (only if transforms exist) -->
    <template v-if="node?.transforms.length">
      <template v-for="(t, index) in node.transforms" :key="`${t.name}-${index}`">
        <!-- Ligne de paramètres (seulement si la transformation a des params) -->
        <div v-if="hasParams(t.name)" class="ot-transform-row">
          <!-- Colonne 1: Vide -->
          <div class="ot-transform-spacer"></div>

          <!-- Colonne 2: Paramètres avec labels -->
          <div class="ot-transform-params">
            <div v-for="(_p, pi) in t.params" :key="`param-${index}-${pi}`" class="ot-param-item">
              <label class="ot-param-label">
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
          class="ot-transform-row"
        >
          <!-- Colonne 1: Vide -->
          <div class="ot-transform-spacer"></div>

          <!-- Colonne 2: Valeur transformée + select suivant -->
          <div class="ot-transform-content">
            <!-- Valeur transformée -->
            <span class="ot-transform-value">
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
  </slot>
</template>
