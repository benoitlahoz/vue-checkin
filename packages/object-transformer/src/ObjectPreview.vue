<script setup lang="ts">
import { computed, type HTMLAttributes, ref, watch } from 'vue';
import { useVirtualList } from '@vueuse/core';
import { useCheckIn } from 'vue-airport';
import type { ObjectNodeData, ObjectTransformerContext } from '.';
import { ObjectTransformerDeskKey } from '.';
import { Button } from './components/ui/button';
import { Copy, Check } from 'lucide-vue-next';

interface Props {
  class?: HTMLAttributes['class'];
}

const props = withDefaults(defineProps<Props>(), {
  class: '',
});

const { checkIn } = useCheckIn<ObjectNodeData, ObjectTransformerContext>();
const { desk } = checkIn(ObjectTransformerDeskKey);

const isCopied = ref(false);
const isGenerating = ref(false);
const progress = ref(0);
const itemsProcessed = ref(0);
const totalItems = ref(0);
const previewCache = ref<any>(null);
const needsRegeneration = ref(true);
const VIRTUAL_SCROLL_THRESHOLD = 5000; // Activer virtual scroll au-delà de 5000 lignes

// Watch for changes that require preview regeneration
watch(
  () => desk?.recipe.value,
  () => {
    needsRegeneration.value = true;
    previewCache.value = null;
  },
  { deep: true }
);

watch(
  () => desk?.originalData.value,
  () => {
    needsRegeneration.value = true;
    previewCache.value = null;
  },
  { deep: true }
);

// Fonction récursive pour construire la valeur finale avec support des transformations structurelles imbriquées
const buildFinalValue = (node: ObjectNodeData): any => {
  if (node.deleted) return undefined;

  // Si le node a des enfants (résultat de transformations structurelles), construire depuis les enfants
  if (node.children && node.children.length > 0) {
    const activeChildren = node.children.filter((child) => !child.deleted);

    // Construire un array si le type est explicitement 'array'
    if (node.type === 'array') {
      const arr = activeChildren.map(buildFinalValue).filter((v) => v !== undefined);
      return applyNonStructuralTransforms(arr, node.transforms);
    }

    // Sinon, construire un objet (pour type 'object' ou transformations structurelles)
    if (node.type === 'object' || activeChildren.some((c) => c.key)) {
      const obj = activeChildren.reduce(
        (acc, child) => {
          const value = buildFinalValue(child); // Récursion
          if (value !== undefined && child.key) {
            acc[child.key] = value;
          }
          return acc;
        },
        {} as Record<string, any>
      );

      // Appliquer les transformations non-structurelles sur l'objet
      return applyNonStructuralTransforms(obj, node.transforms);
    }
  }

  // Pour les primitives sans enfants, appliquer toutes les transformations
  return applyNonStructuralTransforms(node.value, node.transforms);
};

// Appliquer uniquement les transformations non-structurelles
const applyNonStructuralTransforms = (value: any, transforms: any[] | undefined): any => {
  if (!transforms || transforms.length === 0) return value;

  let result = value;
  for (const transform of transforms) {
    const transformResult = transform.fn(result, ...(transform.params || []));
    // Ignorer les résultats structurels (déjà gérés par les enfants)
    if (
      !transformResult ||
      typeof transformResult !== 'object' ||
      !transformResult.__structuralChange
    ) {
      result = transformResult;
    }
  }
  return result;
};

// Generate preview with progress for large datasets
async function generateLargePreview(data: any[], recipe: any) {
  if (isGenerating.value) return;

  isGenerating.value = true;
  progress.value = 0;
  totalItems.value = data.length;
  itemsProcessed.value = 0;

  // Keep old preview visible, build new one progressively
  const result: any[] = [];
  const chunkSize = 100;

  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.slice(i, i + chunkSize);
    const transformed = chunk.map((item) => desk!.applyRecipe(item, recipe));
    result.push(...transformed);

    // Update cache progressively so the preview updates in real-time
    previewCache.value = [...result];

    itemsProcessed.value = Math.min(i + chunkSize, data.length);
    progress.value = (itemsProcessed.value / totalItems.value) * 100;

    // Let the browser breathe
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  // Final update
  previewCache.value = result;
  isGenerating.value = false;
  needsRegeneration.value = false;
}

const finalObject = computed(() => {
  if (!desk) return null;

  // Accès direct à tree.value pour établir la dépendance réactive
  const currentTree = desk.tree.value;

  // IMPORTANT: Access recipe to create dependency on key changes
  void desk.recipe.value;

  // En mode model avec lazy generation
  if (desk.mode.value === 'model' && Array.isArray(desk.originalData.value)) {
    const data = desk.originalData.value;
    const recipe = desk.recipe.value;

    // Return cached preview if available
    if (previewCache.value && !needsRegeneration.value) {
      return previewCache.value;
    }

    // For small datasets (< 500 items), generate synchronously
    if (data.length < 500) {
      return data.map((item) => desk.applyRecipe(item, recipe));
    }

    // For large datasets, auto-generate if needed
    if (needsRegeneration.value) {
      // Trigger async generation
      generateLargePreview(data, recipe);
    }

    // Return cached or empty while generating
    return previewCache.value;
  }

  // En mode object, construire récursivement depuis l'arbre
  return buildFinalValue(currentTree);
});

