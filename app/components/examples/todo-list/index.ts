import type { InjectionKey, Ref } from 'vue';
import type { DeskCore } from '#vue-airport/composables/useCheckIn';

export interface TodoItemData {
  label: string;
  done: boolean;
}

export interface TodoItemContext {
  toggleDone: (id: string | number) => void;
  removeItem: (id: string | number) => void;
  itemsData: Ref<Array<TodoItemData & { id: string | number }>>;
}

export const TODO_DESK_KEY: InjectionKey<DeskCore<TodoItemData> & TodoItemContext> =
  Symbol('todoDesk');

export { default as TodoList } from './TodoList.vue';
export { default as TodoItem } from './TodoItem.vue';
