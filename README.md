# VueAirport

[![npm version](https://img.shields.io/npm/v/vue-airport.svg)](https://www.npmjs.com/package/vue-airport)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

A generic check-in system (local IoC container) for parent/child component registration patterns in Vue 3 using Inversion of Control (IoC).

Think of it like an airport check-in desk: parent components provide a check-in counter where child components register themselves with their data.

## 📖 Documentation

Full documentation is available at: [https://benoitlahoz.github.io/vue-checkin](https://benoitlahoz.github.io/vue-checkin)

## ✨ Features

- 🎯 **Inversion of Control** - Children register themselves with parents for clean decoupling
- 🔒 **Type-Safe** - Full TypeScript support with generic types
- 🔌 **Plugin Architecture** - Extensible system with built-in plugins
- 📡 **Event System** - Subscribe to check-in, check-out, update, and clear events
- ⚡ **Reactive** - Built on Vue 3's reactivity system
- 🧩 **Dependency Injection** - Uses Vue's provide/inject pattern
- 🛠️ **Batch Operations** - Handle multiple items efficiently
- 📝 **Auto Check-In** - Components can register automatically on mount
- 🔍 **Watch Data** - Automatic updates when component props change
- 🎨 **Shared Context** - Share context between components via the desk

## 📦 Installation

```bash
# npm
npm install vue-airport

# yarn
yarn add vue-airport

# pnpm
pnpm add vue-airport

# bun
bun add vue-airport
```

## 🚀 Quick Start

### Parent Component

```vue
<script setup lang="ts">
import { useCheckIn } from 'vue-airport';

interface TabItem {
  label: string;
  content: string;
  icon?: string;
}

// Create a desk with shared context
const activeTabId = ref<string | number>('tab-1');
const { createDesk } = useCheckIn<TabItem, { activeTab: Ref<string | number> }>();
const { desk } = createDesk('tabs', {
  context: { activeTab: activeTabId }
});

// Access registered items
const tabs = computed(() => desk.getAll());
</script>

<template>
  <div>
    <div v-for="item in tabs" :key="item.id">
      <button @click="activeTabId = item.id">
        {{ item.data.label }}
      </button>
    </div>
  </div>
</template>
```

### Child Component

```vue
<script setup lang="ts">
import { useCheckIn } from 'vue-airport';

const props = defineProps<{
  id: string;
  label: string;
  content: string;
  icon?: string;
}>();

interface TabItem {
  label: string;
  content: string;
  icon?: string;
}

// Automatically register with data watching enabled
useCheckIn<TabItem>().checkIn('tabs', {
  id: props.id,
  autoCheckIn: true,
  watchData: true,
  data: () => ({
    label: props.label,
    content: props.content,
    icon: props.icon
  })
});
</script>
```

## 🔌 Built-in Plugins

### Active Item Plugin

Track which item is currently active:

```ts
import { useCheckIn, createActiveItemPlugin } from 'vue-airport';

const { createDesk } = useCheckIn();
const { desk } = createDesk('tabs', {
  plugins: [createActiveItemPlugin()]
});

desk.setActive('tab-1');
const active = desk.getActive();
const hasActive = computed(() => desk.hasActive);
```

### Validation Plugin

Validate data before check-in:

```ts
import { createValidationPlugin } from 'vue-airport';

const { desk } = createDesk('form', {
  plugins: [
    createValidationPlugin({
      required: ['name', 'email'],
      validate: (data) => {
        if (!data.email.includes('@')) return 'Invalid email';
        return true;
      }
    })
  ]
});

// Access validation errors
const errors = desk.getValidationErrors();
const lastError = desk.getLastValidationError();
```

### History Plugin

Track operation history:

```ts
import { createHistoryPlugin } from 'vue-airport';

const { desk } = createDesk('items', {
  plugins: [createHistoryPlugin({ maxHistory: 100 })]
});

const history = desk.getHistory();
const lastThree = desk.getLastHistory(3);
const checkIns = desk.getHistoryByAction('check-in');
desk.clearHistory();
```

### Debounce Plugin

Debounce operations:

```ts
import { createDebouncePlugin } from 'vue-airport';

const { desk } = createDesk('search', {
  plugins: [
    createDebouncePlugin({
      delay: 300,
      operations: ['check-in', 'update']
    })
  ]
});
```

## 📚 Use Cases

- **Tab Systems** - Tabs register with containers
- **Form Management** - Fields register with forms
- **Shopping Carts** - Products check into carts
- **Navigation Menus** - Items register with navigation
- **Debounced Search** - Search results management with debouncing
- **Any parent-child communication pattern**

## 🛠️ Development

This is a monorepo containing the library and its documentation.

```bash
# Clone the repository
git clone https://github.com/benoitlahoz/vue-checkin.git
cd vue-airport

# Install dependencies
yarn && yarn lib:install

# Build the library
yarn lib:build

# Start documentation dev server
yarn dev
```

## 📄 License

[MIT License](https://opensource.org/licenses/MIT)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 💡 Credits

Created by [Benoit Lahoz](https://github.com/benoitlahoz)