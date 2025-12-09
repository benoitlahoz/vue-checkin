<script setup lang="ts">
import { computed, ref, unref } from 'vue';
import {
  ObjectTransformer,
  ObjectPreview,
  RecipePreview,
  TransformString,
  TransformNumber,
  TransformDate,
  TransformBoolean,
  TransformObject,
  TransformArray,
  ConditionString,
  type ObjectTransformerContext,
} from '@vue-airport/object-transformer';
import CustomRecursiveNode from './CustomRecursiveNode.vue';
import ModeToggle from './ModeToggle.vue';
import ModelInsights from './ModelInsights.vue';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

// Reference to ObjectTransformer component instance
const transformerRef = ref<InstanceType<typeof ObjectTransformer>>();

// Get treeKey for forcing tree remount
const treeKey = computed(() => unref(transformerRef.value?.treeKey) ?? 0);

// Recipe stats for display
const stats = computed(() => {
  const desk = transformerRef.value?.desk as ObjectTransformerContext | undefined;
  if (!desk) return null;
  const recipe = desk.buildRecipe();

  return {
    version: recipe.version,
    transformations: recipe.deltas.length,
  };
});

// Sample data
const data = [
  {
    name: 'john doe',
    age: 30,
    dob: new Date('1993-05-15T00:00:00Z'),
    active: true,
    city: 'marseille',
    email: 'john.doe@example.com',
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
    name: 'laurie anderson',
    age: 28,
    active: false,
    city: 'brussels',
    email: 'laurie.anderson@example.com',
    address: {
      street: '456 elm st',
      zip: '1000',
    },
    hobbies: ['dancing', 'choreography'],
  },
  {
    name: 'marie curie',
    age: 35,
    dob: new Date('1988-03-20T00:00:00Z'),
    active: true,
    city: 'paris',
    email: 'marie.curie@example.com',
    address: {
      street: '789 oak ave',
      zip: '75001',
      custom: {
        info: 'scientist',
      },
    },
  },
];
</script>
<template>
  <div class="h-auto md:h-164 md:max-h-164 overflow-hidden flex flex-col p-3 sm:p-4 lg:p-4">
    <div class="mb-3 lg:mb-4">
      <h1 class="text-2xl lg:text-2xl font-bold text-slate-900 dark:text-slate-100">
        Custom Object Transformer
      </h1>
      <p class="text-sm text-slate-600 dark:text-slate-400 mt-1">
        Transform your data with a beautiful, customizable interface
      </p>
    </div>

    <ObjectTransformer
      ref="transformerRef"
      v-slot="{ desk }"
      :data="data"
      class="flex flex-col lg:flex-row w-full flex-1 gap-3 lg:gap-4 min-h-0"
    >
      <!-- Transform Components (hidden) -->
      <TransformString />
      <TransformNumber />
      <TransformDate />
      <TransformBoolean />
      <TransformObject />
      <TransformArray />
      <ConditionString />

      <!-- Left Panel - Data Tree -->
      <div
        class="flex-1 flex flex-col gap-3 min-h-[400px] lg:min-h-0 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 p-3 lg:p-4"
      >
        <div class="flex items-center justify-between shrink-0 flex-wrap gap-2">
          <h2
            class="text-base lg:text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2"
          >
            <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
            Data Explorer
          </h2>
          <ModeToggle :desk="desk" />
        </div>

        <ModelInsights :desk="desk" class="shrink-0" />

        <div
          class="flex-1 min-h-0 overflow-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 p-4"
        >
          <CustomRecursiveNode :key="treeKey" />
        </div>
      </div>

      <!-- Right Panel - Tabs -->
      <div
        class="flex-1 flex flex-col min-h-[400px] lg:min-h-0 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 p-3 lg:p-4"
      >
        <Tabs default-value="preview" class="flex flex-col h-full min-h-0">
          <div class="flex items-center justify-between mb-3 shrink-0">
            <TabsList class="grid w-full sm:max-w-md grid-cols-2">
              <TabsTrigger value="preview" class="flex items-center gap-2">
                <span class="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                Preview
              </TabsTrigger>
              <TabsTrigger value="recipe" class="flex items-center gap-2">
                <span class="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                Recipe
                <Badge v-if="stats" variant="secondary" class="ml-1 text-xs">
                  {{ stats.transformations }}
                </Badge>
              </TabsTrigger>
            </TabsList>
          </div>

          <!-- Preview Tab -->
          <TabsContent value="preview" class="flex-1 min-h-0 mt-0 data-[state=inactive]:hidden">
            <div class="flex flex-col h-full gap-3">
              <div class="flex items-center justify-between shrink-0">
                <h3 class="text-base font-semibold text-slate-900 dark:text-slate-100">
                  Transformed Output
                </h3>
              </div>

              <ObjectPreview
                v-slot="{ formattedJson, state, handlers, virtualScroll, components }"
                class="flex-1 min-h-0"
              >
                <div class="relative h-full flex flex-col">
                  <!-- Custom progress bar at top -->
                  <div
                    v-if="state.isGenerating"
                    class="absolute top-0 left-0 right-0 h-1 bg-slate-200 dark:bg-slate-700 overflow-hidden rounded-t-lg z-50"
                  >
                    <div
                      class="h-full bg-linear-to-r from-blue-500 to-purple-500 transition-all duration-300"
                      :style="{ width: `${state.progress}%` }"
                    />
                  </div>

                  <!-- Custom copy button -->
                  <button
                    v-if="formattedJson"
                    class="absolute top-2 right-2 sm:top-4 sm:right-4 z-10 p-1.5 sm:p-2 rounded-lg bg-slate-900/90 dark:bg-slate-100/90 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 transition-all duration-200 shadow-lg hover:shadow-xl"
                    :class="{ 'ring-2 ring-emerald-500': state.isCopied }"
                    @click="handlers.copyToClipboard"
                  >
                    <component
                      :is="state.isCopied ? components.Check : components.Copy"
                      class="w-3.5 h-3.5 sm:w-4 sm:h-4"
                      :class="{ 'text-emerald-500': state.isCopied }"
                    />
                  </button>

                  <!-- Custom preview content -->
                  <div
                    v-if="formattedJson"
                    class="flex-1 min-h-0 overflow-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 p-4"
                  >
                    <!-- Virtual scroll for large JSON -->
                    <div
                      v-if="virtualScroll.shouldUseVirtualScroll"
                      v-bind="virtualScroll.containerProps"
                    >
                      <div v-bind="virtualScroll.wrapperProps">
                        <div
                          v-for="{ data: line, index } in virtualScroll.virtualList"
                          :key="index"
                          class="font-mono text-xs text-slate-900 dark:text-slate-100 leading-[18px] h-[18px] whitespace-pre"
                          v-text="line"
                        />
                      </div>
                    </div>

                    <!-- Standard for small JSON -->
                    <pre
                      v-else
                      class="font-mono text-xs text-slate-900 dark:text-slate-100 whitespace-pre-wrap wrap-break-word"
                    ><code>{{ formattedJson }}</code></pre>
                  </div>
                </div>
              </ObjectPreview>
            </div>
          </TabsContent>

          <!-- Recipe Tab -->
          <TabsContent value="recipe" class="flex-1 min-h-0 mt-0 data-[state=inactive]:hidden">
            <div class="flex flex-col h-full gap-3">
              <div class="flex items-center justify-between shrink-0">
                <div>
                  <h3 class="text-base font-semibold text-slate-900 dark:text-slate-100">
                    Transformation Recipe
                  </h3>
                  <p v-if="stats" class="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    Version {{ stats.version }} • {{ stats.transformations }} operation{{
                      stats.transformations !== 1 ? 's' : ''
                    }}
                  </p>
                </div>
              </div>

              <RecipePreview
                v-slot="{ formattedRecipe, state, handlers, refs, components }"
                class="flex-1 min-h-0"
              >
                <div class="flex flex-col h-full gap-4">
                  <!-- Custom action buttons -->
                  <div class="flex flex-col sm:flex-row gap-2 shrink-0">
                    <button
                      class="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors shadow-sm hover:shadow"
                      @click="handlers.downloadRecipe"
                    >
                      <component :is="components.Download" class="w-4 h-4" />
                      <span class="hidden sm:inline">Export Recipe</span>
                      <span class="sm:hidden">Export</span>
                    </button>
                    <button
                      class="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      :disabled="state.isImporting"
                      @click="handlers.triggerFileUpload"
                    >
                      <component :is="components.Upload" class="w-4 h-4" />
                      <span class="hidden sm:inline">Import Recipe</span>
                      <span class="sm:hidden">Import</span>
                    </button>
                    <input
                      :ref="(el) => (refs.fileInput = el as HTMLInputElement)"
                      type="file"
                      accept=".json,application/json"
                      class="hidden"
                      @change="handlers.handleFileUpload"
                    />
                  </div>

                  <!-- Import feedback -->
                  <div
                    v-if="state.isImporting || state.importStatus !== 'idle'"
                    class="shrink-0 rounded-lg border p-4 flex flex-col gap-3 animate-in fade-in slide-in-from-top-2"
                    :class="{
                      'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800':
                        state.importStatus === 'idle',
                      'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800':
                        state.importStatus === 'success',
                      'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800':
                        state.importStatus === 'error',
                    }"
                  >
                    <div class="flex items-center gap-3">
                      <component
                        :is="
                          state.importStatus === 'success'
                            ? components.CheckCircle2
                            : state.importStatus === 'error'
                              ? components.XCircle
                              : components.Upload
                        "
                        class="w-5 h-5 shrink-0"
                        :class="{
                          'text-blue-600 dark:text-blue-400 animate-pulse':
                            state.importStatus === 'idle',
                          'text-emerald-600 dark:text-emerald-400':
                            state.importStatus === 'success',
                          'text-red-600 dark:text-red-400': state.importStatus === 'error',
                        }"
                      />
                      <span class="font-medium text-sm">
                        {{ state.importMessage || 'Importing recipe...' }}
                      </span>
                    </div>

                    <!-- Custom progress bar -->
                    <div class="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        class="h-full transition-all duration-300 rounded-full"
                        :class="{
                          'bg-blue-500': state.importStatus === 'idle',
                          'bg-emerald-500': state.importStatus === 'success',
                          'bg-red-500': state.importStatus === 'error',
                        }"
                        :style="{ width: `${state.importProgress}%` }"
                      />
                    </div>
                  </div>

                  <!-- Recipe content with custom styling -->
                  <div
                    class="relative flex-1 min-h-0 overflow-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50"
                  >
                    <button
                      class="absolute top-2 right-2 sm:top-4 sm:right-4 z-10 p-1.5 sm:p-2 rounded-lg bg-slate-900/90 dark:bg-slate-100/90 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 transition-all duration-200 shadow-lg hover:shadow-xl"
                      :class="{ 'ring-2 ring-emerald-500': state.isCopied }"
                      @click="handlers.copyToClipboard"
                    >
                      <component
                        :is="state.isCopied ? components.Check : components.Copy"
                        class="w-3.5 h-3.5 sm:w-4 sm:h-4"
                        :class="{ 'text-emerald-500': state.isCopied }"
                      />
                    </button>

                    <pre
                      class="p-2 sm:p-4 text-xs font-mono text-slate-900 dark:text-slate-100 whitespace-pre-wrap wrap-break-word"
                    ><code>{{ formattedRecipe }}</code></pre>
                  </div>
                </div>
              </RecipePreview>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </ObjectTransformer>
  </div>
</template>
