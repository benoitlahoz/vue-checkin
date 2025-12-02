<script setup lang="ts">
import { computed, ref } from 'vue';
import { useCheckIn } from 'vue-airport';
import type { ObjectNodeData, ObjectTransformerContext } from '.';
import { ObjectTransformerDeskKey } from '.';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-vue-next';

const { checkIn } = useCheckIn<ObjectNodeData, ObjectTransformerContext>();
const { desk } = checkIn(ObjectTransformerDeskKey);

const isCopied = ref(false);

const finalObject = computed(() => {
  if (!desk) return null;

  // Track treeVersion to trigger reactivity
  void desk.treeVersion.value;

  // Build recipe from current tree state
  const recipe = desk.buildRecipe();

  // En mode model, appliquer la recipe à tous les objets de l'array
  if (desk.mode.value === 'model' && Array.isArray(desk.originalData.value)) {
    return desk.originalData.value.map((item) => desk.applyRecipe(item, recipe));
  }

  // En mode object, appliquer la recipe à l'objet original
  return desk.applyRecipe(desk.originalData.value, recipe);
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
