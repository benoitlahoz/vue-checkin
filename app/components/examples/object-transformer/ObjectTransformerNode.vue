<script setup lang="ts">
import { computed, ref, type ComputedRef } from 'vue';
import { useCheckIn } from 'vue-airport';
import {
  ObjectTransformerNode,
  ObjectTransformerParamInput,
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
import { ChevronDown, ChevronRight } from 'lucide-vue-next';

type DeskWithContext = typeof desk & ObjectTransformerContext;

const props = defineProps<{ tree: ObjectNode }>();

const { checkIn } = useCheckIn<ObjectNode, ObjectTransformerContext>();
const { desk } = checkIn(ObjectTransformerDeskKey);
const deskWithContext = desk as DeskWithContext;

const tree = ref(props.tree);

// Capture the original type once and keep it stable
const originalType = deskWithContext.getNodeType(props.tree);

const transforms: ComputedRef<Transform[]> = computed(() => {
  return deskWithContext.transforms.value;
});

// Transformations available for the main select (based on original type)
const availableTransforms = computed(() => {
  return transforms.value.filter((t) =>
    t.if({ ...tree.value, type: originalType as ObjectNodeType })
  );
});

// Transformations available for step selects (based on transformed type)
const availableStepTransforms = computed(() => {
  let transformedValue = tree.value.value;

  // Appliquer les transformations jusqu'à rencontrer une transformation structurelle
  for (const t of tree.value.transforms) {
    const result = t.fn(transformedValue, ...(t.params || []));

    // Si c'est une transformation structurelle, arrêter
    const isStructural = result && typeof result === 'object' && result.__structuralChange === true;
    if (isStructural) {
      break;
    }

    // Transformation normale
    transformedValue = result;
  }

  const transformedType = deskWithContext.getNodeType({ ...tree.value, value: transformedValue });
  return transforms.value.filter((t) =>
    t.if({ ...tree.value, type: transformedType as ObjectNodeType, value: transformedValue })
  );
});

const isOpen = ref(true);
const toggleOpen = () => {
  isOpen.value = !isOpen.value;
};

const nodeSelect = ref<string | null>(
  props.tree.transforms.length > 0 ? props.tree.transforms.at(-1)?.name || null : null
);
const stepSelect = ref<Record<number, string | null>>({});

const isPrimitive = computed(() => deskWithContext.primitiveTypes.includes(tree.value.type));
const editingKey = ref(false);
const tempKey = ref(props.tree.key);

function confirmKeyChange() {
  const newKey = tempKey.value?.trim();

  if (!newKey) {
    tempKey.value = props.tree.key;
    editingKey.value = false;
    return;
  }

  if (!deskWithContext.sanitizeKey(newKey)) {
    tempKey.value = props.tree.key;
    editingKey.value = false;
    return;
  }

  if (newKey === props.tree.key) {
    editingKey.value = false;
    return;
  }

  const parent = props.tree.parent;

  if (parent?.type === 'object' && parent.children) {
    const finalKey = deskWithContext.autoRenameKey(parent, newKey);
    tree.value.key = finalKey;
    tempKey.value = finalKey;
  }

  editingKey.value = false;
}

function cancelKeyChange() {
  tempKey.value = props.tree.key;
  editingKey.value = false;
}

function handleNodeTransform(name: unknown) {
  const transformName = typeof name === 'string' ? name : null;

  if (!transformName || transformName === 'None') {
    tree.value.transforms = [];
    nodeSelect.value = null;
    stepSelect.value = {};
    if (tree.value.parent) deskWithContext.propagateTransform(tree.value.parent);
    return;
  }

  const previousValue = nodeSelect.value;
  const shouldAdd = !previousValue || previousValue === '+';
  const shouldChange = previousValue && previousValue !== '+' && previousValue !== transformName;

  if (!shouldAdd && !shouldChange) return;

  // Si on change de transformation et qu'on a un parent, nettoyer les éventuels nœuds splittés
  if (shouldChange && tree.value.parent) {
    const baseKeyPrefix = (tree.value.key || 'part') + '_';
    const hasSplitNodes = tree.value.parent.children!.some(
      (child) => child !== tree.value && child.key?.startsWith(baseKeyPrefix)
    );
    
    if (hasSplitNodes) {
      // Supprimer tous les nœuds splittés
      tree.value.parent.children = tree.value.parent.children!.filter(
        (child) => child === tree.value || !child.key?.startsWith(baseKeyPrefix)
      );
    }
  }

  const entry = deskWithContext.createTransformEntry(transformName);
  if (!entry) return;

  if (shouldAdd) {
    tree.value.transforms.push(entry);
  } else {
    tree.value.transforms = [entry];
    stepSelect.value = {};
  }

  nodeSelect.value = transformName;

  // Propager d'abord au nœud lui-même pour traiter les transformations structurelles
  deskWithContext.propagateTransform(tree.value);

  // Puis propager au parent pour mettre à jour sa valeur
  if (tree.value.parent) deskWithContext.propagateTransform(tree.value.parent);
}

function handleStepTransform(index: number, name: unknown) {
  const transformName = typeof name === 'string' ? name : null;

  if (!transformName) return;

  if (transformName === 'None') {
    // Remove the selected transformation and all following ones from the pipeline
    tree.value.transforms.splice(index + 1);

    // Clean up stepSelect: keep only entries before the clicked select, then reset it to null
    const newStepSelect = Object.fromEntries(
      Object.entries(stepSelect.value).filter(([key]) => parseInt(key) < index + 1)
    );
    newStepSelect[index + 1] = null;
    stepSelect.value = newStepSelect;
  } else {
    const entry = deskWithContext.createTransformEntry(transformName);
    if (entry) {
      tree.value.transforms.splice(index + 1, 0, entry);
      stepSelect.value[index + 1] = tree.value.transforms[index + 1]?.name || null;
    }
  }

  // Propager d'abord au nœud lui-même pour traiter les transformations structurelles
  deskWithContext.propagateTransform(tree.value);

  // Puis propager au parent pour mettre à jour sa valeur
  if (tree.value.parent) deskWithContext.propagateTransform(tree.value.parent);
}

function getParamConfig(transformName: string, paramIndex: number) {
  return transforms.value.find((x) => x.name === transformName)?.params?.[paramIndex];
}

function getFormattedStepValue(index: number): string {
  const value = deskWithContext.computeStepValue(tree.value, index);
  const type = deskWithContext.getComputedValueType(tree.value, value);
  return deskWithContext.formatValue(value, type);
}

function isStructuralTransform(transformIndex: number): boolean {
  const t = tree.value.transforms[transformIndex];
  if (!t) return false;

  // Calculer la valeur jusqu'à cette transformation
  const value = deskWithContext.computeStepValue(tree.value, transformIndex);
  const result = t.fn(value, ...(t.params || []));

  return result && typeof result === 'object' && result.__structuralChange === true;
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
          {{ deskWithContext.formatValue(tree.value, tree.type) }}
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
          v-for="(child, index) in tree.children"
          :key="`${child.key}-${index}-${JSON.stringify(child.value)}`"
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
            {{ getFormattedStepValue(index) }}
          </span>

          <template v-if="!isStructuralTransform(index)">
            <template v-if="availableStepTransforms.length > 1">
              <div v-if="t.params" class="flex gap-2">
                <ObjectTransformerParamInput
                  v-for="(_p, pi) in t.params"
                  :key="`param-${index}-${pi}`"
                  v-model="t.params[pi]"
                  :config="getParamConfig(t.name, pi)"
                  @change="
                    () => {
                      deskWithContext.propagateTransform(tree);
                      if (tree.parent) deskWithContext.propagateTransform(tree.parent);
                    }
                  "
                />
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
                      v-for="tr in availableStepTransforms"
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
          </template>

          <template v-else>
            <div v-if="t.params" class="flex gap-2">
              <ObjectTransformerParamInput
                v-for="(_p, pi) in t.params"
                :key="`param-${index}-${pi}`"
                v-model="t.params[pi]"
                :config="getParamConfig(t.name, pi)"
                @change="
                  () => {
                    deskWithContext.propagateTransform(tree);
                    if (tree.parent) deskWithContext.propagateTransform(tree.parent);
                  }
                "
              />
            </div>
          </template>
        </div>
      </div>
    </template>
  </div>
</template>
