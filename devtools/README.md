# vue-airport-devtools

Vue DevTools integration for [vue-airport](../lib) library.

## Features

- 🔍 **Registry Inspector** - Visualize the entire CheckIn registry tree with live data
- ⏱️ **Timeline** - Track all check-in/check-out events in real-time
- 📊 **Live Updates** - See your registry state update as you interact with your app
- 🎯 **State Details** - Inspect metadata, data, and timestamps for each item
- 🏷️ **Smart Tags** - Visual indicators for child count and active states

## Installation

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

## Quick Start

### Standard Vue 3 / Vite Project

The plugin will automatically inject DevTools setup in your application:

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VueAirportDevTools } from 'vue-airport-devtools/vite'

export default defineConfig({
  plugins: [
    vue(),
    VueAirportDevTools(), // Auto-injects DevTools
  ],
})
```

### Nuxt Project

For Nuxt, simply add the DevTools module to your configuration:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: [
    // ... other modules
    'vue-airport-devtools/nuxt',
  ],
})
```

> **Note**: The Nuxt module automatically handles client-side setup. No additional plugin file needed.

### Manual Setup (without Vite plugin)

If you prefer manual setup or don't use Vite:

```ts
// main.ts
import { createApp } from 'vue'
import { setupAirportDevTools } from 'vue-airport-devtools'
import App from './App.vue'

const app = createApp(App)

if (import.meta.env.DEV) {
  setupAirportDevTools(app)
}

app.mount('#app')
```

## Usage in Your App

**Important**: DevTools must be explicitly enabled when creating desks.

```ts
import { useCheckIn } from 'vue-airport'

const { createDesk } = useCheckIn()
createDesk(MY_DESK_KEY, {
  devTools: true, // Required to enable DevTools tracking
})
```

For better visibility, add a descriptive `deskId` (optional):

```ts
createDesk(MY_DESK_KEY, {
  devTools: true,
  deskId: 'my-custom-desk', // Optional: better visibility in DevTools
})
```

Add metadata to items for better debugging:

```ts
desk.checkIn('item-1', 
  { title: 'My Item' },
  { 
    label: 'Display Name',  // Shows in DevTools tree
    active: true            // Shows "active" tag
  }
)
```

## What You'll See in DevTools

### 1. Airport Registry Inspector

Open Vue DevTools → **Airport Registry** tab:

- Tree view of all desks and their children
- Live count badges showing registered items
- Click any node to see detailed state
- Metadata, data, and timestamps for each item

### 2. Airport Events Timeline

Open Vue DevTools → **Timeline** → **Airport Events** layer:

- ✓ **Green**: check-in events
- ✗ **Red**: check-out events  
- ↻ **Blue**: update events
- ⚡ **Purple**: plugin execution
- 🗑 **Orange**: clear events

> **Note for Nuxt users**: DevTools do not integrate in Nuxt devtools panels. Use the standard Vue DevTools browser extension instead.

## Architecture

```
vue-airport (lib)
    ↓ emits events
window.__VUE_AIRPORT_DEVTOOLS_HOOK__
    ↓ consumes
vue-airport-devtools
    ↓ displays in
Vue DevTools UI
```

### Zero Overhead

- **Development**: Full integration, real-time updates
- **Production**: Automatically disabled, tree-shaken away
- **Performance**: Only active when DevTools are open

## Development

```bash
cd devtools
npm install
npm run dev      # Watch mode
npm run build    # Production build
```

## License

MIT
