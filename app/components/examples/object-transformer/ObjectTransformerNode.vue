<script setup lang="ts">
import { computed, ref, type ComputedRef } from 'vue';
import { useCheckIn } from 'vue-airport';
import {
  ObjectTransformerNode,
  type ObjectNode,
  type Transform,
  type ObjectNodeType,
  ObjectTransformerDeskKey,
  type ObjectTransformerContext,
} from '.';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronDown, ChevronRight } from 'lucide-vue-next';

type DeskWithContext = typeof desk & ObjectTransformerContext;

const props = defineProps<{ tree: ObjectNode }>();

const { checkIn } = useCheckIn<ObjectNode, ObjectTransformerContext>();
const { desk } = checkIn(ObjectTransformerDeskKey);
const deskWithContext = desk as DeskWithContext;

const transforms: ComputedRef<Transform[]> = computed(() => {
  return deskWithContext.transforms.value;
});
const availableTransforms = computed(() => {
  const type = deskWithContext.getNodeType(tree.value);
  return transforms.value.filter((t) => t.if({ ...tree.value, type: type as ObjectNodeType }));
});

const isOpen = ref(true);
const toggleOpen = () => {
  isOpen.value = !isOpen.value;
};

const tree = ref(props.tree);
// Initialize nodeSelect: null if no transforms, otherwise show the last one
const nodeSelect = ref<string | null>(
  props.tree.transforms.length > 0 ? props.tree.transforms.at(-1)?.name || null : null
);
const stepSelect = ref<Record<number, string | null>>({});

const isPrimitive = computed(() =>
  [
    'string',
    'number',
    'boolean',
    'bigint',
    'symbol',
    'undefined',
    'null',
    'date',
    'function',
  ].includes(tree.value.type)
);
const editingKey = ref(false);
const tempKey = ref(props.tree.key);

function sanitizeKey(key: string): string | null {
  if (!key) return null;
  if (deskWithContext.forbiddenKeys.value.includes(key)) return null;
  if (key.startsWith('__') && key.endsWith('__')) return null;
  if (key.includes('.')) return null;

  return key;
}

function autoRenameKey(parent: ObjectNode, base: string) {
  let safeBase = sanitizeKey(base);
  if (!safeBase) safeBase = 'key'; // fallback

  if (!parent.children?.some((c) => c.key === safeBase)) {
    return safeBase;
  }

  let i = 1;
  let candidate = `${safeBase}_${i}`;

  while (parent.children?.some((c) => c.key === candidate)) {
    i++;
    candidate = `${safeBase}_${i}`;
  }

  return candidate;
}

// Validate and apply key change
function confirmKeyChange() {
  const newKey = tempKey.value?.trim();

  // Empty key → revert
  if (!newKey) {
    tempKey.value = props.tree.key;
    editingKey.value = false;
    return;
  }

  // Forbidden key → revert
  if (!sanitizeKey(newKey)) {
    tempKey.value = props.tree.key;
    editingKey.value = false;
    return;
  }

  // Identical → close
  if (newKey === props.tree.key) {
    editingKey.value = false;
    return;
  }

  const parent = props.tree.parent;

  if (parent?.type === 'object' && parent.children) {
    const finalKey = autoRenameKey(parent, newKey);
    tree.value.key = finalKey;
    tempKey.value = finalKey;
  }

  editingKey.value = false;
}

// Annuler
function cancelKeyChange() {
  tempKey.value = props.tree.key;
  editingKey.value = false;
}

// Add or remove a transformation on the node
function handleNodeTransform(name: any) {
  if (!name) return;

  if (name === 'None') {
    tree.value.transforms = [];
    nodeSelect.value = null;
    stepSelect.value = {};
  } else {
    const previousValue = nodeSelect.value;

    if (!previousValue || previousValue === '+') {
      // ADDING a new transformation
      const transform = transforms.value.find((t) => t.name === name);
      if (transform) {
        tree.value.transforms.push({
          ...transform,
          params: initParams(transform),
        });
        nodeSelect.value = name;
      }
    } else if (previousValue !== name) {
      // CHANGING - clear all and add the new one
      const transform = transforms.value.find((t) => t.name === name);

      if (transform) {
        // Clear all transformations and add only the new one
        tree.value.transforms = [
          {
            ...transform,
            params: initParams(transform),
          },
        ];
        nodeSelect.value = name;
        // Clear all step selects
        stepSelect.value = {};
      }
    }
    // If previousValue === name, do nothing (same transform selected again)
  }

  if (tree.value.parent) deskWithContext.propagateTransform(tree.value.parent);
}

