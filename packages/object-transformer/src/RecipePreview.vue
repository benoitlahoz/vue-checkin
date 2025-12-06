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
  <div data-slot="recipe-preview" class="recipe-preview-container" :class="props.class">
    <div class="recipe-actions">
      <Button size="sm" variant="outline" @click="downloadRecipe">
        <Download class="recipe-action-icon recipe-action-icon-spacing" />
        Export
      </Button>
      <Button size="sm" variant="outline" :disabled="isImporting" @click="triggerFileUpload">
        <Upload class="recipe-action-icon recipe-action-icon-spacing" />
        Import
      </Button>
      <input
        ref="fileInput"
        type="file"
        accept=".json,application/json"
        class="recipe-file-input"
        @change="handleFileUpload"
      />
    </div>

    <!-- Import Progress Feedback -->
    <div
      v-if="isImporting || importStatus !== 'idle'"
      class="recipe-import-feedback"
      :class="{
        'recipe-import-idle': importStatus === 'idle',
        'recipe-import-success': importStatus === 'success',
        'recipe-import-error': importStatus === 'error',
      }"
    >
      <div class="recipe-import-header">
        <CheckCircle2 v-if="importStatus === 'success'" class="recipe-import-icon-success" />
        <XCircle v-else-if="importStatus === 'error'" class="recipe-import-icon-error" />
        <Upload v-else class="recipe-import-icon-idle" />
        <span class="recipe-import-message">
          {{ importMessage || 'Importing recipe...' }}
        </span>
      </div>

      <!-- Custom Progress Bar -->
      <div class="recipe-progress-bar">
        <div
          class="recipe-progress-fill"
          :class="{
            'recipe-progress-idle': importStatus === 'idle',
            'recipe-progress-success': importStatus === 'success',
            'recipe-progress-error': importStatus === 'error',
          }"
          :style="{ width: `${importProgress}%` }"
        />
      </div>
    </div>

    <div class="recipe-content-wrapper">
      <Button
        size="icon"
        variant="ghost"
        class="recipe-copy-button"
        :class="{ 'recipe-copy-button-visible': isCopied }"
        @click="copyToClipboard"
      >
        <Check v-if="isCopied" class="recipe-icon recipe-icon-primary" />
        <Copy v-else class="recipe-icon" />
      </Button>
      <pre class="recipe-content"><code>{{ formattedRecipe }}</code></pre>
    </div>
  </div>
</template>

<style scoped>
/* CSS custom properties */
:root {
  --recipe-bg: oklch(0.9647 0.0078 247.8581);
  --recipe-primary: oklch(0.6723 0.1606 244.9955);
  --recipe-muted: oklch(0.8422 0.0039 247.8581);
  --recipe-border: oklch(0.8987 0.0069 247.8581);
  --recipe-blue: oklch(0.5502 0.1789 241.0352);
  --recipe-blue-bg: oklch(0.9647 0.0078 247.8581);
  --recipe-blue-border: oklch(0.8422 0.0039 247.8581);
  --recipe-green: oklch(0.6469 0.1529 141.7661);
  --recipe-green-bg: oklch(0.9647 0.0078 247.8581);
  --recipe-green-border: oklch(0.8422 0.0039 247.8581);
  --recipe-red: oklch(0.6276 0.2218 22.0942);
  --recipe-red-bg: oklch(0.9647 0.0078 247.8581);
  --recipe-red-border: oklch(0.8422 0.0039 247.8581);
}

:root.dark {
  --recipe-bg: oklch(0.2392 0.0166 250.8453);
  --recipe-primary: oklch(0.6692 0.1607 245.011);
  --recipe-muted: oklch(0.3628 0.0138 256.8435);
  --recipe-border: oklch(0.3217 0.0144 253.4316);
  --recipe-blue: oklch(0.7009 0.1436 241.0352);
  --recipe-blue-bg: oklch(0.2392 0.0166 250.8453);
  --recipe-blue-border: oklch(0.3217 0.0144 253.4316);
  --recipe-green: oklch(0.7469 0.1529 141.7661);
  --recipe-green-bg: oklch(0.2392 0.0166 250.8453);
  --recipe-green-border: oklch(0.3217 0.0144 253.4316);
  --recipe-red: oklch(0.7276 0.1818 22.0942);
  --recipe-red-bg: oklch(0.2392 0.0166 250.8453);
  --recipe-red-border: oklch(0.3217 0.0144 253.4316);
}

/* Main container */
.recipe-preview-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

/* Action buttons */
.recipe-actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}

.recipe-action-icon {
  height: 0.875rem;
  width: 0.875rem;
}

.recipe-action-icon-spacing {
  margin-right: 0.375rem;
}

.recipe-file-input {
  display: none;
}

/* Import feedback */
.recipe-import-feedback {
  flex-shrink: 0;
  border-radius: 0.5rem;
  border-width: 1px;
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.recipe-import-idle {
  background: var(--recipe-blue-bg);
  border-color: var(--recipe-blue-border);
}

.recipe-import-success {
  background: var(--recipe-green-bg);
  border-color: var(--recipe-green-border);
}

.recipe-import-error {
  background: var(--recipe-red-bg);
  border-color: var(--recipe-red-border);
}

.recipe-import-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.recipe-import-icon-idle {
  height: 1rem;
  width: 1rem;
  color: var(--recipe-blue);
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.recipe-import-icon-success {
  height: 1rem;
  width: 1rem;
  color: var(--recipe-green);
}

.recipe-import-icon-error {
  height: 1rem;
  width: 1rem;
  color: var(--recipe-red);
}

.recipe-import-message {
  font-size: 0.875rem;
  line-height: 1.25rem;
  font-weight: 500;
}

/* Progress bar */
.recipe-progress-bar {
  width: 100%;
  height: 0.5rem;
  background: var(--recipe-muted);
  border-radius: 9999px;
  overflow: hidden;
}

.recipe-progress-fill {
  height: 100%;
  transition: width 300ms cubic-bezier(0.4, 0, 0.2, 1);
}

.recipe-progress-idle {
  background: var(--recipe-blue);
}

.recipe-progress-success {
  background: var(--recipe-green);
}

.recipe-progress-error {
  background: var(--recipe-red);
}

/* Content wrapper */
.recipe-content-wrapper {
  position: relative;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

/* Copy button */
.recipe-copy-button {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  height: 1.75rem;
  width: 1.75rem;
  opacity: 0;
  transition: opacity 0.15s ease-in-out;
  z-index: 10;
}

.recipe-content-wrapper:hover .recipe-copy-button {
  opacity: 1;
}

.recipe-copy-button-visible {
  opacity: 1 !important;
}

.recipe-icon {
  height: 0.875rem;
  width: 0.875rem;
}

.recipe-icon-primary {
  color: var(--recipe-primary);
}

/* Recipe content */
.recipe-content {
  font-size: 0.75rem;
  line-height: 1rem;
  background: var(--recipe-bg);
  padding: 0.75rem;
  border-radius: 0.375rem;
  overflow: auto;
  max-height: 500px;
  white-space: pre-wrap;
  word-break: break-word;
}

/* Pulse animation */
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style>
