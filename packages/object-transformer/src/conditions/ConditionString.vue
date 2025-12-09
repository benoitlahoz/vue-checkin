<script setup lang="ts">
import { onMounted } from 'vue';
import { useCheckIn } from 'vue-airport';
import type { ObjectTransformerContext, Transform } from '..';
import { ObjectTransformerDeskKey } from '..';
import { logger } from '../utils/logger.util';

type DeskWithContext = typeof desk & ObjectTransformerContext;

const { checkIn } = useCheckIn<Transform, ObjectTransformerContext>();
const { desk } = checkIn(ObjectTransformerDeskKey, {
  id: 'string-conditions',
  autoCheckIn: true,
});

// Conditions are NON-structural transforms that just store conditionMet
// They return the original value unchanged but set conditionMet metadata
// All conditions support 'not' parameter to invert the result
const transforms: Transform[] = [
  {
    name: 'Contains',
    applicableTo: ['string'],
    params: [
      { key: 'not', label: 'Not', type: 'boolean', default: false },
      { key: 'search', label: 'Search text', type: 'text', default: '' },
    ],
    condition: (v: string, not = false, search: string) => {
      if (typeof v !== 'string') return false;
      // If search is empty or not a string, condition is false
      if (!search || typeof search !== 'string') return false;

      // Normalize both strings to remove accents/diacritics for comparison
      const normalize = (str: string) =>
        str
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase();

      const result = normalize(v).includes(normalize(search));
      const finalResult = not ? !result : result;
      return finalResult;
    },
    fn: (v: string) => v, // Passthrough - condition is evaluated separately
  },
  {
    name: 'Matches Particle',
    applicableTo: ['string'],
    params: [
      { key: 'not', label: 'Not', type: 'boolean', default: false },
      {
        key: 'particleList',
        label: 'Custom particles (comma-separated, optional)',
        type: 'text',
        default: '',
      },
    ],
    condition: (v: string, not = false, particleList?: string) => {
      if (typeof v !== 'string') return false;

      const particles =
        particleList && typeof particleList === 'string'
          ? particleList.split(',').map((p) => p.trim().toLowerCase())
          : ['de', 'van', 'von', 'du', 'da', 'di', 'la', 'le', 'del', 'des', 'della'];

      const result = particles.includes(v.toLowerCase());
      return not ? !result : result;
    },
    fn: (v: string) => v,
  },
  {
    name: 'Is Uppercase',
    applicableTo: ['string'],
    params: [{ key: 'not', label: 'Not', type: 'boolean', default: false }],
    condition: (v: string, not = false) => {
      if (typeof v !== 'string') return false;
      const result = v === v.toUpperCase() && v !== v.toLowerCase();
      return not ? !result : result;
    },
    fn: (v: string) => v,
  },
  {
    name: 'Is Lowercase',
    applicableTo: ['string'],
    params: [{ key: 'not', label: 'Not', type: 'boolean', default: false }],
    condition: (v: string, not = false) => {
      if (typeof v !== 'string') return false;
      const result = v === v.toLowerCase() && v !== v.toUpperCase();
      return not ? !result : result;
    },
    fn: (v: string) => v,
  },
  {
    name: 'Starts With',
    applicableTo: ['string'],
    params: [
      { key: 'not', label: 'Not', type: 'boolean', default: false },
      { key: 'prefix', label: 'Prefix', type: 'text', default: '' },
    ],
    condition: (v: string, not = false, prefix: string) => {
      if (typeof v !== 'string') return false;
      const result = typeof prefix === 'string' && v.startsWith(prefix);
      return not ? !result : result;
    },
    fn: (v: string) => v,
  },
  {
    name: 'Ends With',
    applicableTo: ['string'],
    params: [
      { key: 'not', label: 'Not', type: 'boolean', default: false },
      { key: 'suffix', label: 'Suffix', type: 'text', default: '' },
    ],
    condition: (v: string, not = false, suffix: string) => {
      if (typeof v !== 'string') return false;
      const result = typeof suffix === 'string' && v.endsWith(suffix);
      return not ? !result : result;
    },
    fn: (v: string) => v,
  },
  {
    name: 'Length >',
    applicableTo: ['string'],
    params: [
      { key: 'not', label: 'Not', type: 'boolean', default: false },
      { key: 'minLength', label: 'Min length', type: 'number', default: 0 },
    ],
    condition: (v: string, not = false, minLength: number) => {
      if (typeof v !== 'string') return false;
      const result = v.length > (typeof minLength === 'number' ? minLength : 0);
      return not ? !result : result;
    },
    fn: (v: string) => v,
  },
  {
    name: 'Length <',
    applicableTo: ['string'],
    params: [
      { key: 'not', label: 'Not', type: 'boolean', default: false },
      { key: 'maxLength', label: 'Max length', type: 'number', default: 10 },
    ],
    condition: (v: string, not = false, maxLength: number) => {
      if (typeof v !== 'string') return false;
      const result = v.length < (typeof maxLength === 'number' ? maxLength : Infinity);
      return not ? !result : result;
    },
    fn: (v: string) => v,
  },
  {
    name: 'Matches Regex',
    applicableTo: ['string'],
    params: [
      { key: 'not', label: 'Not', type: 'boolean', default: false },
      { key: 'pattern', label: 'Regex pattern', type: 'text', default: '' },
      { key: 'flags', label: 'Flags (optional)', type: 'text', default: '' },
    ],
    condition: (v: string, not = false, pattern: string, flags?: string) => {
      if (typeof v !== 'string') return false;

      if (!pattern) return false;
      try {
        const regex = new RegExp(pattern, flags || '');
        const result = regex.test(v);
        return not ? !result : result;
      } catch {
        return false;
      }
    },
    fn: (v: string) => v,
  },
];

onMounted(() => {
  const d = desk as DeskWithContext;
  if (!d) return;

  d.addTransforms(...transforms);

  logger.debug(
    `[ConditionString] Registered ${transforms.length} conditional transforms:`,
    transforms.map((t) => t.name)
  );
});
</script>

<template>
  <div class="hidden"></div>
</template>
