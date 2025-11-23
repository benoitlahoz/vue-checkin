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
  watchData: false,
  data: (desk) => {
    const item = desk.get(props.id);
    return item?.data as any;
  },
});

const item = computed(() => desk!.get(props.id)?.data);
const roleColor = computed(
  () => desk!.roleClasses?.[item.value?.role || 'user'] || 'bg-gray-200 text-gray-800'
);

const remove = async () => {
  await desk!.checkOut(props.id);
};
</script>

<template>
  <div class="w-full flex items-center gap-4">
    <Avatar class="w-12 h-12">
      <AvatarImage v-if="item?.avatar" :src="item.avatar" alt="Avatar" />
      <AvatarFallback v-else>{{ item?.name?.[0] ?? '?' }}</AvatarFallback>
    </Avatar>
    <div class="flex-1 flex flex-col gap-1 justify-center">
      <Label class="font-bold text-base">{{ item?.name }}</Label>
      <span class="text-xs text-gray-600 dark:text-gray-400 mt-1">ID: {{ item?.id }}</span>
    </div>
    <div class="flex flex-col items-end gap-2 h-full justify-center">
      <Badge :class="cn(roleColor)">{{ item?.role }}</Badge>
      <Button
        size="icon"
        aria-label="Remove item"
        class="bg-transparent hover:bg-transparent border-0 text-destructive/80 hover:text-destructive"
        @click.stop="remove"
      >
        <UIcon name="i-heroicons-trash" class="w-4 h-4" />
      </Button>
    </div>
  </div>
</template>
