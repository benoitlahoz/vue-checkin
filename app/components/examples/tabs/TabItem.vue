<script setup lang="ts">
import { computed } from 'vue';
import { useCheckIn } from '#vue-airport/composables/useCheckIn';
import { type TabItemData, type TabItemContext, TABS_DESK_KEY } from '.';

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
  data: (desk) => {
    const tab = desk.tabsData?.value.find((t) => t.id === props.id);
    if (!tab) return { label: '', content: '' };
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
  <div class="relative flex items-center gap-1 h-12">
    <UButton
      :leading-icon="tabData?.icon"
      color="neutral"
      variant="ghost"
      class="rounded-t-md rounded-b-none whitespace-nowrap"
      @click="onSelect"
    >
      {{ tabData?.label }}
    </UButton>
    <UButton
      v-if="canClose"
      size="xs"
      color="neutral"
      variant="ghost"
      icon="i-heroicons-x-mark"
      @click="onClose"
    />
    <div v-if="isActive" class="absolute bottom-0 left-0 right-0 h-0.5 bg-primary z-10" />
  </div>
</template>
