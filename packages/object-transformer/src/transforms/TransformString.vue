<script setup lang="ts">
import { onMounted } from 'vue';
import { useCheckIn } from 'vue-airport';
import type { ObjectTransformerContext, Transform } from '..';
import { ObjectTransformerDeskKey, registerStructuralTransformHandler } from '..';

type DeskWithContext = typeof desk & ObjectTransformerContext;

const { checkIn } = useCheckIn<Transform, ObjectTransformerContext>();
const { desk } = checkIn(ObjectTransformerDeskKey, {
  id: 'string-transform',
  autoCheckIn: true,
});

const transforms: Transform[] = [
  {
    name: 'Split',
    structural: true, // This is a structural transform
    applicableTo: ['string'],
    params: [
      { key: 'delimiter', label: 'Delimiter', type: 'text', default: ' ' },
      { key: 'splitAt', label: 'Split at index (0 = all)', type: 'number', default: 0 },
    ],
    fn: (v: string, delimiter: string, splitAt: number) => {
      if (typeof delimiter !== 'string') delimiter = ' ';
      const index = typeof splitAt === 'number' && splitAt > 0 ? splitAt : 0;

      let parts: string[];
      if (index > 0) {
        // Split at specific index
        const allParts = delimiter === '' ? Array.from(v) : v.split(delimiter);
        if (allParts.length <= index) {
          // Not enough parts, return all
          parts = allParts;
        } else {
          // Split at index: everything before index vs everything from index onward
          parts = [allParts.slice(0, index).join(delimiter), allParts.slice(index).join(delimiter)];
        }
      } else {
        // Default: split all
        // Use Array.from for empty delimiter to properly handle Unicode characters (e.g., ć, é, 😀)
        parts = delimiter === '' ? Array.from(v) : v.split(delimiter);
      }

      return {
        __structuralChange: true,
        action: 'split' as const,
        parts: parts,
      };
    },
  },
  {
    name: 'Uppercase',
    applicableTo: ['string'],
    fn: (v: any) => (typeof v === 'string' ? v.toUpperCase() : v),
  },
  {
    name: 'Lowercase',
    applicableTo: ['string'],
    fn: (v: any) => (typeof v === 'string' ? v.toLowerCase() : v),
  },
  {
    name: 'Capitalized',
    applicableTo: ['string'],
    fn: (v: any) =>
      typeof v === 'string' ? v.charAt(0).toUpperCase() + v.slice(1).toLowerCase() : v,
  },
  {
    name: 'Replace',
    applicableTo: ['string'],
    params: [
      { key: 'search', label: 'Search', type: 'text', default: '' },
      { key: 'replace', label: 'Replace', type: 'text', default: '' },
    ],
    fn: (v: string, s: string, r: string) => {
      if (typeof s !== 'string') s = '';
      if (typeof r !== 'string') r = '';
      // replaceAll may not be supported in older lib targets; use split/join for compatibility
      if (s === '') return v; // avoid infinite loop
      return v.split(s).join(r);
    },
  },
  {
    name: 'Trim',
    applicableTo: ['string'],
    fn: (v: any) => (typeof v === 'string' ? v.trim() : v),
  },
  {
    name: 'Append',
    applicableTo: ['string'],
    params: [{ key: 'suffix', label: 'Suffix', type: 'text', default: '' }],
    fn: (v: string, s: string) => {
      if (typeof s !== 'string') s = '';
      return v + s;
    },
  },
  {
    name: 'Prepend',
    applicableTo: ['string'],
    params: [{ key: 'prefix', label: 'Prefix', type: 'text', default: '' }],
    fn: (v: string, p: string) => {
      if (typeof p !== 'string') p = '';
      return p + v;
    },
  },
  {
    name: 'Substring',
    applicableTo: ['string'],
    params: [
      { key: 'start', label: 'Start Index', type: 'number', default: 0 },
      { key: 'end', label: 'End Index', type: 'number', default: undefined },
    ],
    fn: (v: string, start: number, end?: number) => {
      const startIdx = typeof start === 'number' ? start : 0;
      const endIdx = typeof end === 'number' ? end : undefined;
      return v.substring(startIdx, endIdx);
    },
  },
  {
    name: 'Repeat',
    applicableTo: ['string'],
    params: [{ key: 'count', label: 'Count', type: 'number', default: 1 }],
    fn: (v: string, count: number) => {
      const repeatCount = typeof count === 'number' && count > 0 ? Math.floor(count) : 1;
      return v.repeat(repeatCount);
    },
  },
  {
    name: 'Remove Spaces',
    applicableTo: ['string'],
    fn: (v: string) => v.replace(/\s+/g, ''),
  },
  {
    name: 'Remove Multiple Spaces',
    applicableTo: ['string'],
    fn: (v: string) => v.replace(/\s+/g, ' '),
  },
  {
    name: 'Reverse',
    applicableTo: ['string'],
    fn: (v: string) => v.split('').reverse().join(''),
  },
  {
    name: 'To Number',
    applicableTo: ['string'],
    fn: (v: string) => {
      if (typeof v !== 'string') return v;
      return Number(v); // Always return number, even if NaN
    },
  },
  {
    name: 'To Object',
    structural: true,
    applicableTo: ['string'],
    fn: (v: any) => {
      // Accept any value type after intermediate transformations
      return {
        __structuralChange: true,
        action: 'toObject' as const,
        object: {
          object: { value: v },
        },
      };
    },
  },

  // 🔥 REGEX TRANSFORMS
  {
    name: 'Replace Regex',
    applicableTo: ['string'],
    params: [
      { key: 'pattern', label: 'Regex pattern', type: 'text', default: '' },
      { key: 'flags', label: 'Flags (g,i,m,s,u)', type: 'text', default: 'g' },
      { key: 'replacement', label: 'Replacement', type: 'text', default: '' },
    ],
    fn: (v: string, pattern: string, flags: string = 'g', replacement: string = '') => {
      if (typeof v !== 'string') return v;
      if (!pattern) return v;

      try {
        const regex = new RegExp(pattern, flags);
        return v.replace(regex, replacement);
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('[Replace Regex] Invalid pattern:', { pattern, flags, error });
        }
        return v; // Fallback: return unchanged
      }
    },
  },

  {
    name: 'Extract Regex',
    applicableTo: ['string'],
    params: [
      { key: 'pattern', label: 'Regex pattern (with groups)', type: 'text', default: '' },
      { key: 'flags', label: 'Flags', type: 'text', default: '' },
      { key: 'groupIndex', label: 'Group index (0=full match)', type: 'number', default: 0 },
    ],
    fn: (v: string, pattern: string, flags: string = '', groupIndex: number = 0) => {
      if (typeof v !== 'string') return null;
      if (!pattern) return null;

      try {
        const regex = new RegExp(pattern, flags);
        const match = v.match(regex);

        if (!match) return null;

        const index = typeof groupIndex === 'number' ? groupIndex : 0;
        return match[index] !== undefined ? match[index] : null;
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('[Extract Regex] Invalid pattern:', { pattern, flags, error });
        }
        return null;
      }
    },
  },

  {
    name: 'Split Regex',
    applicableTo: ['string'],
    structural: true,
    params: [
      { key: 'pattern', label: 'Regex pattern', type: 'text', default: '\\s+' },
      { key: 'flags', label: 'Flags', type: 'text', default: '' },
      { key: 'limit', label: 'Limit (0=no limit)', type: 'number', default: 0 },
    ],
    fn: (v: string, pattern: string = '\\s+', flags: string = '', limit: number = 0) => {
      if (typeof v !== 'string') {
        return { __structuralChange: true };
      }

      if (!pattern) {
        return { __structuralChange: true };
      }

      try {
        const regex = new RegExp(pattern, flags);
        const parts = limit > 0 ? v.split(regex, limit) : v.split(regex);

        return {
          __structuralChange: true,
          action: 'split' as const,
          parts: parts,
        };
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('[Split Regex] Invalid pattern:', { pattern, flags, error });
        }
        return { __structuralChange: true };
      }
    },
  },
];

onMounted(() => {
  const d = desk as DeskWithContext;
  if (!d) return;

  // Register structural transform handler for 'split'
  registerStructuralTransformHandler(
    'split',
    (current, lastKey, result) => {
      if (!Array.isArray(result.parts)) return;

      // Create new properties from parts
      result.parts.forEach((part: any, index: number) => {
        const newKey = `${lastKey}_${index}`;
        current[newKey] = part;
      });
    },
    d
  );

  d.addTransforms(...transforms);
});
</script>

<template>
  <div class="hidden"></div>
</template>
