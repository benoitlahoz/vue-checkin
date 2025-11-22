import type { InjectionKey, Ref } from 'vue';

export { default as ConstraintsMemberList } from './ConstraintsMemberList.vue';
export { default as MemberItem } from './MemberItem.vue';

export interface MemberData {
  id: number;
  name: string;
  role: 'admin' | 'user' | 'guest';
}

export const DESK_CONSTRAINTS_KEY: InjectionKey<Ref<MemberData>> = Symbol('constraints-desk');
