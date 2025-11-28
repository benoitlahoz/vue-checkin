<script setup lang="ts">
import { defineProps, defineEmits, ref, computed } from 'vue';
import type { Transform, CodecNode } from './types/codec';
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

const props = defineProps<{
  node: CodecNode;
  parent: CodecNode | null;
  isRoot?: boolean;
  transforms: Transform[];
  inputValue?: any;
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
  (e: 'add-child', node: CodecNode, transformName: string): void;
  (e: 'add-sibling', node: CodecNode): void;
  (e: 'remove', node: CodecNode, type: 'sibling' | 'child'): void;
  (e: 'update-param', node: CodecNode, paramName: string, value: any): void;
  (
    e: 'update-transform',
    node: CodecNode,
    transformName: string,
    params: Record<string, any>
  ): void;
}>();

function handleAddChildTransform(value: any) {
  if (value == null) return;
  emit('add-child', props.node, String(value));
}

function handleRemove(type: 'sibling' | 'child') {
  emit('remove', props.node, type);
}
function handleParamInput(paramName: string, value: any) {
  emit('update-param', props.node, paramName, value);
}

function handleSelectTransform(value: any) {
  if (!value) return;
  const t = props.transforms.find((x) => x.name === value);
  if (!t) return;
  const params: Record<string, any> = {};
  t.params.forEach((p) => (params[p.name] = p.default));
  emit('update-transform', props.node, value, params);
}

// Handlers pour les enfants et siblings
const handleAddSibling = (node: CodecNode) => () => emit('add-sibling', node);
const handleRemoveSibling = (node: CodecNode) => () => emit('remove', node, 'sibling');
const handleRemoveChild = (node: CodecNode) => () => emit('remove', node, 'child');
const handleUpdateParam = (node: CodecNode) => (paramName: string, value: any) =>
  emit('update-param', node, paramName, value);
const handleUpdateTransform =
  (node: CodecNode) => (transformName: string, params: Record<string, any>) =>
    emit('update-transform', node, transformName, params);

function formatSiblingValue(val: any): string {
  if (typeof val === 'string') return val;
  if (Array.isArray(val)) return val.map(formatSiblingValue).join(', ');
  if (val == null) return '';
  if (typeof val === 'object') {
    if ('name' in val && 'params' in val && 'siblings' in val && 'children' in val) {
      return val.name || '[node]';
    }
    return Object.values(val).map(formatSiblingValue).join(', ');
  }
  return String(val);
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
      <button
        v-if="props.parent"
        class="text-red-500 text-xs"
        @click="$emit('remove', props.parent, props.parent.siblings.indexOf(props.node), 'sibling')"
      >
        Retirer
      </button>
    </div>

    <div v-if="isOpen" class="flex flex-row items-start gap-4">
      <!-- Colonne gauche : valeur d'entrée (avant transformation) -->
      <div class="min-w-[120px] font-mono text-sm py-1 px-2 border rounded">
        {{ formatSiblingValue(props.inputValue) }}
      </div>

      <!-- Colonne droite : transformation + params -->
      <div class="flex-1">
        <div class="flex items-center gap-2 mb-2">
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
        <div class="flex items-center gap-2 mb-2">
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
        </div>
      </div>
    </div>

    <!-- Siblings (pipeline linéaire) -->
    <div v-if="isOpen && props.node.siblings.length">
      <div v-for="(sib, sidx) in props.node.siblings" :key="sidx">
        <DataTableCodecNode
          :node="sib"
          :parent="props.node"
          :is-root="false"
          :transforms="props.transforms"
          :input-value="currentValue"
          @add-child="$emit('add-child', sib, '')"
          @add-sibling="$emit('add-sibling', sib)"
          @remove="$emit('remove', props.node, sidx, 'sibling')"
          @update-param="(paramName, value) => $emit('update-param', sib, paramName, value)"
          @update-transform="
            (transformName, params) => $emit('update-transform', sib, transformName, params)
          "
        />
      </div>
    </div>

    <!-- Children (branches) -->
    <div v-if="isOpen && props.node.children.length">
      <div
        v-for="(child, cidx) in props.node.children"
        :key="cidx"
        class="ml-6 mt-2 border-l-2 border-gray-200"
      >
        <DataTableCodecNode
          :node="child"
          :parent="props.node"
          :is-root="false"
          :transforms="props.transforms"
          :input-value="Array.isArray(currentValue) ? currentValue[cidx] : currentValue"
          @add-child="handleAddChildTransform"
          @add-sibling="handleAddSibling(child)"
          @remove="handleRemoveChild(child)"
          @update-param="handleUpdateParam(child)"
          @update-transform="handleUpdateTransform(child)"
        />
      </div>
    </div>
  </div>
</template>
