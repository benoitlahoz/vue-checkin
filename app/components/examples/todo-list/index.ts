import type { InjectionKey } from 'vue';
import type { DeskCore } from '#vue-airport/composables/useCheckIn';

export interface TodoItem {
  label: string;
  done: boolean;
}

export const TODO_DESK_KEY: InjectionKey<DeskCore<TodoItem>> = Symbol('todoDesk');

export { default as TodoList } from './TodoList.vue';
export { default as TodoItem } from './TodoItem.vue';
