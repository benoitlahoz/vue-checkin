import type { InjectionKey, Ref } from 'vue';

export { default as ConstraintsMemberList } from './ConstraintsMemberList.vue';
export { default as MemberItem } from './MemberItem.vue';

export interface MemberData {
  id: string | number;
  name: string;
  role: 'admin' | 'user' | 'guest';
}

export interface MemberListContext {
  members: Ref<MemberData[]>;
}

export const DESK_CONSTRAINTS_KEY: InjectionKey<Ref<MemberData> & MemberListContext> =
  Symbol('constraintsDesk');
