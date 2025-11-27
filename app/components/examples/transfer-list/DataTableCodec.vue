<script setup lang="ts">
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { reactive, ref, computed } from 'vue';

const originalValue = ref<any>('John Doe');

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

const transforms: Transform[] = [
  {
    name: 'Uppercase',
    if: (val: any) => typeof val === 'string',
    fn: (val: string) => val.toUpperCase(),
    params: [],
  },
  {
    name: 'Lowercase',
    if: (val: any) => typeof val === 'string',
    fn: (val: string) => val.toLowerCase(),
    params: [],
  },
  {
    name: 'Capitalize',
    if: (val: any) => typeof val === 'string',
    fn: (val: string) => val.charAt(0).toUpperCase() + val.slice(1).toLowerCase(),
    params: [],
  },
  {
    name: 'Trim',
    if: (val: any) => typeof val === 'string',
    fn: (val: string) => val.trim(),
    params: [],
  },
  {
    name: 'Reverse',
    if: (val: any) => typeof val === 'string',
    fn: (val: string) => val.split('').reverse().join(''),
    params: [],
  },
  {
    name: 'Append Suffix',
    if: (val: any) => typeof val === 'string',
    fn: (val: string, suffix: string) => `${val}${suffix}`,
    params: [{ name: 'suffix', type: 'string', label: 'Suffixe', default: 'Example' }],
  },
  {
    name: 'Prepend Prefix',
    if: (val: any) => typeof val === 'string',
    fn: (val: string, prefix: string) => `${prefix}${val}`,
    params: [{ name: 'prefix', type: 'string', label: 'Préfixe', default: 'Example' }],
  },
  {
    name: 'Split',
    if: (val: any) => typeof val === 'string',
    fn: (val: string, delimiter: string) => val.split(delimiter),
    params: [{ name: 'delimiter', type: 'string', label: 'Délimiteur', default: ',' }],
  },
  {
    name: 'Join',
    if: (val: any) => Array.isArray(val),
    fn: (val: string[], delimiter: string) => val.join(delimiter),
    params: [{ name: 'delimiter', type: 'string', label: 'Délimiteur', default: ',' }],
  },
];

type SelectedTransform = {
  name: string;
  params: Record<string, any>;
};

const selectedTransforms = ref<SelectedTransform[]>([]);
const nextTransform = ref<string | null>(null);

const addTransform = async (transformName: any) => {
  console.log('Adding transform:', transformName);
  const transform = transforms.find((t) => t.name === transformName);
  if (transform) {
    console.log('Found transform:', transform);
    // Utiliser reactive pour garantir la réactivité des params
    const params: Record<string, any> = reactive({});
    if (transform.params && transform.params.length > 0) {
      transform.params.forEach((param) => {
        params[param.name] = param.default;
      });
    }
    transform.params?.forEach((param) => {
      if (!(param.name in params)) params[param.name] = '';
    });
    selectedTransforms.value.push({ name: transformName, params });
    nextTransform.value = null;
  }
};

const updateTransformParams = (index: number, paramName: string, paramValue: any) => {
  if (!selectedTransforms.value[index]) return;
  selectedTransforms.value[index].params[paramName] = paramValue;
};

const removeTransform = (index: number) => {
  selectedTransforms.value.splice(index, 1);
};

const resultValue = computed(() => {
  let result = originalValue.value;
  for (const sel of selectedTransforms.value) {
    const transform = transforms.find((t) => t.name === sel.name);
    if (transform && transform.if(result)) {
      const paramsValues = transform.params ? transform.params.map((p) => sel.params[p.name]) : [];
      console.log('Appel de', transform.name, 'avec', result, paramsValues);
      result = transform.fn(result, ...paramsValues);
      console.log('Résultat intermédiaire:', result);
    } else {
      console.log('Transform ignorée ou non applicable:', sel.name, result);
    }
  }
  console.log('Résultat final:', result);
  return result;
});
</script>

<template>
  <div>
    <div class="mb-4 space-y-2">
      <!-- Séquence des transformations -->
      <div v-for="(sel, idx) in selectedTransforms" :key="idx" class="mb-4 p-2 border rounded">
        <div class="flex items-center gap-2 mb-2">
          <span class="font-semibold">{{ sel.name }}</span>
          <button class="text-red-500 text-xs" @click="removeTransform(idx)">Retirer</button>
        </div>
        <div
          v-for="param in transforms.find((t) => t.name === sel.name)?.params"
          :key="param.name"
          class="mt-2"
        >
          <label :for="`param-${idx}-${param.name}`" class="block text-sm font-medium mb-1">{{
            param.label
          }}</label>
          <Input
            :id="`param-${idx}-${param.name}`"
            v-model="sel.params[param.name]"
            type="text"
            :placeholder="param.default"
            @input="updateTransformParams(idx, param.name, sel.params[param.name])"
          />
        </div>
      </div>

      <!-- Ajout d'une nouvelle transformation -->
      <div class="flex items-center gap-2 mt-2">
        <Select v-model="nextTransform" @update:model-value="addTransform">
          <SelectTrigger>
            <SelectValue placeholder="Ajouter une transformation" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem v-for="t in transforms" :key="t.name" :value="t.name">
                <SelectLabel>{{ t.name }}</SelectLabel>
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <div class="mt-4 font-mono">
        <div><strong>Valeur d'origine :</strong> {{ originalValue || '—' }}</div>
        <div><strong>Résultat :</strong> {{ resultValue }}</div>
      </div>
    </div>
  </div>
</template>
