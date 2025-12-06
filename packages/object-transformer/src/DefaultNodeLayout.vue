<script setup lang="ts">
import {
  NodeKeyEditor,
  NodeActions,
  NodeOpen,
  TransformSelect,
  NodeTransformsList,
  type ObjectNodeData,
} from '.';
import NodeValue from './NodeValue.vue';

interface Props {
  node: ObjectNodeData;
  nodeId: string;
  isHovered: boolean;
  isEditing: boolean;
  displayValue: any;
  inputFieldElement: any;
  inputElement: any;
}

defineProps<Props>();

defineEmits<{
  'update:isHovered': [value: boolean];
}>();
</script>

<template>
  <div class="ot-node-scroll-wrapper">
    <!-- Grille 2 colonnes: gauche (chevron+actions+key) | droite (value+transforms) -->
    <div
      class="ot-node-grid"
      :class="{
        'ot-node-row-with-chevron': node.children?.length && node.parent,
      }"
      @mouseenter="$emit('update:isHovered', true)"
      @mouseleave="$emit('update:isHovered', false)"
    >
      <!-- Colonne 1, Ligne 1: Chevron + Actions + Key -->
      <div class="ot-node-row ot-node-main-row">
        <div class="ot-node-left-section">
          <!-- Chevron space (always reserved) -->
          <div class="ot-node-chevron">
            <NodeOpen :node-id="nodeId" />
          </div>

          <!-- Key + Delete/Restore container -->
          <div class="ot-node-content-section">
            <!-- Delete/Restore (shown on row hover) -->
            <div
              v-if="node.parent?.type === 'object' || node.parent?.type === 'array'"
              class="ot-node-action-button"
            >
              <NodeActions :node-id="nodeId" :is-visible="isHovered || isEditing" />
            </div>

            <!-- NodeKey Component -->
            <div ref="inputElement">
              <NodeKeyEditor :node-id="nodeId" />
            </div>
          </div>
        </div>
      </div>

      <!-- Colonne 2, Ligne 1: Value + Transform select -->
      <div class="ot-node-right-section ot-node-main-right">
        <!-- Value (read-only) -->
        <NodeValue
          :value="displayValue"
          :type="node.type"
          :child-count="node.children?.length || 0"
        />

        <!-- Transformation select -->
        <TransformSelect v-if="node.parent" :node-id="nodeId" class="ot-node-transform" />
      </div>

      <!-- Lignes suivantes: Transformations (générées par NodeTransformsList) -->
      <NodeTransformsList v-if="node.transforms.length" :node-id="nodeId" />
    </div>
  </div>
</template>

