<script setup lang="ts">
import type { Component } from 'vue';

defineProps<{
  component: Component;
}>();
</script>

<template>
  <div class="h-4" />
  <div class="example-scope p-4 border border-muted rounded-md bg-elevated shadow-lg">
    <component :is="component" />
  </div>
</template>

<style>
@import '~/assets/css/examples.css';
</style>
