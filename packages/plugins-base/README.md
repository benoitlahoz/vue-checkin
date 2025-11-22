# @vue-airport/plugins-base

[![npm version](https://img.shields.io/npm/v/@vue-airport/plugins-base.svg)](https://www.npmjs.com/package/@vue-airport/plugins-base)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

Base plugin collection for [vue-airport](https://github.com/benoitlahoz/vue-airport) - A generic check-in system for Vue 3 component registration patterns.

## 📖 Documentation

Full documentation is available at: [https://benoitlahoz.github.io/vue-airport](https://benoitlahoz.github.io/vue-airport)

## ✨ Plugins Included

- 🎯 **Active Item** - Manage active/selected items in your desk
- 📜 **History** - Track all check-in/check-out/update operations
- ⏱️ **Debounce** - Debounce event notifications for batch processing

## 📦 Installation

```bash
# npm
npm install vue-airport @vue-airport/plugins-base

# yarn
yarn add vue-airport @vue-airport/plugins-base

# pnpm
pnpm add vue-airport @vue-airport/plugins-base

# bun
bun add vue-airport @vue-airport/plugins-base
```

## 🚀 Usage

### Active Item Plugin

Track and manage the currently active/selected item in your desk.

```vue
<script setup lang="ts">
import { useCheckIn } from 'vue-airport';
import { createActiveItemPlugin } from '@vue-airport/plugins-base';

interface TabItem {
  label: string;
  content: string;
}

const { createDesk } = useCheckIn<TabItem>();
const { desk } = createDesk('tabs', {
  plugins: [createActiveItemPlugin()]
});

// Set active item
desk.setActive('tab-1');

// Get active item
const activeItem = desk.getActive();

// Check if has active
console.log(desk.hasActive); // true

// Clear active
desk.clearActive();

// Listen to active changes
desk.on('active-changed', ({ id, data }) => {
  console.log('Active item changed:', id, data);
});
</script>
```

**API:**
- `desk.setActive(id)` - Set active item by ID
- `desk.getActive()` - Get current active item
- `desk.clearActive()` - Clear active selection
- `desk.hasActive` - Computed boolean indicating if there's an active item
- `desk.activeId` - Ref containing the active item ID

### History Plugin

Track all operations performed on the desk with timestamps.

```vue
<script setup lang="ts">
import { useCheckIn } from 'vue-airport';
import { createHistoryPlugin, type HistoryEntry } from '@vue-airport/plugins-base';

interface Item {
  title: string;
}

const { createDesk } = useCheckIn<Item>();
const { desk } = createDesk('items', {
  plugins: [
    createHistoryPlugin({
      maxHistory: 100 // Keep last 100 operations
    })
  ]
});

// Perform operations (automatically tracked)
desk.checkIn('item-1', { title: 'First' });
desk.update('item-1', { title: 'Updated' });
desk.checkOut('item-1');

// Get full history
const history = desk.getHistory();

// Get last N operations
const recent = desk.getLastHistory(10);

// Filter by action type
const checkIns = desk.getHistoryByAction('check-in');
const checkOuts = desk.getHistoryByAction('check-out');
const updates = desk.getHistoryByAction('update');

// Clear history
desk.clearHistory();
</script>
```

**API:**
- `desk.getHistory()` - Get all history entries
- `desk.getLastHistory(n)` - Get last N history entries
- `desk.getHistoryByAction(action)` - Filter history by action type
- `desk.clearHistory()` - Clear all history

**History Entry:**
```typescript
interface HistoryEntry<T> {
  action: 'check-in' | 'check-out' | 'update';
  id: string | number;
  data?: T;
  timestamp: number;
}
```

### Debounce Plugin

Debounce event notifications for batch processing.

```vue
<script setup lang="ts">
import { useCheckIn } from 'vue-airport';
import { createDebouncePlugin } from '@vue-airport/plugins-base';

interface SearchResult {
  query: string;
  results: string[];
}

const { createDesk } = useCheckIn<SearchResult>();
const { desk } = createDesk('search', {
  plugins: [
    createDebouncePlugin({
      checkInDelay: 500,    // Debounce check-in events by 500ms
      checkOutDelay: 300,   // Debounce check-out events by 300ms
      maxWait: 2000,        // Force invoke after 2s max
    })
  ]
});

// Listen to debounced events
desk.onDebouncedCheckIn?.((id, data) => {
  console.log('Debounced check-in:', id, data);
  // This will only fire after 500ms of inactivity
  // or after 2s max (maxWait)
});

desk.onDebouncedCheckOut?.((id) => {
  console.log('Debounced check-out:', id);
});

// Rapid check-ins (only last batch will trigger callback)
desk.checkIn('result-1', { query: 'a', results: [] });
desk.checkIn('result-2', { query: 'ab', results: [] });
desk.checkIn('result-3', { query: 'abc', results: [] });
// onDebouncedCheckIn will fire once with all 3

// Manual control
desk.flushPendingCheckIns?.();   // Force process pending check-ins
desk.flushPendingCheckOuts?.();  // Force process pending check-outs
desk.cancelPendingCheckIns?.();  // Cancel pending check-ins
desk.cancelPendingCheckOuts?.(); // Cancel pending check-outs

// Get pending count
const pendingCheckIns = desk.getPendingCheckInCount?.();
const pendingCheckOuts = desk.getPendingCheckOutCount?.();
</script>
```

**API:**
- `desk.onDebouncedCheckIn(callback)` - Set callback for debounced check-ins
- `desk.onDebouncedCheckOut(callback)` - Set callback for debounced check-outs
- `desk.flushPendingCheckIns()` - Force process pending check-ins
- `desk.flushPendingCheckOuts()` - Force process pending check-outs
- `desk.cancelPendingCheckIns()` - Cancel pending check-ins
- `desk.cancelPendingCheckOuts()` - Cancel pending check-outs
- `desk.getPendingCheckInCount()` - Get pending check-in count
- `desk.getPendingCheckOutCount()` - Get pending check-out count

## 🔌 Combining Plugins

You can use multiple plugins together. For validation, please use [`@vue-airport/plugins-validation`](./plugins-validation):

```vue
<script setup lang="ts">
import { useCheckIn } from 'vue-airport';
import {
  createActiveItemPlugin,
  createHistoryPlugin,
  createDebouncePlugin
} from '@vue-airport/plugins-base';
import { createValidationPlugin } from '@vue-airport/plugins-validation';

const { createDesk } = useCheckIn<MyData>();
const { desk } = createDesk('my-desk', {
  plugins: [
    createActiveItemPlugin(),
    createValidationPlugin({ required: ['name'] }),
    createHistoryPlugin({ maxHistory: 50 }),
    createDebouncePlugin({ checkInDelay: 300 })
  ]
});
</script>
```

## 🛠️ Creating Custom Plugins

You can create your own plugins following the plugin API:

```typescript
import type { CheckInPlugin, DeskCore } from 'vue-airport';

export const createMyPlugin = <T = unknown>(): CheckInPlugin<T> => ({
  name: 'my-plugin',
  version: '1.0.0',

  install: (desk: DeskCore<T>) => {
    // Initialize plugin state
    return () => {
      // Cleanup when desk is destroyed
    };
  },

  methods: {
    myMethod(desk: DeskCore<T>, ...args: any[]) {
      // Add custom methods to desk
    }
  },

  computed: {
    myComputed: (desk: DeskCore<T>) => {
      // Add computed properties
      return computed(() => /* ... */);
    }
  },

  onCheckIn(id, data, desk) {
    // Called when item checks in
  },

  onCheckOut(id, desk) {
    // Called when item checks out
  },

  onUpdate(id, data, desk) {
    // Called when item updates
  },

  beforeCheckIn(id, data, desk) {
    // Called before check-in, can prevent it by returning false
    return true;
  }
});
```

## 📄 License

MIT © [Benoit Lahoz](https://github.com/benoitlahoz)

## 🔗 Links

- [Documentation](https://benoitlahoz.github.io/vue-airport)
- [GitHub Repository](https://github.com/benoitlahoz/vue-airport)
- [npm Package](https://www.npmjs.com/package/@vue-airport/plugins-base)
- [Core Package](https://www.npmjs.com/package/vue-airport)
