<script setup lang="ts">
defineProps<{ header: string }>();
</script>

<template>
  <div
    class="flex-1 p-2 border-b uppercase truncate font-bold flex items-center justify-center select-none cursor-move"
  >
    {{ header }}
  </div>
</template>
