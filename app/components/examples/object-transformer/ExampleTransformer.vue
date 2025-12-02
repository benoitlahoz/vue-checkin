<script setup lang="ts">
import {
  ObjectTransformer,
  ObjectTransformerPreview,
  TransformString,
  TransformNumber,
  TransformDate,
  TransformBoolean,
  TransformObject,
  TransformArray,
} from '.';

const data = {
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
};
</script>

<template>
  <div class="space-y-4">
    <ObjectTransformer :data="data" class="flex flex-row w-full">
      <TransformString />
      <TransformNumber />
      <TransformDate />
      <TransformBoolean />
      <TransformObject />
      <TransformArray />

      <TransformerNode />
      <ObjectTransformerPreview />
    </ObjectTransformer>
  </div>
</template>

<style scoped></style>