// Add or remove a transformation after a step in the stack
function handleStepTransform(index: number, name: any) {
  if (!name) return;

  if (name === 'None') {
    // Remove this transformation and all following ones
    // index is the transform index, we remove from index + 1 onwards
    tree.value.transforms.splice(index + 1);

    // Clean up stepSelect for removed transforms
    // stepSelect[i+1] is displayed for transform at index i
    // After removing from index+1, we need to reset stepSelect[index+1] to null
    // and remove all stepSelect entries after that
    const newStepSelect: Record<number, string | null> = {};
    Object.keys(stepSelect.value).forEach((key) => {
      const keyNum = parseInt(key);
      if (keyNum < index + 1) {
        // Keep selects before the one we clicked
        const val = stepSelect.value[keyNum];
        if (val !== undefined) {
          newStepSelect[keyNum] = val;
        }
      }
    });
    // Reset the select we clicked to null (will show "+")
    newStepSelect[index + 1] = null;

    stepSelect.value = newStepSelect;

    // Don't touch nodeSelect - it should remain showing the first transformation
  } else {
    const t = transforms.value.find((x) => x.name === name);
    if (t) {
      tree.value.transforms.splice(index + 1, 0, { ...t, params: initParams(t) });
      // Update the Select for the newly added step
      // The select after transform at index is stepSelect[index + 1]
      stepSelect.value[index + 1] = tree.value.transforms[index + 1]?.name || null;
    }
  }

  if (tree.value.parent) deskWithContext.propagateTransform(tree.value.parent);
}

function initParams(t: Transform) {
  return t.params?.map((p) => p.default ?? null) || [];
}

// Calculate the cumulative value up to a step
function computeStepValue(index: number) {
  return tree.value.transforms
    .slice(0, index + 1)
    .reduce((val, t) => t.fn(val, ...(t.params || [])), tree.value.value);
}

// Get the type of a computed value
function getComputedValueType(value: any): ObjectNodeType {
  return deskWithContext.getNodeType({ ...tree.value, value });
}

// Format value for display
function formatValue(value: any, type: ObjectNodeType): string {
  if (type === 'date' && value instanceof Date) {
    return value.toISOString();
  }
  if (type === 'function') {
    return `[Function: ${value.name || 'anonymous'}]`;
  }
  if (type === 'bigint') {
    return `${value}n`;
  }
  if (type === 'symbol') {
    return value.toString();
  }
  if (type === 'undefined') {
    return 'undefined';
  }
  if (type === 'null') {
    return 'null';
  }
  return String(value);
}
</script>

