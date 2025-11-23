<template>
  <li :class="baseClass">
    <span class="font-mono font-semibold">{{ label }}</span>
    <slot />
  </li>
</template>

<script setup lang="ts">
defineProps<{
  label: string;
  baseClass?: string;
}>();
</script>

<style scoped>
li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem;
  border: 1px solid var(--color-muted, #e5e7eb);
  border-radius: 0.5rem;
  cursor: pointer;
  transition: background 0.2s;
}
li:hover {
  background: var(--color-accent, #f3f4f6);
}
</style>
