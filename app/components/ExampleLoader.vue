<script setup lang="ts">
import type { Component } from 'vue';

defineProps<{
  component: Component;
}>();
</script>

<template>
  <div class="example-loader">
    <component :is="component" />
  </div>
</template>

<style scoped>
.example-loader {
  padding: 1.5rem;
  border: 1px solid var(--ui-border-primary);
  border-radius: 0.5rem;
  background: var(--ui-bg-elevated);
  box-shadow:
    0 1px 3px 0 rgb(0 0 0 / 0.1),
    0 1px 2px -1px rgb(0 0 0 / 0.1);
  margin: 1.5rem 0;
}
</style>
