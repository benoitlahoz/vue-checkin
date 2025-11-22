<script setup lang="ts">
import { ref, computed } from 'vue';
import { useCheckIn } from 'vue-airport';
import { createConstraintsPlugin, ConstraintType } from '@vue-airport/plugins-validation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MemberItem, DESK_CONSTRAINTS_KEY, type MemberData, type MemberListContext } from '.';

/**
 * Constraints Example - Desk usage
 *
 * Demonstrates:
 * - Desk pattern with plugins
 * - Multiple constraint types (unique, maxCount, pattern, range, forbidden, custom async, etc.)
 * - Real-time error feedback
 * - UI inspired by PluginStack
 */
const members = ref<MemberData[]>([]);

const constraints = [
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
          return 'Cannot remove the last admin.';
        }
      }
      return null;
    },
    message: 'Cannot remove the last admin.',
  },
] as import('@vue-airport/plugins-validation').Constraint<MemberData>[];

const newName = ref('');
const newRole = ref<MemberData['role']>('user');
const error = ref<string | null>(null);

const addMember = async (name: string, role: MemberData['role']) => {
  error.value = null;
  const id = Math.floor(((Date.now() % 100000) + Math.random() * 100000) % 100000) + 1;
  const member: MemberData = {
    id,
    name: name.trim(),
    role,
  };
  const isValid = await desk.checkIn(id, member);
  if (isValid) {
    members.value.push(member);
  } else {
    const errors = (desk as any).getConstraintErrorsForItem
      ? (desk as any).getConstraintErrorsForItem(id)
      : [];
    error.value = errors.map((e: any) => e.message).join('; ');
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
    members,
  },
  onCheckOut(id) {
    console.log('Checking out member with id:', id);
    const index = members.value.findIndex((m) => m.id === id);
    if (index !== -1) {
      members.value.splice(index, 1);
    }
  },
});

addMember('Alice', 'admin');
addMember('Bob', 'user');
addMember('Charlie', 'guest');

const items = computed(() => {
  return (desk as any).members.value || [];
});
const constraintErrors = computed(() =>
  (desk as any).getConstraintErrors ? (desk as any).getConstraintErrors() : []
);
</script>

<template>
  <div class="constraints-example">
    <div class="flex gap-3 mb-6 flex-wrap justify-between items-center">
      <div class="flex gap-2 items-center">
        <input v-model="newName" placeholder="Name" class="input input-bordered" />
        <select v-model="newRole" class="input input-bordered">
          <option value="user">User</option>
          <option value="admin">Admin</option>
          <option value="guest">Guest</option>
        </select>
        <Button :disabled="!newName" @click="() => addMember(newName, newRole)">
          <span class="mr-2">+</span>Add Member
        </Button>
      </div>
      <Badge variant="outline" class="border-primary bg-primary/20 text-primary px-3 py-1">
        {{ items.length }} members
      </Badge>
    </div>

    <div v-if="constraintErrors.length" class="error mb-4">
      <Badge color="red" class="mb-2">
        <template v-for="err in constraintErrors">
          <div v-for="msg in err.errors" :key="msg">{{ msg }}</div>
        </template>
      </Badge>
      <div v-if="error" class="text-destructive text-sm">{{ error }}</div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- Members list -->
      <div class="p-4 bg-card border border-muted rounded-md">
        <h3 class="m-0 mb-4 text-base font-semibold">Members ({{ items.length }})</h3>
        <ul class="list-none p-0 m-0 flex flex-col gap-2 max-h-[400px] overflow-y-auto">
          <li
            v-for="item in items"
            :key="item.id"
            :data-slot="`constraints-list-item-${item.id}`"
            class="flex items-center justify-between p-3 border border-muted rounded-md cursor-pointer transition-all duration-200 hover:bg-accent dark:hover:bg-accent-dark"
          >
            <MemberItem :id="item.id" />
          </li>
        </ul>
      </div>
      <!-- Details panel (could be extended) -->
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
</template>

<style scoped>
/* UI inspired by PluginStack */
.constraints-example {
  max-width: 700px;
  margin: 0 auto;
}
.error {
  margin-bottom: 1em;
}
.input.input-bordered {
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 0.5em 0.75em;
  margin-right: 0.5em;
}
.icon {
  font-size: 1.2em;
}
</style>
