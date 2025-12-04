import type { Ref, Component } from 'vue';
import type { ObjectNodeData, ObjectTransformerContext } from './types';

/**
 * State of the ObjectNode component
 */
export interface ObjectNodeState {
  isOpen: boolean;
  isPrimitive: boolean;
  isEditing: boolean;
  isHovered: boolean;
}

/**
 * Components available for composition in ObjectNode slot
 */
export interface ObjectNodeComponents {
  NodeOpen: Component;
  NodeActions: Component;
  NodeKeyEditor: Component;
  TransformSelect: Component;
  NodeTransformsList: Component;
  Separator: Component;
}

/**
 * Utility functions available in ObjectNode slot
 */
export interface ObjectNodeUtils {
  formatValue: (value: any, type: string) => string;
  getChildKey: (child: ObjectNodeData, index: number) => string;
  isPrimitive: (type: string) => boolean;
}

/**
 * Refs available for layout calculations and DOM manipulation
 */
export interface ObjectNodeRefs {
  valueElement: Ref<HTMLElement | null>;
  firstChildElement: Ref<HTMLElement | null>;
  inputElement: Ref<HTMLElement | null>;
}

/**
 * Computed values available in ObjectNode slot
 */
export interface ObjectNodeComputed {
  transformsPaddingLeft: string;
}

/**
 * Event handlers for node interaction
 */
export interface ObjectNodeHandlers {
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

/**
 * Complete slot props exposed by ObjectNode component
 */
export interface ObjectNodeSlotProps {
  /** The current node data */
  node: ObjectNodeData;
  /** The current node ID */
  nodeId: string;
  /** Reactive state of the node */
  state: ObjectNodeState;
  /** Sub-components available for composition */
  components: ObjectNodeComponents;
  /** Utility functions */
  utils: ObjectNodeUtils;
  /** Template refs for layout calculations */
  refs: ObjectNodeRefs;
  /** Computed values */
  computed: ObjectNodeComputed;
  /** Event handlers */
  handlers: ObjectNodeHandlers;
  /** The desk context with all methods */
  desk: typeof Object & ObjectTransformerContext;
}
