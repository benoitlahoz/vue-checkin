<p align="center">
  <img src="./public/vue-airport.png" alt="VueAirport Logo" width="200"/>
</p>

# VueAirport

[![npm version](https://img.shields.io/npm/v/vue-airport.svg)](https://www.npmjs.com/package/vue-airport)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

A generic check-in system (local IoC container) for parent/child component registration patterns in Vue 3 using Inversion of Control (IoC).

Think of it like an airport check-in desk: parent components provide a check-in counter where child components register themselves with their data.

## 📦 Monorepo Structure

VueAirport is organized as a monorepo with separate packages:

- **[vue-airport](./packages/core)** - Core composable and desk system
- **[vue-airport-devtools](./packages/devtools)** - Vue DevTools integration
- **[@vue-airport/plugins-base](./packages/plugins)** - Base plugins (activeItem, validation, debounce, history)

## 📖 Documentation

Full documentation is available at: [https://benoitlahoz.github.io/vue-airport](https://benoitlahoz.github.io/vue-airport)

## ✨ Features

- 🎯 **Inversion of Control** - Children register themselves with parents for clean decoupling
- 🎭 **Generic** - No more props drilling: components manage their own data
- 🔒 **Type-Safe** - Full TypeScript support with generic types
- 🔌 **Plugin Architecture** - Extensible system with built-in plugins
- 📡 **Event System** - Subscribe to check-in, check-out, update, and clear events
- ⚡ **Reactive** - Built on Vue 3's reactivity system
- 🧩 **Dependency Injection** - Uses Vue's provide/inject pattern
- 🛠️ **Batch Operations** - Handle multiple items efficiently
- 📝 **Auto Check-In** - Components can register automatically on mount
- 🔍 **Watch Data** - Automatic updates when component data change
- 🎨 **Shared Context** - Share context between components via the desk

## 📦 Installation

```bash
# npm - Install core and plugins
npm install vue-airport @vue-airport/plugins-base

# yarn
yarn add vue-airport @vue-airport/plugins-base

# pnpm
pnpm add vue-airport @vue-airport/plugins-base

# bun
bun add vue-airport @vue-airport/plugins-base
```

> **💡 Tip:** You can install only `vue-airport` if you don't need the built-in plugins.

### DevTools Integration

For enhanced debugging experience, install the DevTools package:

```bash
# npm
npm install -D vue-airport-devtools

# yarn
yarn add -D vue-airport-devtools

# pnpm
pnpm add -D vue-airport-devtools

# bun
bun add -D vue-airport-devtools
```

See the [DevTools section](#-devtools) below for setup instructions.

## 🚀 Quick Start

### Parent Component

```vue
<script setup lang="ts">
// ...

// State to manage all tabs
const tabsData = ref<
  Array<TabItemData>
>([
  {
    id: 'tab-1',
    label: 'Nuxt',
    url: 'https://nuxt.com',
    icon: 'material-icon-theme:nuxt',
  },
  {
    id: 'tab-2',
    label: 'Tailwind',
    url: 'https://tailwindcss.com',
    icon: 'vscode-icons:file-type-tailwind',
  },
  {
    id: 'tab-3',
    label: 'VueAirport',
    url: 'https://benoitlahoz.github.io/vue-airport',
    icon: 'mdi:airplane',
  },
]);

// Create a desk with context to share the active tab state and helpers
const { createDesk } = useCheckIn<TabItemData, TabItemContext>();
createDesk(TABS_DESK_KEY, {
  devTools: true,
  debug: false,
  context: {
    // Provide context data and method to the children

    activeTab: activeTabId,
    selectTab,
    closeTab,
    tabsCount: computed(() => tabsData.value.length),
    tabsData,
  },
});

// ...
</script>

<template>
  <div>
    <!-- No props, just id ! -->
    <TabItem v-for="tab in tabsData" :id="tab.id" :key="tab.id" />
  </div>
</template>
```

### Child Component

```vue
<script setup lang="ts">
// ...

const props = defineProps<{
  id?: string | number;
}>();

// Check in to the tabs desk and capture the desk (which contains provided context)
const { checkIn } = useCheckIn<TabItemData, TabItemContext>();
const { desk } = checkIn(TABS_DESK_KEY, {
  id: props.id,
  autoCheckIn: true,
  // For devTools.
  watchData: true,
  data: (desk) => {
    const tab = desk.tabsData?.value.find((t) => t.id === props.id);
    if (!tab) return { icon: '', label: '', content: '' };
    return tab;
  },
});

// Get tab data from tabsData
const tabData = computed(() => {
  return desk?.tabsData?.value.find((t) => t.id === props.id);
});

const onSelect = () => {
  if (desk && typeof desk.selectTab === 'function') {
    desk.selectTab(props.id as any);
  } 
};

const onClose = () => {
  if (desk && typeof desk.closeTab === 'function') {
    desk.closeTab(props.id as any);
  } 
};

// ...
</script>

<template>
  <div @click="onSelect">
    <span>{{ tabData?.label }}</span>
    <button @click.stop="onClose">x</button>
  </div>
</template>
```

See the full API reference and examples in the [documentation](https://benoitlahoz.github.io/vue-airport).

## 🔌 Base Plugins

The `@vue-airport/plugins-base` package includes four base plugins to extend desk functionality.

### Installation

```bash
# npm
npm install @vue-airport/plugins-base

# yarn
yarn add @vue-airport/plugins-base

# pnpm
pnpm add @vue-airport/plugins-base

# bun
bun add @vue-airport/plugins-base
```

### Active Item Plugin

Track which item is currently active:

```ts
import { useCheckIn } from 'vue-airport';
import { createActiveItemPlugin } from '@vue-airport/plugins-base';

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
import { useCheckIn } from 'vue-airport';
import { createValidationPlugin } from '@vue-airport/plugins-base';

const { createDesk } = useCheckIn();
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
import { useCheckIn } from 'vue-airport';
import { createHistoryPlugin } from '@vue-airport/plugins-base';

const { createDesk } = useCheckIn();
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
import { useCheckIn } from 'vue-airport';
import { createDebouncePlugin } from '@vue-airport/plugins-base';

const { createDesk } = useCheckIn();
const { desk } = createDesk('search', {
  plugins: [
    createDebouncePlugin({
      delay: 300,
      operations: ['check-in', 'update']
    })
  ]
});
```

## 🔍 DevTools

VueAirport includes a comprehensive DevTools integration for debugging and monitoring your desks in development.

### Installation

Install the DevTools package as a dev dependency:

```bash
# npm
npm install -D vue-airport-devtools

# yarn
yarn add -D vue-airport-devtools

# pnpm
pnpm add -D vue-airport-devtools

# bun
bun add -D vue-airport-devtools
```

### Setup

#### For Vite Projects

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { vueAirportDevTools } from 'vue-airport-devtools/vite';

export default defineConfig({
  plugins: [
    vue(),
    vueAirportDevTools()
  ]
});
```

#### For Nuxt Projects

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['vue-airport-devtools/nuxt']
});
```

### Enable DevTools in Your Desk

```vue
<script setup lang="ts">
import { useCheckIn } from 'vue-airport';

const { createDesk } = useCheckIn();
const { desk } = createDesk('my-desk', {
  devTools: import.meta.env.DEV  // Enable DevTools for this desk
});
</script>
```

### Features

- 📊 **Real-time Monitoring** - Track all check-ins, check-outs, and updates
- 🔍 **Desk Inspector** - View desk state, registered items, and metadata
- ⏱️ **Performance Metrics** - Monitor operation timing and plugin execution
- 📜 **Event Timeline** - See chronological history of all desk events
- 🎯 **Plugin Tracking** - Debug plugin behavior and side effects
- 🔌 **Multiple Desk Support** - Monitor all active desks in your application

### Accessing DevTools

Once configured, DevTools are accessible through the Vue DevTools browser extension:

1. Open Vue DevTools in your browser
2. Navigate to the "VueAirport" tab
3. Select a desk to inspect
4. View real-time updates as components check in/out

> **💡 Tip:** DevTools automatically disable in production builds for optimal performance.

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