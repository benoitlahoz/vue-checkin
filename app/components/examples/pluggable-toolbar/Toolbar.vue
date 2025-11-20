<script setup lang="ts">
import { PluggableToolbar, PluggableToolbarZone, PluggableToolItem, SaveToolItem } from '.';
</script>

<template>
  <div class="w-full h-12 border border-border rounded-md bg-muted overflow-hidden">
    <PluggableToolbar item-class="aspect-square max-h-full h-full overflow-hidden">
      <!-- Define zones with their layout -->
      <PluggableToolbarZone name="left" class="justify-start" />
      <PluggableToolbarZone name="center" class="flex-1 justify-center" />
      <PluggableToolbarZone name="right" class="justify-end" />

      <!-- Items that register in zones -->
      <SaveToolItem />

      <PluggableToolItem id="center-item" zone="center">
        <div class="h-full aspect-square flex items-center justify-center bg-primary text-primary-foreground text-xs font-medium">
          ⭐
        </div>
      </PluggableToolItem>

      <!-- Should not be rendered because zone is not allowed -->
      <PluggableToolItem id="non-zone-item" zone="non-zone">
        <div>Baaaaar</div>
      </PluggableToolItem>
    </PluggableToolbar>
  </div>
</template>

<style scoped></style>
