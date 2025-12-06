<script setup lang="ts">
import { computed } from 'vue';
import type { ObjectNodeType } from '.';
import { formatValue } from '.';

interface Props {
  value: any;
  type: ObjectNodeType;
  childCount?: number;
}

const props = withDefaults(defineProps<Props>(), {
  childCount: 0,
});

const formattedValue = computed(() => formatValue(props.value, props.type));
</script>

<template>
  <span v-if="type === 'array'" class="ot-node-value-array"> Array({{ childCount }}) </span>
  <span v-else-if="type !== 'object'" class="ot-node-value">
    {{ formattedValue }}
  </span>
  <span v-else class="ot-node-value-hidden" />
</template>

