<script setup lang="ts">
import { computed, ref, unref, watch } from 'vue';
import {
  ObjectTransformer,
  ObjectPreview,
  RecipePreview,
  ObjectNode,
  TransformString,
  TransformNumber,
  TransformDate,
  TransformBoolean,
  TransformObject,
  TransformArray,
  ConditionString,
  type ObjectTransformerContext,
} from '@vue-airport/object-transformer';
import { toast } from 'vue-sonner';
import ModeToggle from './ModeToggle.vue';
import ModelInsights from './ModelInsights.vue';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

// Reference to ObjectTransformer component instance
const transformerRef = ref<InstanceType<typeof ObjectTransformer>>();

// Get treeKey for forcing tree remount
const treeKey = computed(() => unref(transformerRef.value?.treeKey) ?? 0);

// Access desk through component ref
const transformerDesk = computed(
  () => transformerRef.value?.desk as ObjectTransformerContext | undefined
);

// Watch for errors and display toasts
watch(
  () => transformerDesk.value?.errors.value.length,
  (newLength, oldLength) => {
    console.log('Error count changed:', { newLength, oldLength });
    if (typeof newLength === 'number' && typeof oldLength === 'number' && newLength > oldLength) {
      const error = transformerDesk.value?.errors.value[newLength - 1];
      if (error) {
        toast.error('Transformation Error', {
          description: error.message,
          action: {
            label: 'Dismiss',
            onClick: () => transformerDesk.value?.dismiss(error.id),
          },
        });
      }
    }
  }
);

// Recipe stats for display - access desk through component ref
const stats = computed(() => {
  if (!transformerDesk.value) return null;
  const recipe = transformerDesk.value.buildRecipe();

  // Count operations by type in Recipe v2
  const transformations = recipe.deltas.length;

  return {
    version: recipe.version,
    transformations,
  };
});

// Generate large dataset for performance testing
function generateLargeDataset(count: number) {
  const firstNames = [
    'marina',
    'pina',
    'laurie',
    'romeo',
    'anne Teresa',
    'william',
    'robert',
    'merce',
    'lucinda',
    'crystal',
  ];
  const lastNames = [
    'abramović',
    'bausch',
    'anderson',
    'castellucci',
    'de keersmaeker',
    'forsythe',
    'wilson',
    'cunningham',
    'childs',
    'pite',
  ];
  const cities = [
    'marseille',
    'paris',
    'lyon',
    'toulouse',
    'nice',
    'nantes',
    'strasbourg',
    'montpellier',
    'bordeaux',
    'lille',
  ];
  const streets = [
    'main st',
    'elm st',
    'oak ave',
    'maple dr',
    'pine rd',
    'cedar ln',
    'birch way',
    'ash ct',
  ];
  const hobbiesList = [
    ['performance art', 'installation', 'video art'],
    ['choreography', 'contemporary dance', 'butoh'],
    ['experimental music', 'multimedia', 'storytelling'],
    ['theatre direction', 'scenography', 'dramaturgy'],
    ['physical theatre', 'improvisation', 'composition'],
  ];
  const tags = ['avant-garde', 'experimental', 'contemporary', 'multidisciplinary', 'immersive'];

  const result = [];

  for (let i = 0; i < count; i++) {
    const firstName = firstNames[i % firstNames.length];
    const lastName = lastNames[(i * 7) % lastNames.length];
    const age = 20 + (i % 50);
    const city = cities[i % cities.length];
    const street = `${100 + (i % 900)} ${streets[i % streets.length]}`;
    const zip = `${10000 + (i % 90000)}`;

    const obj: any = {
      name: `${firstName} ${lastName}`,
      age,
      active: i % 3 !== 0, // ~67% active
      city,
      address: {
        street,
        zip,
      },
      hobbies: hobbiesList[i % hobbiesList.length],
    };

    // Add dob to ~60% of items
    if (i % 5 !== 0) {
      const year = 1950 + (i % 55);
      const month = i % 12;
      const day = 1 + (i % 28);
      obj.dob = new Date(year, month, day);
    }

    // Add custom nested object to ~40% of items
    if (i % 5 < 2) {
      obj.address.custom = {
        info: `custom info ${i}`,
        tags: tags.slice(0, 1 + (i % 3)),
      };
    }

    // Add email to ~70% of items
    if (i % 10 < 7) {
      obj.email = `${firstName}.${lastName}${i}@example.com`;
    }

    // Add phone to ~50% of items
    if (i % 2 === 0) {
      obj.phone = `+33 ${1 + (i % 9)} ${10 + (i % 90)} ${10 + (i % 90)} ${10 + (i % 90)} ${10 + (i % 90)}`;
    }

    result.push(obj);
  }

  return result;
}

// Small dataset for quick demo
const smallData = [
  {
    name: 'john doe',
    age: 30,
    dob: new Date('1993-05-15T00:00:00Z'),
    active: true,
    city: 'marseille',
    address: {
      street: '123 main st',
      zip: '13001',
      custom: {
        info: 'some custom info',
        tags: ['tag1', 'tag2'],
      },
    },
    hobbies: ['reading', 'traveling', 'swimming'],
  },
  {
    name: 'laurie jane de keersmaeker',
    age: 28,
    active: false,
    city: 'brussels',
    address: {
      street: '456 elm st',
      zip: '1000',
    },
    hobbies: ['dancing', 'choreography'],
  },
  {
    name: 'marie van der berg',
    age: 35,
    dob: new Date('1988-03-20T00:00:00Z'),
    active: true,
    city: 'amsterdam',
    address: {
      street: '789 oak ave',
      zip: '1012',
      custom: {
        info: 'dutch noble family',
      },
    },
  },
];

