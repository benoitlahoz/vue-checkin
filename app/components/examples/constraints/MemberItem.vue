<script setup lang="ts">
import type { MemberData } from '.';
import { Badge } from '@/components/ui/badge';

const props = defineProps<{ member: MemberData }>();
</script>

<template>
  <div>
    <Badge>{{ member.name }}</Badge>
    <span>({{ member.role }})</span>
  </div>
</template>
