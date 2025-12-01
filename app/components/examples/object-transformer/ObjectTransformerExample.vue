<script setup lang="ts">
import {
  ObjectTransformer,
  TransformString,
  TransformNumber,
  TransformDate,
  TransformMisc,
  TransformBoolean,
} from '.';
</script>

<template>
  <ObjectTransformer>
    <TransformString />
    <TransformNumber />
    <TransformDate />
    <TransformBoolean />
    <TransformMisc />
  </ObjectTransformer>
</template>

<style scoped></style>