const formattedJson = computed(() => {
  if (!finalObject.value) return '';

  try {
    // Use custom replacer to show undefined values as null (JSON.stringify ignores undefined)
    return JSON.stringify(
      finalObject.value,
      (key, value) => {
        return value === undefined ? null : value;
      },
      2
    );
  } catch (error) {
    return `Error: ${error instanceof Error ? error.message : 'Unable to stringify object'}`;
  }
});

// Compute lines separately for virtual scrolling
const computedJsonLines = computed(() => {
  if (!formattedJson.value) return [];
  return formattedJson.value.split('\n');
});

// Virtual scrolling pour les grands JSONs
const shouldUseVirtualScroll = computed(
  () => computedJsonLines.value.length > VIRTUAL_SCROLL_THRESHOLD
);

const {
  list: virtualList,
  containerProps,
  wrapperProps,
} = useVirtualList(computedJsonLines, {
  itemHeight: 18, // Hauteur approximative d'une ligne avec text-xs
  overscan: 10, // Nombre de lignes à rendre en plus pour un scroll fluide
});

const shouldShowPreview = computed(() => {
  return finalObject.value !== null && finalObject.value !== undefined;
});

const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(formattedJson.value);
    isCopied.value = true;
    setTimeout(() => {
      isCopied.value = false;
    }, 2000);
  } catch (error) {
    console.error('Failed to copy:', error);
  }
};
</script>

<template>
  <div data-slot="object-transformer-preview" class="object-preview-container" :class="props.class">
    <!-- Progress bar - very thin, at the very top -->
    <div v-if="isGenerating" class="preview-progress-bar">
      <div class="preview-progress-fill" :style="{ width: `${progress}%` }" />
    </div>

    <!-- Copy button -->
    <Button
      v-if="shouldShowPreview"
      size="icon"
      variant="ghost"
      class="preview-copy-button"
      :class="{ 'preview-copy-button-visible': isCopied }"
      @click="copyToClipboard"
    >
      <Check v-if="isCopied" class="preview-icon preview-icon-primary" />
      <Copy v-else class="preview-icon" />
    </Button>

    <!-- Preview content - Virtual scrolling for large JSONs -->
    <div
      v-if="shouldShowPreview && shouldUseVirtualScroll"
      v-bind="containerProps"
      class="preview-content"
    >
      <div v-bind="wrapperProps">
        <div
          v-for="{ data: line, index } in virtualList"
          :key="index"
          class="preview-line"
          v-text="line"
        />
      </div>
    </div>

    <!-- Preview content - Standard for small JSONs -->
    <pre
      v-else-if="shouldShowPreview"
      class="preview-content"
    ><code>{{ formattedJson }}</code></pre>
  </div>
</template>

<style scoped>
/* CSS custom properties */
:root {
  --preview-bg: oklch(0.9647 0.0078 247.8581);
  --preview-primary: oklch(0.6723 0.1606 244.9955);
  --preview-muted: oklch(0.8422 0.0039 247.8581);
}

:root.dark {
  --preview-bg: oklch(0.2392 0.0166 250.8453);
  --preview-primary: oklch(0.6692 0.1607 245.011);
  --preview-muted: oklch(0.3628 0.0138 256.8435);
}

/* Main container */
.object-preview-container {
  position: relative;
  height: 100%;
  overflow: hidden;
}

/* Progress bar - very thin at the very top */
.preview-progress-bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--preview-muted);
  z-index: 30;
  overflow: hidden;
}

.preview-progress-fill {
  height: 100%;
  background: var(--preview-primary);
  transition: width 0.3s ease-out;
}

/* Copy button - top right */
.preview-copy-button {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  z-index: 20;
  height: 1.75rem;
  width: 1.75rem;
  opacity: 0;
  transition: opacity 0.15s ease-in-out;
}

.object-preview-container:hover .preview-copy-button {
  opacity: 1;
}

.preview-copy-button-visible {
  opacity: 1 !important;
}

.preview-icon {
  height: 0.875rem;
  width: 0.875rem;
}

.preview-icon-primary {
  color: var(--preview-primary);
}

/* Preview content */
.preview-content {
  font-size: 0.75rem;
  line-height: 1rem;
  background: var(--preview-bg);
  padding: 0.75rem;
  border-radius: 0.375rem;
  overflow: auto;
  max-height: 500px;
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New',
    monospace;
  white-space: pre-wrap;
  word-break: break-word;
}

/* Virtual scroll line */
.preview-line {
  height: 18px;
  line-height: 18px;
  white-space: pre;
}
</style>
