<script setup lang="ts">
import { computed, ref } from 'vue';
import { useCheckIn } from 'vue-airport';
import { Button } from './components/ui/button';
import { Copy, Check, Download, Upload, CheckCircle2, XCircle } from 'lucide-vue-next';
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
const isImporting = ref(false);
const importProgress = ref(0);
const importStatus = ref<'idle' | 'success' | 'error'>('idle');
const importMessage = ref('');

// Recipe is already a computed ref from the recorder
const recipe = desk?.recipe ?? computed(() => null);

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

/**
 * Validates that the parsed JSON is a valid recipe structure
 */
const validateRecipe = (data: unknown): boolean => {
  if (!data || typeof data !== 'object') return false;

  const recipe = data as Record<string, unknown>;

  // Check for required recipe properties
  if (!recipe.version || typeof recipe.version !== 'string') return false;
  if (!recipe.operations || !Array.isArray(recipe.operations)) return false;

  // Validate operations array
  for (const op of recipe.operations) {
    if (!op || typeof op !== 'object') return false;
    const operation = op as Record<string, unknown>;

    // Each operation must have a type
    if (!operation.type || typeof operation.type !== 'string') return false;

    // Known operation types
    const validTypes = [
      'setTransforms',
      'applyConditions',
      'createNode',
      'deleteNode',
      'moveNode',
      'renameNode',
    ];
    if (!validTypes.includes(operation.type)) return false;

    // Validate operation-specific structure
    if (operation.type === 'setTransforms' || operation.type === 'applyConditions') {
      // Path can be a string or an array of strings
      if (!operation.path) return false;
      if (typeof operation.path !== 'string' && !Array.isArray(operation.path)) return false;

      // For applyConditions, check conditions array
      if (operation.type === 'applyConditions') {
        if (!Array.isArray(operation.conditions)) return false;
      } else {
        // For setTransforms, check transforms array
        if (!Array.isArray(operation.transforms)) return false;
      }
    }
  }

  return true;
};

const handleFileUpload = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file || !desk) return;

  // Reset state immediately to clear any previous error/success
  isImporting.value = true;
  importProgress.value = 0;
  importStatus.value = 'idle';
  importMessage.value = 'Loading file...';

  try {
    // Simulate progress stages
    importProgress.value = 20;
    const text = await file.text();

    importProgress.value = 40;
    importMessage.value = 'Parsing JSON...';
    await new Promise((resolve) => setTimeout(resolve, 100)); // Let UI update

    // Parse JSON
    const recipe = JSON.parse(text);

    importProgress.value = 60;
    importMessage.value = 'Validating recipe...';
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Validate recipe structure
    if (!validateRecipe(recipe)) {
      throw new Error('Invalid recipe format - not a valid ObjectTransformer recipe');
    }

    importProgress.value = 80;
    importMessage.value = `Applying ${recipe.operations?.length || 0} operations...`;
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Import recipe
    desk.importRecipe(text);

    importProgress.value = 100;
    importStatus.value = 'success';
    importMessage.value = `Recipe imported successfully! (${recipe.operations?.length || 0} operations)`;

    // Reset input immediately so same file can be re-imported
    input.value = '';

    // Reset state after 3 seconds
    setTimeout(() => {
      isImporting.value = false;
      importStatus.value = 'idle';
      importMessage.value = '';
      importProgress.value = 0;
    }, 3000);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to import recipe:', error);

    importProgress.value = 100;
    importStatus.value = 'error';
    importMessage.value = `Failed: ${message}`;

    // Reset input immediately so user can try again
    input.value = '';

    // Reset state after 5 seconds
    setTimeout(() => {
      isImporting.value = false;
      importStatus.value = 'idle';
      importMessage.value = '';
      importProgress.value = 0;
    }, 5000);
  }
};
</script>

<template>
  <div data-slot="recipe-preview" class="h-full flex flex-col gap-3" :class="props.class">
    <div class="flex gap-2 shrink-0">
      <Button size="sm" variant="outline" @click="downloadRecipe">
        <Download class="h-3.5 w-3.5 mr-1.5" />
        Export
      </Button>
      <Button size="sm" variant="outline" :disabled="isImporting" @click="triggerFileUpload">
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

    <!-- Import Progress Feedback -->
    <div
      v-if="isImporting || importStatus !== 'idle'"
      class="shrink-0 rounded-lg border p-3 space-y-2"
      :class="{
        'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800': importStatus === 'idle',
        'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800':
          importStatus === 'success',
        'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800': importStatus === 'error',
      }"
    >
      <div class="flex items-center gap-2">
        <CheckCircle2
          v-if="importStatus === 'success'"
          class="h-4 w-4 text-green-600 dark:text-green-400"
        />
        <XCircle
          v-else-if="importStatus === 'error'"
          class="h-4 w-4 text-red-600 dark:text-red-400"
        />
        <Upload v-else class="h-4 w-4 text-blue-600 dark:text-blue-400 animate-pulse" />
        <span class="text-sm font-medium">
          {{ importMessage || 'Importing recipe...' }}
        </span>
      </div>

      <!-- Custom Progress Bar -->
      <div class="w-full h-2 bg-muted rounded-full overflow-hidden">
        <div
          class="h-full transition-all duration-300 ease-out"
          :class="{
            'bg-blue-500': importStatus === 'idle',
            'bg-green-500': importStatus === 'success',
            'bg-red-500': importStatus === 'error',
          }"
          :style="{ width: `${importProgress}%` }"
        />
      </div>
    </div>

    <div class="relative group flex-1 min-h-0 overflow-hidden">
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
        class="text-xs bg-muted p-3 rounded overflow-auto max-h-[500px] whitespace-pre-wrap wrap-break-word"
      ><code>{{ formattedRecipe }}</code></pre>
    </div>
  </div>
</template>