// Toggle between small and large dataset - change to test performance
const USE_LARGE_DATASET = true; // Changed to false to show noble names
const LARGE_DATASET_SIZE = 1000;

const data = USE_LARGE_DATASET ? generateLargeDataset(LARGE_DATASET_SIZE) : smallData;

const triggerTestError = async () => {
  const desk = transformerRef.value?.desk as ObjectTransformerContext | undefined;
  if (desk) {
    // Trigger a real error inside the desk logic by attempting to import invalid JSON
    // This will be caught by the centralized error handler in recipe-operations.util.ts
    try {
      await desk.importRecipe('{{ THIS IS NOT VALID JSON }}');
    } catch {
      console.log('Test error triggered successfully');
    }
  }
};

const exportRecipe = () => {
  const desk = transformerRef.value?.desk as ObjectTransformerContext | undefined;
  if (!desk) return;

  const recipeJson = desk.exportRecipe();

  // Copy to clipboard
  navigator.clipboard
    .writeText(recipeJson)
    .then(() => {
      toast.success('Recipe exported', {
        description: 'Recipe JSON copied to clipboard',
      });
    })
    .catch(() => {
      toast.error('Export failed', {
        description: 'Could not copy to clipboard',
      });
    });

  // Also log to console
  console.log('Exported recipe:', recipeJson);
};

const importRecipe = async () => {
  const desk = transformerRef.value?.desk as ObjectTransformerContext | undefined;
  if (!desk) return;

  try {
    const recipeJson = await navigator.clipboard.readText();
    await desk.importRecipe(recipeJson);

    toast.success('Recipe imported', {
      description: 'Recipe successfully applied',
    });
  } catch (error) {
    toast.error('Import failed', {
      description: error instanceof Error ? error.message : 'Could not import recipe',
    });
  }
};

const testRecipe = () => {
  const desk = transformerRef.value?.desk as ObjectTransformerContext | undefined;
  if (!desk) return;

  const recipe = desk.buildRecipe();
  const originalData = desk.originalData.value;

  // Apply recipe to original data
  const result = desk.applyRecipe(originalData, recipe, originalData);

  // Log the result
  console.log('=== RECIPE TEST ===');
  console.log('Recipe:', recipe);
  console.log('Original data length:', originalData.length);
  console.log('Result length:', result.length);

  // Show first 5 results
  console.log('First 5 results:');
  result.slice(0, 5).forEach((item: any, idx: number) => {
    console.log(
      `[${idx}] name="${item.name || 'SPLIT'}", has name_0=${!!item.name_0}, has name_1=${!!item.name_1}`
    );
    console.log(`     Full:`, item);
  });

  console.log('==================');

  toast.success('Recipe tested', {
    description: 'Check console for detailed results',
  });
};
</script>

<template>
  <div class="h-164 overflow-hidden flex flex-col">
    <Sonner />
    <div class="flex justify-end gap-2 mb-2">
      <button
        class="px-3 py-1 text-xs font-medium text-white bg-blue-500 rounded hover:bg-blue-600 transition-colors"
        @click="exportRecipe"
      >
        Export Recipe
      </button>
      <button
        class="px-3 py-1 text-xs font-medium text-white bg-green-500 rounded hover:bg-green-600 transition-colors"
        @click="importRecipe"
      >
        Import Recipe
      </button>
      <button
        class="px-3 py-1 text-xs font-medium text-white bg-purple-500 rounded hover:bg-purple-600 transition-colors"
        @click="testRecipe"
      >
        Test Recipe
      </button>
      <button
        class="px-3 py-1 text-xs font-medium text-white bg-orange-500 rounded hover:bg-orange-600 transition-colors"
        @click="triggerTestError"
      >
        Trigger Test Error
      </button>
    </div>
    <ObjectTransformer
      ref="transformerRef"
      v-slot="{ desk }"
      :data="data"
      class="flex md:flex-row w-full h-full gap-4"
    >
      <!-- Transform Components -->
      <TransformString />
      <TransformNumber />
      <TransformDate />
      <TransformBoolean />
      <TransformObject />
      <TransformArray />

      <!-- Condition Components -->
      <ConditionString />

      <div class="flex-1 flex flex-col gap-2 min-h-0">
        <ModeToggle :desk="desk" class="shrink-0" />
        <ModelInsights :desk="desk" class="shrink-0" />
        <ObjectNode :key="treeKey" class="flex-1 min-h-0 overflow-auto" />
      </div>

      <div class="flex-1 flex flex-col gap-2 min-h-0">
        <Accordion
          type="single"
          collapsible
          default-value="preview"
          class="border rounded-lg p-4 bg-card"
        >
          <AccordionItem value="preview" class="border-none">
            <AccordionTrigger class="py-2 shrink-0">
              <h3 class="text-sm font-semibold">Final Object Preview</h3>
            </AccordionTrigger>
            <AccordionContent class="pb-0">
              <div class="max-h-[500px]">
                <ObjectPreview class="h-full" />
              </div>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="recipe" class="border-none">
            <AccordionTrigger class="py-2 shrink-0">
              <div class="flex flex-col items-start gap-2">
                <h3 class="text-sm font-semibold">Transform Recipe</h3>
                <div v-if="stats" class="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span>v{{ stats.version }}</span>
                  <span
                    >{{ stats.transformations }} operation{{
                      stats.transformations !== 1 ? 's' : ''
                    }}</span
                  >
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent class="pb-0">
              <div class="max-h-[500px]">
                <RecipePreview class="h-full" />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </ObjectTransformer>
  </div>
</template>

<style scoped></style>
