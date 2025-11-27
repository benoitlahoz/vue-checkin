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

const originalValue = ref<any>('John Doe');
const value = ref<any>(originalValue.value);

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

const selectedTransform = ref<string | null>(null);
const transformParams = ref<Record<string, any>>({});

const onUpdateTransform = (transformName: any) => {
  const transform = transforms.find((t) => t.name === transformName);
  if (transform) {
    // Réinitialiser la valeur à l'original
    value.value = originalValue.value;
    // Initialiser les paramètres avec les valeurs par défaut
    if (transform.params && transform.params.length > 0) {
      transform.params.forEach((param) => {
        transformParams.value[param.name] = param.default;
      });
    }
    applyTransform();
  }
};

const applyTransform = () => {
  const transform = transforms.find((t) => t.name === selectedTransform.value);
  if (transform) {
    // Toujours partir de la valeur originale
    const valid = transform.if(originalValue.value);
    if (valid) {
      const paramsValues = transform.params
        ? transform.params.map((p) => transformParams.value[p.name])
        : [];
      value.value = transform.fn(originalValue.value, ...paramsValues);
    } else {
      value.value = originalValue.value;
    }
  } else {
    value.value = originalValue.value;
  }
};

watch(
  transformParams,
  () => {
    // Relancer la transformation à chaque changement de paramètre
    applyTransform();
  },
  { deep: true }
);
</script>

<template>
  <div>
    <div class="mb-4 space-y-2">
      <Select v-model="selectedTransform" @update:model-value="onUpdateTransform">
        <SelectTrigger>
          <SelectValue placeholder="Choisir une transformation" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem v-for="t in transforms" :key="t.name" :value="t.name">
              <SelectLabel>{{ t.name }}</SelectLabel>
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>

      <!-- Affichage dynamique des paramètres -->
      <div v-if="selectedTransform">
        <template v-for="param in transforms.find((t) => t.name === selectedTransform)?.params">
          <div v-if="param.type === 'string'" :key="param.name" class="mt-2">
            <label :for="param.name" class="block text-sm font-medium mb-1">{{
              param.label
            }}</label>
            <Input
              :id="param.name"
              v-model="transformParams[param.name]"
              type="text"
              :placeholder="param.default"
            />
          </div>
        </template>
      </div>

      <div class="mt-4">{{ value }}</div>
    </div>
  </div>
</template>
