import type { InjectionKey } from 'vue';
import type { DeskCore } from '#vue-checkin/composables/useCheckIn';

interface TodoItem {
  label: string;
  done: boolean;
}

export const TODO_DESK_KEY: InjectionKey<DeskCore<TodoItem>> = Symbol('todoDesk');

export { default as BasicExample } from './BasicExample.vue';
export { default as TodoItem } from './TodoItem.vue';
