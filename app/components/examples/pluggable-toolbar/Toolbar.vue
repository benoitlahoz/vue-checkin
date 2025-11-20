<script setup lang="ts">
import {
  PluggableToolbar,
  PluggableToolbarGate,
  PluggableToolItem,
  LoadToolItem,
  SaveToolItem,
} from '.';
</script>

<template>
  <div class="w-full h-12 border border-border rounded-md overflow-hidden p-2">
    <PluggableToolbar item-class="aspect-square max-h-full h-full overflow-hidden">
      <!-- Define gates with their layout -->
      <PluggableToolbarGate name="left" class="flex justify-start min-w-0 gap-2" />
      <PluggableToolbarGate name="center" class="flex flex-1 justify-center" />
      <PluggableToolbarGate name="right" class="flex justify-end min-w-0 gap-2" />

      <!-- Items that register in gates -->
      <LoadToolItem gate="left" />
      <SaveToolItem gate="left" />

      <PluggableToolItem id="center-item" gate="center">
        <div
          class="h-full aspect-square flex items-center justify-center bg-primary text-primary-foreground text-xs font-medium"
        >
          ⭐
        </div>
      </PluggableToolItem>

      <!-- Should not be rendered because gate is not allowed -->
      <PluggableToolItem id="non-gate-item" gate="non-gate">
        <div>Baaaaar</div>
      </PluggableToolItem>
    </PluggableToolbar>
  </div>
</template>

<style scoped></style>
