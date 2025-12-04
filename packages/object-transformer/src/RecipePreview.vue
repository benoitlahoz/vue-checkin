<script setup lang="ts">
import { computed, ref } from 'vue';
import { useCheckIn } from 'vue-airport';
import { Button } from './components/ui/button';
import { Copy, Check, Download, Upload } from 'lucide-vue-next';
import type { ObjectNodeData, ObjectTransformerContext } from '.';
import { ObjectTransformerDeskKey } from '.';

export interface Props {
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  class: '',
});

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
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to import recipe:', error);
    // TODO: Add toast notification here
    alert(`Failed to import recipe: ${message}`);
  }
};
</script>

<template>
  <div data-slot="recipe-preview" class="flex-1 flex flex-col min-h-0 gap-3" :class="props.class">
    <div class="flex gap-2">
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
