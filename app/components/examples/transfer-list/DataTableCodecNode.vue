<script setup lang="ts">
import { defineProps, defineEmits, ref, computed } from 'vue';
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

// Props
type TransformParam = {
  name: string;
  type: 'string';
  label: string;
  default: any;
};

type Transform = {
  name: string;
  if: (val: any) => boolean;
  fn: (...args: any[]) => any;
  params: TransformParam[];
};

type TransformNode = {
  name?: string;
  params: Record<string, any>;
  children: TransformNode[];
};

const props = defineProps<{
  node: TransformNode;
  parentList?: TransformNode[];
  index: number;
  transforms: Transform[];
  inputValue?: any; // valeur d'entrée à ce niveau
}>();

const isOpen = ref(true);

// Calcule la valeur courante à ce niveau
const currentValue = computed(() => {
  const t = props.transforms.find((x) => x.name === props.node.name);
  if (!t) return props.inputValue;
  if (!t.if(props.inputValue)) return props.inputValue;
  const args = t.params.map((p) => props.node.params[p.name]);
  return t.fn(props.inputValue, ...args);
});

const emit = defineEmits<{
  (e: 'add-child', parentList: TransformNode[], index: number, transformName: string): void;
  (e: 'add-sibling', parentList: TransformNode[], index: number): void;
  (e: 'remove', parentList: TransformNode[], index: number): void;
  (e: 'update-param', node: TransformNode, paramName: string, value: any): void;
  (
    e: 'update-transform',
    node: TransformNode,
    transformName: string,
    params: Record<string, any>
  ): void;
}>();

function handleAddChildTransform(value: any) {
  if (value == null) return;
  if (props.parentList) {
    emit('add-child', props.parentList, props.index, String(value));
  }
}

function handleRemove() {
  if (props.parentList) {
    emit('remove', props.parentList, props.index);
  }
}

function handleParamInput(paramName: string, value: any) {
  emit('update-param', props.node, paramName, value);
}

function handleSelectTransform(value: string | null) {
  if (!value) return;
  const t = props.transforms.find((x) => x.name === value);
  if (!t) return;
  // Prépare les paramètres par défaut
  const params: Record<string, any> = {};
  t.params.forEach((p) => (params[p.name] = p.default));
  emit('update-transform', props.node, value, params);
  // Si Split, demander au parent d'ajouter des enfants vides
  if (t.name === 'Split') {
    emit('add-child', props.parentList!, props.index, value);
  } else if (!props.node.name) {
    // Pipeline : ajouter un sibling vide seulement si le nœud était vide
    emit('add-sibling', props.parentList!, props.index);
  }
}
</script>

<template>
  <div class="border-l pl-4 my-2">
    <div class="flex items-center gap-2 mb-2">
      <button class="text-xs px-1" @click="isOpen = !isOpen">
        <span v-if="isOpen">▼</span>
        <span v-else>▶</span>
      </button>
      <span class="font-semibold">{{ props.node.name }}</span>
      <button v-if="props.parentList" class="text-red-500 text-xs" @click="handleRemove">
        Retirer
      </button>
    </div>

    <div v-if="isOpen" class="flex flex-row items-start gap-4">
      <!-- Colonne gauche : valeur d'entrée (avant transformation) -->
      <div class="min-w-[120px] font-mono text-sm py-1 px-2 border rounded">
        {{ props.inputValue }}
      </div>

      <!-- Colonne droite : transformation + params -->
      <div class="flex-1">
        <div v-if="props.parentList" class="flex items-center gap-2 mb-2">
          <Select class="w-[140px]" @update:model-value="handleSelectTransform">
            <SelectTrigger>
              <SelectValue :placeholder="props.node.name || 'Transformation...'" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem v-for="t in props.transforms" :key="t.name" :value="t.name">
                  <SelectLabel>{{ t.name }}</SelectLabel>
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <span class="text-xs text-gray-400">Transformation</span>
        </div>
        <div
          v-for="p in props.node.name
            ? props.transforms.find((t: Transform) => t.name === props.node.name)?.params || []
            : []"
          :key="p.name"
          class="mb-2"
        >
          <label class="block text-sm font-medium mb-1">{{ p.label }}</label>
          <Input
            type="text"
            :model-value="props.node.params[p.name]"
            @update:model-value="(val) => handleParamInput(p.name, val)"
          />
        </div>
        <!-- (Select d'ajout de sous-transformation supprimé, un seul select par nœud) -->
      </div>
    </div>

    <!-- Children : stack verticale ou branches (split) -->
    <div v-if="isOpen && props.node.children.length">
      <div v-if="Array.isArray(currentValue)" class="ml-6 mt-2 border-l-2 border-gray-200">
        <DataTableCodecNode
          v-for="(child, cidx) in props.node.children"
          :key="cidx"
          :node="child"
          :parent-list="props.node.children"
          :index="cidx"
          :transforms="props.transforms"
          :input-value="currentValue[cidx]"
          @add-child="(...args) => emit('add-child', ...args)"
          @remove="(...args) => emit('remove', ...args)"
          @update-param="(...args) => emit('update-param', ...args)"
        />
      </div>
      <div v-else>
        <DataTableCodecNode
          v-for="(child, cidx) in props.node.children"
          :key="cidx"
          :node="child"
          :parent-list="props.node.children"
          :index="cidx"
          :transforms="props.transforms"
          :input-value="currentValue"
          @add-child="(...args) => emit('add-child', ...args)"
          @remove="(...args) => emit('remove', ...args)"
          @update-param="(...args) => emit('update-param', ...args)"
        />
      </div>
    </div>
  </div>
</template>
