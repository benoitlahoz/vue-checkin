<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useCheckIn } from 'vue-airport';
import type { ObjectNodeData, ObjectTransformerContext } from '.';
import { ObjectTransformerDeskKey, computeChildTransformedValue, applyModelRulesToArray } from '.';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-vue-next';

const { checkIn } = useCheckIn<ObjectNodeData, ObjectTransformerContext>();
const { desk } = checkIn(ObjectTransformerDeskKey);

const isCopied = ref(false);

// Debug: watch treeVersion changes
if (desk) {
  watch(
    () => desk.treeVersion.value,
    (newVal, oldVal) => {
      console.warn('⚠️ [ObjectPreview] treeVersion changed:', oldVal, '->', newVal);
    }
  );
}

// Fonction récursive pour construire l'objet final
const buildFinalObject = (node: ObjectNodeData): any => {
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

  // Track treeVersion to trigger reactivity
  const version = desk.treeVersion.value;
  console.warn('🔄 [finalObject] Computing, treeVersion:', version);

  // En mode model, on veut voir l'array complet avec les transformations du template appliquées
  if (desk.mode.value === 'model' && Array.isArray(desk.originalData.value)) {
    console.warn('📊 [finalObject] MODE MODEL');

    // Build the transformed template from the tree
    const transformedTemplate = buildFinalObject(desk.tree.value);

    // Extract rules from template
    const rules = desk.extractModelRules();
    console.warn('📋 [finalObject] Extracted rules:', rules);

    // Apply rules to all items in the array (excluding template for now)
    const transformedArray = applyModelRulesToArray(
      desk.originalData.value,
      rules,
      desk.transforms.value,
      desk.templateIndex.value,
      false // Don't include template, we'll use transformedTemplate instead
    );

    // Replace the template item with the fully transformed version
    transformedArray[desk.templateIndex.value] = transformedTemplate;
    console.warn('✅ [finalObject] Result:', transformedArray);

    return transformedArray;
  }

  // En mode object, afficher l'objet transformé normalement
  return buildFinalObject(desk.tree.value);
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
  <div
    data-slot="object-transformer-preview"
    class="border rounded-lg p-4 bg-card flex-1 flex flex-col"
  >
    <div class="mb-3">
      <h3 class="text-sm font-semibold">Final Object Preview</h3>
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
      ><code>{{ formattedJson }}</code></pre>
    </div>
  </div>
</template>
