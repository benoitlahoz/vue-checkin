import type { InjectionKey, Ref } from 'vue';

export { default as ConstraintsMemberList } from './ConstraintsMemberList.vue';
export { default as ConstraintsMemberItem } from './ConstraintsMemberItem.vue';

export interface MemberData {
  id: string | number;
  name: string;
  avatar?: string;
  role: 'admin' | 'user' | 'guest';
}

export interface MemberListContext {
  members: Ref<MemberData[]>;
  roleClasses: Record<MemberData['role'], string>;
}

export const DESK_CONSTRAINTS_KEY: InjectionKey<Ref<MemberData> & MemberListContext> =
  Symbol('constraintsDesk');