<template>
  <div class="text-xs mb-4">
    <div class="flex items-center gap-2 my-2">
      <template v-if="tree.children?.length">
        <ChevronRight
          v-if="!isOpen"
          class="w-3 h-3 text-muted-foreground cursor-pointer"
          @click="toggleOpen"
        />
        <ChevronDown
          v-else-if="isOpen"
          class="w-3 h-3 text-muted-foreground cursor-pointer"
          @click="toggleOpen"
        />
      </template>

      <div class="cursor-pointer" @click="editingKey = true">
        <template v-if="editingKey">
          <Input
            v-model="tempKey"
            class="h-6 px-2 py-0 text-xs"
            autofocus
            @keyup.enter="confirmKeyChange"
            @blur="confirmKeyChange"
            @keyup.esc="cancelKeyChange"
          />
        </template>

        <template v-else>
          <span class="font-semibold">{{ tree.key }}</span>
        </template>
      </div>

      <!-- Valeur s'affiche juste pour primitives -->
      <template v-if="isPrimitive">
        <span class="ml-2 text-muted-foreground italic">
          {{ formatValue(tree.value, tree.type) }}
        </span>
      </template>

      <!-- Select principal -->
      <template v-if="availableTransforms.length > 0">
        <Select :model-value="nodeSelect" @update:model-value="handleNodeTransform">
          <!-- @vue-ignore -->
          <SelectTrigger size="xs" class="px-2 py-1">
            <SelectValue placeholder="+" class="text-xs">
              {{ nodeSelect || '+' }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent class="text-xs">
            <SelectGroup>
              <SelectLabel>Transformations</SelectLabel>
              <SelectItem value="None" class="text-xs">Remove all</SelectItem>
              <SelectItem
                v-for="tr in availableTransforms"
                :key="tr.name"
                :value="tr.name"
                class="text-xs"
              >
                {{ tr.name }}
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </template>
    </div>

    <template v-if="isOpen">
      <!-- Children récursifs -->
      <div v-if="tree.children?.length" class="ml-1 border-l-2 pl-2">
        <ObjectTransformerNode
          v-for="child in tree.children"
          :key="child.key || child.value"
          :tree="child"
          class="ml-4"
        />
      </div>

      <!-- Stack des transformations avec Select pour enchaîner -->
      <div v-if="tree.transforms.length" class="ml-5 pl-2 border-l-2">
        <div
          v-for="(t, index) in tree.transforms"
          :key="index"
          class="flex items-center gap-2 my-2"
        >
          <span class="text-blue-600 text-xs pl-5">
            {{
              formatValue(computeStepValue(index), getComputedValueType(computeStepValue(index)))
            }}
          </span>

          <template v-if="availableTransforms.length > 1">
            <!-- PARAM INPUTS FOR STACK -->
            <!-- PARAM INPUTS FOR STACK -->
            <div v-if="t.params" class="flex gap-2">
              <div v-for="(_p, pi) in t.params" :key="'stack-param-' + index + '-' + pi">
                <Input
                  v-if="transforms.find((x) => x.name === t.name)?.params?.[pi].type === 'text'"
                  v-model="t.params[pi]"
                  :placeholder="transforms.find((x) => x.name === t.name)?.params?.[pi].label"
                  class="h-6.5 px-2 py-0"
                  style="font-size: var(--text-xs)"
                  @input="deskWithContext.propagateTransform(tree)"
                />

                <Input
                  v-else-if="
                    transforms.find((x) => x.name === t.name)?.params?.[pi].type === 'number'
                  "
                  v-model.number="t.params[pi]"
                  type="number"
                  :placeholder="transforms.find((x) => x.name === t.name)?.params?.[pi].label"
                  class="h-6.5 px-2 py-0 text-xs"
                  @input="deskWithContext.propagateTransform(tree)"
                />

                <div
                  v-else-if="
                    transforms.find((x) => x.name === t.name)?.params?.[pi].type === 'boolean'
                  "
                  class="flex items-center gap-1"
                >
                  <Checkbox
                    :checked="t.params[pi]"
                    @update:checked="
                      (v: any) => {
                        t.params![pi] = v;
                        deskWithContext.propagateTransform(tree);
                      }
                    "
                  />
                  <span class="text-xs">{{ t.params![pi] ? 'true' : 'false' }}</span>
                </div>
              </div>
            </div>

            <Select
              :model-value="stepSelect[index + 1]"
              size="xs"
              @update:model-value="(val) => handleStepTransform(index, val)"
            >
              <!-- @vue-ignore -->
              <SelectTrigger size="xs" class="px-2 py-1">
                <SelectValue placeholder="+" class="text-xs" />
              </SelectTrigger>
              <SelectContent class="text-xs">
                <SelectGroup>
                  <SelectLabel>Next Transformation</SelectLabel>
                  <SelectItem value="None" class="text-xs">Remove this & following</SelectItem>
                  <SelectItem
                    v-for="tr in availableTransforms"
                    :key="tr.name"
                    :value="tr.name"
                    class="text-xs"
                  >
                    {{ tr.name }}
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </template>
        </div>
      </div>
    </template>
  </div>
</template>
