<script setup lang="ts">
import { provide } from 'vue';
import { ObjectNode } from '@vue-airport/object-transformer';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Plus } from 'lucide-vue-next';

interface Props {
  id?: string | null;
  class?: string;
}

withDefaults(defineProps<Props>(), {
  id: null,
  class: '',
});

// Helper to check if node is root
const isRootNode = (node: any) => {
  return node.parent === null || node.parent === undefined;
};

// Provide custom node component for recursive children
provide('customObjectNode', true);
</script>

<template>
  <ObjectNode
    :id="id"
    v-slot="{
      node,
      nodeId,
      isHovered,
      isEditing,
      displayValue,
      shouldShowChildren,
      handlers,
      components,
    }"
  >
    <!-- Custom node layout with Tailwind -->
    <div
      class="flex items-start gap-2 py-1 px-2 rounded transition-colors duration-150"
      :class="{
        'bg-slate-100 dark:bg-slate-800': isHovered && !node.deleted,
        'opacity-50': node.deleted,
      }"
      @mouseenter="handlers.setHovered(true)"
      @mouseleave="handlers.setHovered(false)"
    >
      <!-- Open/Close icon for objects/arrays -->
      <component
        :is="components.NodeOpen"
        v-if="shouldShowChildren"
        :node-id="nodeId"
        class="shrink-0 mt-0.5"
      />
      <div v-else class="w-4 shrink-0" />

      <!-- Delete/Restore actions (hidden for root) -->
      <component
        :is="components.NodeActions"
        v-if="!isRootNode(node)"
        :node-id="nodeId"
        :is-visible="isHovered"
        class="shrink-0 mt-0.5"
      />
      <div v-else class="w-4 shrink-0" />

      <!-- Key editor or display (hidden for root) -->
      <component
        :is="components.NodeKeyEditor"
        v-if="!isRootNode(node)"
        :node-id="nodeId"
        :is-editing="isEditing"
        class="shrink-0"
      />
      <span v-else class="font-mono text-xs font-semibold text-slate-900 dark:text-slate-100">
        {{ Array.isArray(node.value) ? 'Array' : 'Object' }}
      </span>

      <!-- Value display with custom styling -->
      <div class="flex-1 min-w-0 flex flex-col gap-1">
        <!-- Original value with type badge (only for non-root) -->
        <div v-if="!isRootNode(node)" class="flex items-center gap-2 flex-wrap">
          <span
            class="font-mono text-xs px-1.5 py-0.5 rounded text-slate-700 dark:text-slate-300"
            :class="{
              'bg-blue-100 dark:bg-blue-900/30': typeof displayValue === 'string',
              'bg-purple-100 dark:bg-purple-900/30': typeof displayValue === 'number',
              'bg-green-100 dark:bg-green-900/30': typeof displayValue === 'boolean',
              'bg-orange-100 dark:bg-orange-900/30': displayValue instanceof Date,
              'bg-slate-200 dark:bg-slate-700': typeof displayValue === 'object',
            }"
          >
            {{
              typeof displayValue === 'object' && displayValue !== null
                ? Array.isArray(displayValue)
                  ? 'array'
                  : 'object'
                : typeof displayValue
            }}
          </span>
          <span
            v-if="typeof displayValue !== 'object'"
            class="font-mono text-xs text-slate-600 dark:text-slate-400 truncate"
          >
            {{ displayValue }}
          </span>
        </div>

        <!-- Transforms list with custom dropdown -->
        <component
          :is="components.NodeTransformsList"
          v-if="!isRootNode(node)"
          :node-id="nodeId"
          class="text-xs"
        >
          <template
            #default="{ node: transformNode, transforms, helpers, components: transformComponents }"
          >
            <div class="flex flex-col gap-2">
              <!-- Add Transform Button -->
              <DropdownMenu>
                <DropdownMenuTrigger
                  class="inline-flex items-center gap-1 px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 w-fit"
                  :disabled="transformNode?.deleted || false"
                >
                  <Plus class="w-3 h-3" />
                  <span>Add Transform</span>
                  <ChevronDown class="w-3 h-3" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" class="w-56">
                  <!-- Transformations Sub-menu -->
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger class="text-xs">
                      <span>Transformations</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      <DropdownMenuItem
                        v-for="transform in helpers.getAvailableTransforms?.() || []"
                        :key="transform.name"
                        class="text-xs cursor-pointer"
                      >
                        <span>{{ transform.name }}</span>
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>

                  <!-- Structural Sub-menu -->
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger class="text-xs">
                      <span>Structural</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      <DropdownMenuItem class="text-xs cursor-pointer">
                        <span>Extract</span>
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>

                  <!-- Conditions Sub-menu -->
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger class="text-xs">
                      <span>Conditions</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      <DropdownMenuItem class="text-xs cursor-pointer">
                        <span>If String</span>
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                </DropdownMenuContent>
              </DropdownMenu>

              <!-- Existing transforms -->
              <div
                v-for="(t, index) in transforms"
                :key="`${t.name}-${index}`"
                class="flex flex-col gap-1 pl-2 border-l-2 border-slate-200 dark:border-slate-700"
              >
                <!-- Transform name and value -->
                <div class="flex items-center gap-2 text-xs">
                  <span class="font-semibold text-blue-600 dark:text-blue-400">{{ t.name }}</span>
                  <span class="text-slate-600 dark:text-slate-400">→</span>
                  <span class="font-mono text-slate-900 dark:text-slate-100">
                    {{ helpers.formatStepValue(index) }}
                  </span>
                </div>

                <!-- Parameters if any -->
                <div v-if="helpers.hasParams(t.name)" class="flex flex-col gap-1">
                  <div
                    v-for="(_p, pi) in t.params"
                    :key="`param-${index}-${pi}`"
                    class="flex items-center gap-2"
                  >
                    <label class="text-xs text-slate-600 dark:text-slate-400">
                      {{ helpers.getParamConfig(t.name, pi)?.label || `Param ${pi + 1}` }}:
                    </label>
                    <component
                      :is="transformComponents.TransformerParamInput"
                      v-model="t.params![pi]"
                      :config="helpers.getParamConfig(t.name, pi)"
                      class="flex-1"
                      @change="helpers.handleParamChange()"
                    />
                  </div>
                </div>
              </div>
            </div>
          </template>
        </component>
      </div>
    </div>
  </ObjectNode>
</template>
