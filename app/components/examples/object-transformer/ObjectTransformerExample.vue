<script setup lang="ts">
import { ObjectTransformer, TransformString, TransformNumber, TransformMisc } from '.';
</script>

<template>
  <ObjectTransformer>
    <TransformString />
    <TransformNumber />
    <TransformMisc />
  </ObjectTransformer>
</template>

<style scoped></style>
