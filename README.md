# VueCheckIn

[![npm version](https://img.shields.io/npm/v/vue-checkin.svg)](https://www.npmjs.com/package/vue-checkin)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

A generic check-in system for parent/child component registration patterns in Vue 3 using Inversion of Control (IoC).

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

## 📦 Installation

```bash
# npm
npm install vue-checkin

# yarn
yarn add vue-checkin

# pnpm
pnpm add vue-checkin

# bun
bun add vue-checkin
```

## 🚀 Quick Start

### Parent Component

```vue
<script setup lang="ts">
import { useCheckIn } from 'vue-checkin';

interface TabItem {
  label: string;
  content: string;
}

const { createDesk } = useCheckIn<TabItem>();
const { desk } = createDesk('tabs');
const activeTab = ref('tab1');
</script>

<template>
  <div>
    <div v-for="item in desk.getAll()" :key="item.id">
      <button @click="activeTab = item.id">{{ item.data.label }}</button>
    </div>
  </div>
</template>
```

### Child Component

```vue
<script setup lang="ts">
import { useCheckIn } from 'vue-checkin';

const props = defineProps<{
  id: string;
  label: string;
}>();

const { checkIn } = useCheckIn<TabItem>();

checkIn('tabs', {
  autoCheckIn: true,
  id: props.id,
  data: () => ({ label: props.label, content: 'Tab content' })
});
</script>
```

## 🔌 Built-in Plugins

### Active Item Plugin

Track which item is currently active:

```ts
import { useCheckIn, createActiveItemPlugin } from 'vue-checkin';

const { createDesk } = useCheckIn();
const { desk } = createDesk('tabs', {
  plugins: [createActiveItemPlugin()]
});

desk.setActive('tab-1');
const active = desk.getActive();
```

### Validation Plugin

Validate data before check-in:

```ts
import { createValidationPlugin } from 'vue-checkin';

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
```

### History Plugin

Track operation history:

```ts
import { createHistoryPlugin } from 'vue-checkin';

const { desk } = createDesk('items', {
  plugins: [createHistoryPlugin({ maxHistory: 100 })]
});

const history = desk.getHistory();
const lastThree = desk.getLastHistory(3);
```

### Logger Plugin

Log all operations:

```ts
import { createLoggerPlugin } from 'vue-checkin';

const { desk } = createDesk('items', {
  plugins: [
    createLoggerPlugin({
      prefix: '[MyDesk]',
      verbose: true
    })
  ]
});
```

## 📚 Use Cases

- **Tab Systems** - Tabs register with containers
- **Form Management** - Fields register with forms
- **Shopping Carts** - Products check into carts
- **Navigation Menus** - Items register with navigation
- **Any parent-child communication** pattern

## 🛠️ Development

This is a monorepo containing the library and its documentation.

```bash
# Clone the repository
git clone https://github.com/benoitlahoz/vue-checkin.git
cd vue-checkin

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