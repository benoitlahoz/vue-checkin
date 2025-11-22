<script setup lang="ts">
import { useCheckIn } from 'vue-airport';
import type { MemberData, MemberListContext } from '.';
import { DESK_CONSTRAINTS_KEY } from '.';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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
const roleColor = computed(() => {
  switch (item.value?.role) {
    case 'admin':
      return 'bg-red-800/10 border border-red-800 text-red-800';
    case 'user':
      return 'bg-blue-800/10 border border-blue-800 text-blue-800';
    case 'guest':
      return 'bg-green-800/10 border border-green-800 text-green-800';
    default:
      return 'bg-gray-100 border border-gray-300 text-gray-800';
  }
});

const remove = () => {
  desk?.checkOut(props.id);
};
</script>

<template>
  <div
    class="w-full flex items-center gap-4 p-3 bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800"
  >
    <Avatar class="w-12 h-12">
      <AvatarImage v-if="item?.avatar" :src="item.avatar" alt="Avatar" />
      <AvatarFallback v-else>{{ item?.name?.[0] ?? '?' }}</AvatarFallback>
    </Avatar>
    <div class="flex-1 flex flex-col gap-1">
      <div class="flex items-center gap-2">
        <Label class="font-bold text-base">{{ item?.name }}</Label>
        <Badge :class="cn(roleColor)">{{ item?.role }}</Badge>
      </div>
      <span class="text-xs text-gray-600 dark:text-gray-400">ID: {{ item?.id }}</span>
    </div>
    <Button
      size="icon"
      aria-label="Remove item"
      class="bg-transparent hover:bg-transparent border-0 text-destructive/80 hover:text-destructive"
      @click.stop="remove"
    >
      <UIcon name="i-heroicons-trash" class="w-4 h-4" />
    </Button>
  </div>
</template>
