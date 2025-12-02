<script setup lang="ts">
import { computed, ref } from 'vue';
import { useCheckIn } from 'vue-airport';
import { Button } from '@/components/ui/button';
import { Copy, Check, Download, Upload } from 'lucide-vue-next';
import type { ObjectNodeData, ObjectTransformerContext } from '.';
import { ObjectTransformerDeskKey } from '.';

const { checkIn } = useCheckIn<ObjectNodeData, ObjectTransformerContext>();
const { desk } = checkIn(ObjectTransformerDeskKey);

const isCopied = ref(false);

// Build recipe from current tree state
const recipe = computed(() => {
  if (!desk) return null;
  return desk.buildRecipe();
});

// Format recipe as JSON
const formattedRecipe = computed(() => {
  if (!recipe.value) return '';
  try {
    return JSON.stringify(recipe.value, null, 2);
  } catch (error) {
    return `Error: ${error instanceof Error ? error.message : 'Unable to stringify recipe'}`;
  }
});

// Recipe stats
const stats = computed(() => {
  if (!recipe.value) return null;
  return {
    version: recipe.value.version,
    transformations: recipe.value.steps.length,
    deletions: recipe.value.deletedPaths.length,
    renames: recipe.value.renamedKeys.length,
  };
});

// Copy to clipboard
const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(formattedRecipe.value);
    isCopied.value = true;
    setTimeout(() => {
      isCopied.value = false;
    }, 2000);
  } catch (error) {
    console.error('Failed to copy:', error);
  }
};

// Download as JSON file
const downloadRecipe = () => {
  const blob = new Blob([formattedRecipe.value], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `transform-recipe-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// Upload and import recipe
const fileInput = ref<HTMLInputElement | null>(null);

const triggerFileUpload = () => {
  fileInput.value?.click();
};

const handleFileUpload = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file || !desk) return;

  try {
    const text = await file.text();
    desk.importRecipe(text);
    // Reset input
    if (input) input.value = '';
  } catch (error) {
    console.error('Failed to import recipe:', error);
    alert(`Failed to import recipe: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
</script>

<template>
  <div
    data-slot="recipe-preview"
    class="border rounded-lg p-4 bg-card flex-1 flex flex-col min-h-0"
  >
    <div class="mb-3">
      <h3 class="text-sm font-semibold mb-2">Transform Recipe</h3>
      <div v-if="stats" class="flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span>v{{ stats.version }}</span>
        <span
          >{{ stats.transformations }} transform{{ stats.transformations !== 1 ? 's' : '' }}</span
        >
        <span v-if="stats.deletions"
          >{{ stats.deletions }} deletion{{ stats.deletions !== 1 ? 's' : '' }}</span
        >
        <span v-if="stats.renames"
          >{{ stats.renames }} rename{{ stats.renames !== 1 ? 's' : '' }}</span
        >
      </div>
    </div>

    <div class="flex gap-2 mb-3">
      <Button size="sm" variant="outline" @click="downloadRecipe">
        <Download class="h-3.5 w-3.5 mr-1.5" />
        Export
      </Button>
      <Button size="sm" variant="outline" @click="triggerFileUpload">
        <Upload class="h-3.5 w-3.5 mr-1.5" />
        Import
      </Button>
      <input
        ref="fileInput"
        type="file"
        accept=".json,application/json"
        class="hidden"
        @change="handleFileUpload"
      />
    </div>

    <div class="relative group flex-1 min-h-0">
      <Button
        size="icon"
        variant="ghost"
        class="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity z-10"
        :class="{ 'opacity-100!': isCopied }"
        @click="copyToClipboard"
      >
        <Check v-if="isCopied" class="h-3.5 w-3.5 text-primary" />
        <Copy v-else class="h-3.5 w-3.5" />
      </Button>
      <pre
        class="text-xs bg-muted p-3 rounded overflow-x-auto overflow-y-auto h-full whitespace-pre-wrap wrap-break-word"
      ><code>{{ formattedRecipe }}</code></pre>
    </div>
  </div>
</template>
