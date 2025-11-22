<script setup lang="ts">
import { useCheckIn } from 'vue-airport';
import type { MemberData, MemberListContext } from '.';
import { DESK_CONSTRAINTS_KEY } from '.';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const props = defineProps<{ id: string | number }>();

const { checkIn } = useCheckIn<MemberData, MemberListContext>();
const { desk } = checkIn(DESK_CONSTRAINTS_KEY, {
  id: props.id,
  autoCheckIn: false,
  watchData: true,
  data: (desk) => {
    const item = desk.get(props.id);
    return item?.data as any;
  },
});

const item = computed(() => desk?.get(props.id)?.data);

const remove = () => {
  desk?.checkOut(props.id);
};
</script>

<template>
  <div class="flex flex-col gap-1">
    <div class="flex items-center gap-2">
      <Badge>{{ item?.name }}</Badge>
      <span>({{ item?.role }})</span>
    </div>
    <span class="text-xs text-gray-600 dark:text-gray-400">ID: {{ item?.id }}</span>
    <Button
      size="icon"
      aria-label="Remove member"
      class="bg-transparent hover:bg-transparent border-0 text-destructive/80 hover:text-destructive"
      @click.stop="remove"
    >
      <span class="icon">🗑️</span>
    </Button>
  </div>
</template>
