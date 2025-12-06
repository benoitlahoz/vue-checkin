<script setup lang="ts">
import { Copy, Check, CheckCircle2, XCircle, Upload } from 'lucide-vue-next';

interface Props {
  formattedRecipe: string;
  isCopied: boolean;
  isImporting: boolean;
  importProgress: number;
  importStatus: 'idle' | 'success' | 'error';
  importMessage: string;
}

defineProps<Props>();

const emit = defineEmits<{
  copyToClipboard: [];
}>();
</script>

<template>
  <!-- Import Progress Feedback -->
  <div
    v-if="isImporting || importStatus !== 'idle'"
    class="ot-recipe-feedback"
    :class="{
      'recipe-import-idle': importStatus === 'idle',
      'recipe-import-success': importStatus === 'success',
      'recipe-import-error': importStatus === 'error',
    }"
  >
    <div class="ot-recipe-header">
      <CheckCircle2 v-if="importStatus === 'success'" class="ot-recipe-icon-success" />
      <XCircle v-else-if="importStatus === 'error'" class="ot-recipe-icon-error" />
      <Upload v-else class="ot-recipe-icon-idle" />
      <span class="ot-recipe-message">
        {{ importMessage || 'Importing recipe...' }}
      </span>
    </div>

    <!-- Custom Progress Bar -->
    <div class="progress-bar visible">
      <div
        class="ot-progress-fill"
        :class="{
          idle: importStatus === 'idle',
          success: importStatus === 'success',
          error: importStatus === 'error',
        }"
        :style="{ width: `${importProgress}%` }"
      />
    </div>
  </div>

  <div class="ot-recipe-wrapper">
    <button
      class="copy-button ot-button-icon ot-button-ghost"
      :class="{ visible: isCopied }"
      @click="emit('copyToClipboard')"
    >
      <Check v-if="isCopied" class="copy-button-icon ot-copy-icon-primary" />
      <Copy v-else class="ot-copy-icon" />
    </button>
    <pre class="ot-recipe-content"><code>{{ formattedRecipe }}</code></pre>
  </div>
</template>

<style scoped>
/* Override progress bar for recipe feedback context */
.ot-recipe-feedback .ot-progress-bar {
  position: relative;
  width: 100%;
  height: 0.5rem;
  border-radius: 9999px;
}
</style>
