<script setup lang="ts">
import { ref, computed } from 'vue';
import { useCheckIn } from 'vue-airport';
import {
  createConstraintsPlugin,
  ConstraintType,
  type Constraint,
} from '@vue-airport/plugins-validation';
import {
  ConstraintsMemberItem,
  DESK_CONSTRAINTS_KEY,
  type DeskWithConstraints,
  type MemberData,
  type MemberListContext,
} from '.';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

/**
 * Constraints Example - Desk usage
 *
 * Demonstrates:
 * - Desk pattern with plugins
 * - Multiple constraint types (unique, maxCount, pattern, range, forbidden, custom async, etc.)
 * - Real-time error feedback
 * - UI inspired by PluginStack
 */

const constraints: Constraint<MemberData>[] = [
  // Unique name
  { type: ConstraintType.Unique, key: 'name' as keyof MemberData, message: 'Name must be unique' },
  // Max count
  { type: ConstraintType.MaxCount, count: 5, message: 'Maximum 5 members allowed' },
  // Name pattern (letters only, min 3 chars)
  {
    type: ConstraintType.Pattern,
    key: 'name' as keyof MemberData,
    regex: /^[A-Za-z]{3,}$/,
    message: 'Name must be at least 3 letters (A-Z)',
  },
  // Range: id must be between 1 and 99999
  {
    type: ConstraintType.Range,
    key: 'id' as keyof MemberData,
    min: 1,
    max: 99999,
    message: 'ID must be between 1 and 99999',
  },
  // Forbidden: name cannot be "Admin" or "Root"
  {
    type: ConstraintType.Forbidden,
    key: 'name' as keyof MemberData,
    values: ['Admin', 'Root'],
    message: 'Name "Admin" and "Root" are forbidden',
  },
  // Custom: only one guest allowed (sync)
  {
    type: ConstraintType.Custom,
    fn: (member: MemberData, members: MemberData[]) => {
      if (member.role === 'guest' && members.filter((m) => m.role === 'guest').length >= 1) {
        return 'Only one guest allowed';
      }
      return null;
    },
    message: undefined,
  },
  // Custom: simulate async check (e.g. server-side)
  {
    type: ConstraintType.Custom,
    fn: async (member: MemberData) => {
      await new Promise((r) => setTimeout(r, 100));
      if (member.name.toLowerCase() === 'forbiddenasync') {
        return 'Name "forbiddenasync" is not allowed (async check)';
      }
      return null;
    },
    message: undefined,
  },
  // beforeCheckOut: cannot remove last admin
  {
    type: ConstraintType.BeforeCheckOut,
    rule: (member: MemberData, members: MemberData[]) => {
      if (member.role === 'admin') {
        const adminCount = members.filter((m) => m.role === 'admin').length;
        if (adminCount <= 1) {
          // Clear previous errors to avoid stacking
          (desk as DeskWithConstraints).clearConstraintErrors();
          return 'Cannot remove the last admin.';
        }
      }
      return null;
    },
    message: 'Cannot remove the last admin.',
  },
];

const newName = ref('');
const newRole = ref<MemberData['role']>('user');

const addMember = async (name: string, role: MemberData['role']) => {
  (desk as DeskWithConstraints).clearConstraintErrors();
  const id = Math.floor(((Date.now() % 100000) + Math.random() * 100000) % 100000) + 1;
  // Download a random user image for avatar
  const gender = Math.random() < 0.5 ? 'men' : 'women';
  const avatar = `https://randomuser.me/api/portraits/${gender}/${Math.floor(Math.random() * 99)}.jpg`;
  const member: MemberData = {
    id,
    name: name.trim(),
    role,
    avatar,
  };
  const isValid = await desk.checkIn(id, member);
  if (isValid) {
    const ctx = desk.getContext<MemberListContext>();
    if (ctx && ctx.members) {
      // Update context state
      ctx.members.value.push(member);
    }
  }
  newName.value = '';
  newRole.value = 'user';
};

const { createDesk } = useCheckIn<MemberData, MemberListContext>();
const { desk } = createDesk(DESK_CONSTRAINTS_KEY, {
  plugins: [createConstraintsPlugin<MemberData>(constraints)],
  devTools: true,
  debug: false,
  context: {
    members: ref([]),
    roleClasses: {
      admin: 'bg-yellow-800/10 border border-yellow-800 text-yellow-800',
      user: 'bg-blue-800/10 border border-blue-800 text-blue-800',
      guest: 'bg-green-800/10 border border-green-800 text-green-800',
    },
  },
  onCheckOut(id, desk) {
    const ctx = desk.getContext<MemberListContext>();
    if (ctx && ctx.members) {
      ctx.members.value = ctx.members.value.filter((m) => m.id !== id);
    }
  },
});

const items = computed(() => {
  const ctx = desk.getContext<MemberListContext>();
  if (ctx && ctx.members) {
    return ctx.members.value;
  }
  return [];
});

const errors = computed(() =>
  (desk as DeskWithConstraints)
    .getConstraintErrors()
    .map((e: any) => e.errors)
    .flat()
);

onMounted(async () => {
  await addMember('Alice', 'admin');
  await addMember('Bob', 'user');
  await addMember('Charlie', 'guest');
});
</script>

<template>
  <div>
    <div class="flex gap-3 mb-6 flex-wrap justify-between items-center">
      <div class="flex gap-2 items-center">
        <Input
          v-model="newName"
          placeholder="Name"
          class="input input-bordered"
          @keyup.enter="() => addMember(newName, newRole)"
        />
        <Select v-model="newRole">
          <SelectTrigger class="input input-bordered">
            <SelectValue placeholder="Choose a role" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Role</SelectLabel>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="guest">Guest</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        <Button :disabled="!newName" @click="() => addMember(newName, newRole)">
          <span class="mr-2">+</span>Add Member
        </Button>
      </div>
      <Badge variant="outline" class="border-primary bg-primary/20 text-primary px-3 py-1">
        {{ items.length }} members
      </Badge>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- Members list -->
      <div class="p-4 bg-card border border-muted rounded-md flex-1">
        <ul class="list-none p-0 m-0 flex flex-col gap-2 max-h-[400px] overflow-y-auto">
          <li
            v-for="item in items"
            :key="item.id"
            :data-slot="`constraints-list-item-${item.id}`"
            class="flex items-center justify-between p-3 border border-muted rounded-md cursor-pointer transition-all duration-200 hover:bg-accent dark:hover:bg-accent-dark"
          >
            <ConstraintsMemberItem :id="item.id" />
          </li>
        </ul>
      </div>
      <!-- Errors and rules -->
      <div class="flex flex-col gap-4">
        <div class="p-4 bg-card border border-muted rounded-md flex-1">
          <h3 class="m-0 mb-2 text-base font-semibold">Errors</h3>
          <ul class="text-sm list-none text-destructive">
            <li v-if="!errors.length" class="text-muted">No errors</li>
            <li v-for="(err, idx) in errors" :key="idx">{{ err }}</li>
          </ul>
        </div>
        <div class="p-4 bg-card border border-muted rounded-md">
          <h3 class="m-0 mb-4 text-base font-semibold">Constraint Rules</h3>
          <ul class="text-sm list-disc pl-4">
            <li>Name must be unique</li>
            <li>Maximum 5 members allowed</li>
            <li>Name must be at least 3 letters (A-Z)</li>
            <li>ID must be between 1 and 99999</li>
            <li>Name "Admin" and "Root" are forbidden</li>
            <li>Only one guest allowed</li>
            <li>Async: Name "forbiddenasync" is not allowed</li>
            <li>Cannot remove the last admin</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>
