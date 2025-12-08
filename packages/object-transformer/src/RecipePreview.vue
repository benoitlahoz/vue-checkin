<script setup lang="ts">
import { computed, ref } from 'vue';
import { useCheckIn } from 'vue-airport';
import { Copy, Check, Download, Upload, CheckCircle2, XCircle } from 'lucide-vue-next';
import type { ObjectNodeData, ObjectTransformerContext } from '.';
import { ObjectTransformerDeskKey } from '.';
import DefaultRecipeLayout from './DefaultRecipeLayout.vue';
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
  if (!recipe.deltas || !Array.isArray(recipe.deltas)) return false;

  // Validate deltas array
  for (const op of recipe.deltas) {
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
    importMessage.value = `Applying ${recipe.deltas?.length || 0} operations...`;
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Import recipe
    desk.importRecipe(text);

    importProgress.value = 100;
    importStatus.value = 'success';
    importMessage.value = `Recipe imported successfully! (${recipe.deltas?.length || 0} operations)`;

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
  <div data-slot="recipe-preview" class="ot-recipe-container" :class="props.class">
    <slot
      :recipe="recipe"
      :formatted-recipe="formattedRecipe"
      :state="{
        isCopied,
        isImporting,
        importProgress,
        importStatus,
        importMessage,
      }"
      :handlers="{
        copyToClipboard,
        downloadRecipe,
        triggerFileUpload,
        handleFileUpload,
      }"
      :refs="{
        fileInput,
      }"
      :components="{
        Copy,
        Check,
        Download,
        Upload,
        CheckCircle2,
        XCircle,
      }"
    >
      <!-- Fallback: Default recipe layout -->
      <DefaultRecipeLayout
        :formatted-recipe="formattedRecipe"
        :is-copied="isCopied"
        :is-importing="isImporting"
        :import-progress="importProgress"
        :import-status="importStatus"
        :import-message="importMessage"
        @copy-to-clipboard="copyToClipboard"
      />
    </slot>
  </div>
</template>
