<script setup lang="ts">
import { computed } from 'vue';
import type {
  ObjectTransformerContext,
  ObjectTransformerDesk,
} from '@vue-airport/object-transformer';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface Props {
  desk: ObjectTransformerDesk;
}

const props = defineProps<Props>();

const desk = computed(() => props.desk as ObjectTransformerContext | undefined);

const mostCompleteIndex = computed(() => desk.value?.mostCompleteIndex.value ?? 0);
const propertyVariations = computed(() => desk.value?.propertyVariations.value ?? []);
const isModelMode = computed(() => desk.value?.mode.value === 'model');
const totalObjects = computed(() => {
  const data = desk.value?.originalData.value;
  return Array.isArray(data) ? data.length : 0;
});

// Group variations by coverage
const incompleteCoverage = computed(() => propertyVariations.value.filter((v) => v.coverage < 100));
const perfectCoverage = computed(() => propertyVariations.value.filter((v) => v.coverage === 100));

const getCoverageColor = (coverage: number) => {
  if (coverage === 100)
    return 'bg-green-500/30 text-green-700 dark:text-green-200 border-green-500/60';
  if (coverage >= 75)
    return 'bg-yellow-500/30 text-yellow-700 dark:text-yellow-200 border-yellow-500/60';
  if (coverage >= 50)
    return 'bg-orange-500/30 text-orange-700 dark:text-orange-200 border-orange-500/60';
  return 'bg-red-500/30 text-red-700 dark:text-red-200 border-red-500/60';
};
</script>

<template>
  <Accordion
    v-if="isModelMode && totalObjects > 0"
    type="single"
    collapsible
    class="border rounded-lg bg-card"
  >
    <AccordionItem value="insights" class="border-none">
      <AccordionTrigger class="px-4 py-2">
        <div class="flex items-center justify-between w-full pr-2">
          <h3 class="text-sm font-semibold">Model Insights</h3>
          <p class="text-xs text-muted-foreground">
            {{ totalObjects }} objects • #{{ mostCompleteIndex }} most complete
          </p>
        </div>
      </AccordionTrigger>
      <AccordionContent class="px-4 pb-4">
        <div class="space-y-4">
          <!-- Property Coverage Summary -->
          <div v-if="incompleteCoverage.length > 0" class="space-y-2">
            <div class="flex items-center justify-between">
              <h4 class="text-xs font-medium text-muted-foreground">Incomplete Properties</h4>
              <Badge variant="outline" class="text-xs">
                {{ incompleteCoverage.length }} / {{ propertyVariations.length }}
              </Badge>
            </div>

            <div class="space-y-1">
              <div
                v-for="variation in incompleteCoverage.slice(0, 10)"
                :key="variation.property"
                class="flex items-center justify-between gap-2 text-xs p-2 rounded border"
                :class="getCoverageColor(variation.coverage)"
              >
                <code class="font-mono flex-1 truncate">{{ variation.property }}</code>
                <div class="flex items-center gap-2 shrink-0">
                  <span class="font-medium">{{ variation.coverage }}%</span>
                  <span class="text-muted-foreground">
                    ({{ variation.presentIn }}/{{ variation.totalObjects }})
                  </span>
                </div>
              </div>

              <div
                v-if="incompleteCoverage.length > 10"
                class="text-xs text-muted-foreground text-center"
              >
                ... and {{ incompleteCoverage.length - 10 }} more
              </div>
            </div>
          </div>

          <!-- Perfect Coverage Info -->
          <div v-if="perfectCoverage.length > 0" class="space-y-1">
            <div class="flex items-center justify-between">
              <h4 class="text-xs font-medium text-muted-foreground">Complete Properties</h4>
              <Badge
                variant="outline"
                class="text-xs bg-green-500/30 text-green-700 dark:text-green-200 border-green-500/60"
              >
                {{ perfectCoverage.length }} properties
              </Badge>
            </div>
            <p class="text-xs text-muted-foreground">
              All objects have these {{ perfectCoverage.length }} properties
            </p>
          </div>

          <!-- No Variations -->
          <div
            v-if="incompleteCoverage.length === 0 && perfectCoverage.length > 0"
            class="text-center p-3 rounded bg-green-500/20 border border-green-500/40"
          >
            <p class="text-sm font-medium text-green-700 dark:text-green-200">
              Perfect Consistency
            </p>
            <p class="text-xs text-green-600 dark:text-green-300">
              All objects have identical structure
            </p>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  </Accordion>
</template>
