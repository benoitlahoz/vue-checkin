<script setup lang="ts">
import {
  ObjectTransformer,
  TransformString,
  TransformNumber,
  TransformDate,
  TransformMisc,
} from '.';
</script>

<template>
  <ObjectTransformer>
    <TransformString />
    <TransformNumber />
    <TransformDate />
    <TransformMisc />
  </ObjectTransformer>
</template>

<style scoped></style>
