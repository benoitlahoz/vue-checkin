<script setup lang="ts">
import { PluggableToolItem } from '.';
import { Button } from '@/components/ui/button';

/**
 * Save Tool Item
 *
 * Example of a toolbar component that wraps PluggableToolItem
 * and defines its own gate, id, and data (plugin pattern)
 */

export interface SaveToolItemProps {
  gate?: string;
}

const props = withDefaults(defineProps<SaveToolItemProps>(), {
  gate: 'left',
});

// Définir les données du plugin en interne
const toolData = {
  id: 'load',
  label: 'Load',
  icon: 'material-symbols:download',
};

const handleLoad = () => {
  console.log('Load action triggered');
  // Logique de chargement ici
};
</script>

<template>
  <PluggableToolItem :id="toolData.id" :gate="props.gate">
    <Button variant="outline" size="sm" class="w-full h-full p-0" @click="handleLoad">
      <UIcon :name="toolData.icon" />
    </Button>
  </PluggableToolItem>
</template>
