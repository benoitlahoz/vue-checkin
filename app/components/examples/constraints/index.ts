import type { InjectionKey, Ref } from 'vue';

export { default as ConstraintsExample } from './ConstraintsExample.vue';
export { default as MemberItem } from './MemberItem.vue';

export interface MemberData {
  id: number;
  name: string;
  role: 'admin' | 'user' | 'guest';
}

export const DESK_CONSTRAINTS_KEY: InjectionKey<Ref<MemberData>> = Symbol('constraints-desk');
