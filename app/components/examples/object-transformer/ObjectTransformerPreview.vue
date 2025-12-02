<script setup lang="ts">
import { computed } from 'vue';
import { useCheckIn } from 'vue-airport';
import type { ObjectNode, ObjectTransformerContext } from '.';
import { ObjectTransformerDeskKey } from '.';
import { computeChildTransformedValue } from './utils/transform-propagation.util';

const { checkIn } = useCheckIn<ObjectNode, ObjectTransformerContext>();
const { desk } = checkIn(ObjectTransformerDeskKey);

// Fonction récursive pour construire l'objet final
const buildFinalObject = (node: ObjectNode): any => {
  // Si le node est deleted, l'ignorer
  if (node.deleted) return undefined;

  // Si le node a des transformations, utiliser la valeur transformée
  // (car les transformations peuvent changer le type, ex: array.join() -> string)
  if (node.transforms && node.transforms.length > 0) {
    return computeChildTransformedValue(node);
  }

  // Si c'est une primitive ou pas d'enfants, retourner la valeur
  if (!node.children || node.children.length === 0) {
    return node.value;
  }

  // Pour les objects, construire récursivement
  if (node.type === 'object') {
    const result: Record<string, any> = {};
    node.children.forEach((child) => {
      if (!child.deleted && child.key) {
        const value = buildFinalObject(child);
        if (value !== undefined) {
          result[child.key] = value;
        }
      }
    });
    return result;
  }

  // Pour les arrays, construire récursivement
  if (node.type === 'array') {
    return node.children.filter((child) => !child.deleted).map((child) => buildFinalObject(child));
  }

  return node.value;
};

const finalObject = computed(() => {
  if (!desk) return null;
  return buildFinalObject(desk.tree.value);
});

const formattedJson = computed(() => {
  if (!finalObject.value) return '';
  try {
    return JSON.stringify(finalObject.value, null, 2);
  } catch (error) {
    return `Error: ${error instanceof Error ? error.message : 'Unable to stringify object'}`;
  }
});

const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(formattedJson.value);
  } catch (error) {
    console.error('Failed to copy:', error);
  }
};
</script>

<template>
  <div data-slot="transformer-preview" class="border rounded-lg p-4 bg-card flex-1 flex flex-col">
    <div class="flex items-center justify-between mb-3">
      <h3 class="text-sm font-semibold">Final Object Preview</h3>
      <button
        class="px-3 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
        @click="copyToClipboard"
      >
        Copy JSON
      </button>
    </div>
    <pre
      class="text-xs bg-muted p-3 rounded overflow-x-auto overflow-y-auto flex-1 min-h-0"
    ><code>{{ formattedJson }}</code></pre>
  </div>
</template>
