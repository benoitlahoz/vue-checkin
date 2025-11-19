<script setup lang="ts">
import { computed } from 'vue';
import { useCheckIn } from '#vue-airport/composables/useCheckIn';
import { type TabItemData, type TabItemContext, TABS_DESK_KEY } from '.';

/**
 * Tab Item Component
 *
 * Individual tab component that automatically checks in to the desk.
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
  watchData: true,
  debug: false,
  data: (desk) => {
    // The desk is now passed as a parameter to the data function
    const tabData = desk.tabsData.value.find(
      (t: TabItemData & { id: string | number }) => t.id === props.id
    );
    return {
      label: tabData?.label ?? '',
      // Content is unused here, but we want to check if it is correctly updated and displayed in the devtools
      content: tabData?.content ?? '',
      icon: tabData?.icon ?? undefined,
    };
  },
});

const isActive = computed(() => {
  if (!desk || !desk.activeTab) return false;
  try {
    return desk.activeTab.value === props.id;
  } catch {
    return false;
  }
});

const canClose = computed(() => {
  if (!desk || !desk.tabsCount) return true;
  try {
    return desk.tabsCount.value > 1;
  } catch {
    return true;
  }
});

// Récupérer les données depuis le contexte tabsData
const tabData = computed(() => {
  return desk?.tabsData?.value.find((t) => t.id === props.id);
});

// Ou alternativement, récupérer depuis les données enregistrées du desk :
// const registeredData = computed(() => desk?.get(props.id as any)?.data);

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
