<script setup lang="ts">
import { PluggableToolbar, PluggableToolItem, SaveToolItem } from '.';
</script>

<template>
  <div class="w-full h-12 border border-border rounded-md bg-muted overflow-hidden">
    <PluggableToolbar
      :zones="['left', 'center', 'right']"
      item-class="aspect-square max-h-full h-full overflow-hidden"
    >
      <SaveToolItem />
      <PluggableToolItem id="center-item" zone="center">
        <div>Fooooooooo</div>
      </PluggableToolItem>
    </PluggableToolbar>
  </div>
</template>

<style scoped></style>
