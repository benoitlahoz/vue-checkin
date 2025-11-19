<script setup lang="ts">
import { computed } from 'vue';
import { useCheckIn } from '#vue-airport/composables/useCheckIn';
import { type TabItemData, type TabItemContext, TABS_DESK_KEY } from '.';
import { Button } from '@/components/ui/button';

/**
 * Tab Item Component
 *
 * Individual tab component that reads from the desk.
 */

const props = defineProps<{
  id?: string | number;
}>();

const emit = defineEmits<{
  select: [id: string | number];
  close: [id: string | number];
}>();

// Check in to the tabs desk and capture the desk (which contains provided context)
const { checkIn } = useCheckIn<TabItemData, TabItemContext>();
const { desk } = checkIn(TABS_DESK_KEY, {
  id: props.id,
  autoCheckIn: true,
  // For devTools.
  watchData: true,
  data: (desk) => {
    const tab = desk.tabsData?.value.find((t) => t.id === props.id);
    if (!tab) return { icon: '', label: '', content: '' };
    return tab;
  },
});

// Get tab data from tabsData
const tabData = computed(() => {
  return desk?.tabsData?.value.find((t) => t.id === props.id);
});

const isActive = computed(() => {
  return desk?.activeTab?.value === props.id;
});

const canClose = computed(() => {
  return (desk?.tabsCount?.value ?? 0) > 1;
});

const onSelect = () => {
  if (desk && typeof desk.selectTab === 'function') {
    desk.selectTab(props.id as any);
  } else {
    emit('select', props.id as any);
  }
};

const onClose = () => {
  if (desk && typeof desk.closeTab === 'function') {
    desk.closeTab(props.id as any);
  } else {
    emit('close', props.id as any);
  }
};
</script>

<template>
  <div
    class="group relative flex items-center h-12 rounded-t-md transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 [&:hover_button]:bg-transparent!"
  >
    <Button
      variant="ghost"
      class="rounded-none whitespace-nowrap flex items-center gap-2 hover:text-gray-900 dark:hover:text-gray-100 px-4"
      @click="onSelect"
    >
      <UIcon v-if="tabData?.icon" :name="tabData.icon" class="w-4 h-4" />
      {{ tabData?.label }}
    </Button>
    <Button
      v-if="canClose"
      size="icon-sm"
      variant="ghost"
      class="rounded-none hover:text-red-600 dark:hover:text-red-400 mr-2"
      @click="onClose"
    >
      <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
    </Button>
    <div v-if="isActive" class="absolute -bottom-px left-0 right-0 h-1 bg-primary z-20" />
  </div>
</template>
