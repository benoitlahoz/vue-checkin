<script setup lang="ts">
import {
  ObjectTransformer,
  ObjectPreview,
  RecipePreview,
  ObjectNode,
  ModeToggle,
  TransformString,
  TransformNumber,
  TransformDate,
  TransformBoolean,
  TransformObject,
  TransformArray,
} from '.';

// Array of user objects for model mode demonstration
const data = [
  {
    name: 'john doe',
    age: 30,
    dob: new Date('1993-05-15T00:00:00Z'),
    active: true,
    city: 'marseille',
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
    name: 'jane smith',
    age: 28,
    active: false,
    city: 'paris',
    address: {
      street: '456 elm st',
      zip: '75001',
    },
    hobbies: ['cooking', 'painting'],
  },
  {
    name: 'bob wilson',
    age: 35,
    dob: new Date('1988-03-20T00:00:00Z'),
    active: true,
    city: 'lyon',
    address: {
      street: '789 oak ave',
      zip: '69001',
      custom: {
        info: 'another info',
      },
    },
  },
];
</script>

<template>
  <div class="space-y-4 max-h-196 overflow-auto">
    <ObjectTransformer :data="data" class="flex md:flex-row w-full">
      <TransformString />
      <TransformNumber />
      <TransformDate />
      <TransformBoolean />
      <TransformObject />
      <TransformArray />

      <div class="flex-1 flex flex-col gap-2">
        <ModeToggle />
        <ObjectNode />
      </div>

      <div class="flex-1 flex flex-col gap-2 h-full">
        <ObjectPreview />
        <RecipePreview />
      </div>
    </ObjectTransformer>
  </div>
</template>

<style scoped></style>
