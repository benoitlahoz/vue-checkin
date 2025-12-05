<script setup lang="ts">
import { computed, ref } from 'vue';
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
  type ObjectTransformerContext,
} from '@vue-airport/object-transformer';
import ModeToggle from './ModeToggle.vue';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

// Reference to ObjectTransformer component instance
const transformerRef = ref<InstanceType<typeof ObjectTransformer>>();

// Recipe stats for display - access desk through component ref
const stats = computed(() => {
  const desk = transformerRef.value?.desk as ObjectTransformerContext | undefined;
  if (!desk) return null;
  const recipe = desk.buildRecipe();

  // Count operations by type in Recipe v2
  const transformations = recipe.operations.length;

  return {
    version: recipe.version,
    transformations,
  };
});

// Generate large dataset for performance testing
function generateLargeDataset(count: number) {
  const firstNames = [
    'john',
    'jane',
    'bob',
    'alice',
    'charlie',
    'diana',
    'eve',
    'frank',
    'grace',
    'henry',
  ];
  const lastNames = [
    'doe',
    'smith',
    'wilson',
    'brown',
    'jones',
    'garcia',
    'miller',
    'davis',
    'rodriguez',
    'martinez',
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
    ['reading', 'traveling', 'swimming'],
    ['cooking', 'painting', 'dancing'],
    ['gaming', 'hiking', 'photography'],
    ['music', 'sports', 'gardening'],
    ['yoga', 'cycling', 'fishing'],
  ];
  const tags = ['tag1', 'tag2', 'tag3', 'tag4', 'tag5'];

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
    name: 'jane smith',
    age: 28,
    active: false,
    city: 'paris',
    address: {
      street: '456 elm st',
      zip: '75001',
    },
    hobbies: ['cooking', 'painting'],
  },
  {
    name: 'bob wilson',
    age: 35,
    dob: new Date('1988-03-20T00:00:00Z'),
    active: true,
    city: 'lyon',
    address: {
      street: '789 oak ave',
      zip: '69001',
      custom: {
        info: 'another info',
      },
    },
  },
];

// Toggle between small and large dataset - change to test performance
const USE_LARGE_DATASET = true;
const LARGE_DATASET_SIZE = 1000;

const data = USE_LARGE_DATASET ? generateLargeDataset(LARGE_DATASET_SIZE) : smallData;
</script>

<template>
  <div class="h-164 overflow-hidden flex flex-col">
    <ObjectTransformer
      ref="transformerRef"
      v-slot="{ desk }"
      :data="data"
      class="flex md:flex-row w-full h-full gap-4"
    >
      <TransformString />
      <TransformNumber />
      <TransformDate />
      <TransformBoolean />
      <TransformObject />
      <TransformArray />

      <div class="flex-1 flex flex-col gap-2 min-h-0">
        <ModeToggle :desk="desk" class="shrink-0" />
        <ObjectNode class="flex-1 min-h-0 overflow-auto" />
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
                    >{{ stats.transformations }} transform{{
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
