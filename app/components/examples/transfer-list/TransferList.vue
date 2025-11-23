<script setup lang="ts">
import { useCheckIn } from 'vue-airport';

const MockCsv = `name,age,city\nJohn Doe,32,Paris\nJane Smith,28,Lyon\nAlice Cooper,40,Bordeaux`;

const parseCsv = (csv: string, separator = ',') => {
  separator = separator.trim();

  const lines = csv.split('\n');
  const headers = lines[0].split(separator);
  return lines.slice(1).map((line) => {
    const values = line.split(separator);
    const obj: Record<string, string> = {};
    headers.forEach((header, index) => {
      obj[header] = values[index];
    });
    return obj;
  });
};
</script>

<template>
  <div></div>
</template>
