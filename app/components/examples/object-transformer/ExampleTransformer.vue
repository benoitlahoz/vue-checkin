<script setup lang="ts">
import { computed } from 'vue';
import { useCheckIn } from 'vue-airport';
import {
  ObjectTransformer,
  ObjectPreview,
  RecipePreview,
  ObjectNode,
  ModeToggle,
  TransformString,
  TransformNumber,
  TransformDate,
  TransformBoolean,
  TransformObject,
  TransformArray,
  ObjectTransformerDeskKey,
  type ObjectNodeData,
  type ObjectTransformerContext,
} from '.';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const { checkIn } = useCheckIn<ObjectNodeData, ObjectTransformerContext>();
const { desk } = checkIn(ObjectTransformerDeskKey);

// Recipe stats for display
const stats = computed(() => {
  if (!desk) return null;
  const recipe = desk.buildRecipe();
  return {
    version: recipe.version,
    transformations: recipe.steps.length,
    deletions: recipe.deletedPaths.length,
    renames: recipe.renamedKeys.length,
  };
});

// Array of user objects for model mode demonstration
const data = [
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
</script>

<template>
  <div class="space-y-4 max-h-196 overflow-auto">
    <ObjectTransformer :data="data" class="flex md:flex-row w-full">
      <TransformString />
      <TransformNumber />
      <TransformDate />
      <TransformBoolean />
      <TransformObject />
      <TransformArray />

      <div class="flex-1 flex flex-col gap-2">
        <ModeToggle />
        <ObjectNode />
      </div>

      <div class="flex-1 flex flex-col gap-2 h-full">
        <Accordion
          type="single"
          collapsible
          default-value="preview"
          class="border rounded-lg p-4 bg-card flex-1 flex flex-col"
        >
          <AccordionItem value="preview" class="border-none flex-1 flex flex-col">
            <AccordionTrigger class="py-2">
              <h3 class="text-sm font-semibold">Final Object Preview</h3>
            </AccordionTrigger>
            <AccordionContent class="flex-1 min-h-0 flex flex-col pt-3">
              <ObjectPreview />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="recipe" class="border-none flex-1 flex flex-col">
            <AccordionTrigger class="py-2">
              <div class="flex flex-col items-start gap-2">
                <h3 class="text-sm font-semibold">Transform Recipe</h3>
                <div v-if="stats" class="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span>v{{ stats.version }}</span>
                  <span
                    >{{ stats.transformations }} transform{{
                      stats.transformations !== 1 ? 's' : ''
                    }}</span
                  >
                  <span v-if="stats.deletions"
                    >{{ stats.deletions }} deletion{{ stats.deletions !== 1 ? 's' : '' }}</span
                  >
                  <span v-if="stats.renames"
                    >{{ stats.renames }} rename{{ stats.renames !== 1 ? 's' : '' }}</span
                  >
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent class="flex-1 min-h-0 flex flex-col pt-3">
              <RecipePreview />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </ObjectTransformer>
  </div>
</template>

<style scoped></style>
