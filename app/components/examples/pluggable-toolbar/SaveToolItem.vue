<script setup lang="ts">
import { PluggableToolItem } from '.';
import { Button } from '@/components/ui/button';

/**
 * Save Tool Item
 *
 * Exemple de composant toolbar qui encapsule PluggableToolItem
 * et définit sa propre zone, son id, et ses données (plugin pattern)
 */

export interface SaveToolItemProps {
  zone?: string;
}

const props = withDefaults(defineProps<SaveToolItemProps>(), {
  zone: 'left',
});

// Définir les données du plugin en interne
const toolData = {
  id: 'save',
  label: 'Save',
  icon: '💾',
};

const handleSave = () => {
  console.log('Save action triggered');
  // Logique de sauvegarde ici
};
</script>

<template>
  <PluggableToolItem id="save" :zone="props.zone">
    <Button size="sm" class="h-full aspect-square p-0" @click="handleSave">
      {{ toolData.icon }} {{ toolData.label }}
    </Button>
  </PluggableToolItem>
</template>
