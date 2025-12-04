<script setup lang="ts">
import { computed, ref } from 'vue';
import { useCheckIn } from 'vue-airport';
import type { ObjectNodeData, ObjectTransformerContext } from '.';
import { ObjectTransformerDeskKey } from '.';
import { Button } from './components/ui/button';
import { Copy, Check } from 'lucide-vue-next';

interface Props {
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  class: '',
});

const { checkIn } = useCheckIn<ObjectNodeData, ObjectTransformerContext>();
const { desk } = checkIn(ObjectTransformerDeskKey);

const isCopied = ref(false);

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

const finalObject = computed(() => {
  if (!desk) return null;

  // Accès direct à tree.value pour établir la dépendance réactive
  const currentTree = desk.tree.value;

  // IMPORTANT: Access recipe to create dependency on key changes
  // The recipe includes renamed keys, so when keys change, recipe changes, and this computed recalculates
  void desk.recipe.value;

  // En mode model, appliquer la recipe à tous les objets de l'array
  if (desk.mode.value === 'model' && Array.isArray(desk.originalData.value)) {
    const recipe = desk.buildRecipe();
    return desk.originalData.value.map((item) => desk.applyRecipe(item, recipe));
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
    class="relative group flex-1 min-h-0"
    :class="props.class"
  >
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
</template>
