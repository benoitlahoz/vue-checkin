<script setup lang="ts">
import { computed } from 'vue';
import { useCheckIn } from 'vue-airport';
import TransformerParamInput from './TransformParam.vue';
import type { ObjectNodeData, ObjectTransformerContext } from '.';
import { ObjectTransformerDeskKey, TransformSelect, filterTransformsByType, getNodeType } from '.';

interface Props {
  nodeId: string;
  paddingLeft: string;
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
  <div v-if="node?.transforms.length" data-slot="node-transforms-list" :class="props.class">
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
                :node-id="nodeId"
                :step-index="index"
                remove-label="This & following"
                class="w-full md:w-auto"
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
