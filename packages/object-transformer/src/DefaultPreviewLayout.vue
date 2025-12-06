<script setup lang="ts">
import { Copy, Check } from 'lucide-vue-next';

interface Props {
  formattedJson: string;
  isCopied: boolean;
  isGenerating: boolean;
  progress: number;
  shouldShowPreview: boolean;
  shouldUseVirtualScroll: boolean;
  containerProps?: Record<string, any>;
  wrapperProps?: Record<string, any>;
  virtualList?: Array<{ data: string; index: number }>;
}

defineProps<Props>();

const emit = defineEmits<{
  copyToClipboard: [];
}>();
</script>

<template>
  <!-- Progress bar - very thin, at the very top -->
  <div v-if="isGenerating" class="progress-bar visible">
    <div class="progress-fill idle" :style="{ width: `${progress}%` }" />
  </div>

  <!-- Copy button -->
  <button
    v-if="shouldShowPreview"
    class="copy-button ot-button-icon ot-button-ghost"
    :class="{ visible: isCopied }"
    @click="emit('copyToClipboard')"
  >
    <Check v-if="isCopied" class="copy-button-icon ot-copy-icon-primary" />
    <Copy v-else class="ot-copy-icon" />
  </button>

  <!-- Preview content - Virtual scrolling for large JSONs -->
  <div
    v-if="shouldShowPreview && shouldUseVirtualScroll"
    v-bind="containerProps"
    class="ot-preview-content"
  >
    <div v-bind="wrapperProps">
      <div
        v-for="{ data: line, index } in virtualList"
        :key="index"
        class="ot-preview-line"
        v-text="line"
      />
    </div>
  </div>

  <!-- Preview content - Standard for small JSONs -->
  <pre
    v-else-if="shouldShowPreview"
    class="ot-preview-content"
  ><code>{{ formattedJson }}</code></pre>
</template>

<style scoped>
/* Override progress bar for preview - absolute positioned at top with thin height */
.ot-progress-bar {
  height: 2px;
  z-index: 30;
}
</style>
