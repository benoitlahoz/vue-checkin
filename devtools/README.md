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
npm install -D vue-airport-devtools
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

For Nuxt, disable auto-injection and use the Nuxt plugin instead:

```ts
// nuxt.config.ts
import { VueAirportDevTools } from 'vue-airport-devtools/vite'

export default defineNuxtConfig({
  vite: {
    plugins: [
      VueAirportDevTools({ autoInject: false }), // Disable auto-injection for Nuxt
    ],
  },
})
```

Then create a plugin file:

```ts
// plugins/devtools.client.ts
import devtoolsPlugin from 'vue-airport-devtools/nuxt'

export default defineNuxtPlugin(devtoolsPlugin())
```

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

Simply add a `deskId` when creating your desks for better visibility:

```ts
import { useCheckIn } from 'vue-airport'

const { createDesk } = useCheckIn()
createDesk(MY_DESK_KEY, {
  deskId: 'my-custom-desk',  // Will appear in DevTools! 
  context: { /* ... */ },
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

### 1. CheckIn Registry Inspector

Open Vue DevTools → **CheckIn Registry** tab:

- Tree view of all desks and their children
- Live count badges
- Click any node to see detailed state
- Metadata, data, and timestamps

### 2. CheckIn Events Timeline

Open Vue DevTools → **Timeline** → **CheckIn Events** layer:

- ✅ Green: check-in events
- ❌ Red: check-out events  
- 🔄 Blue: update events
- ⚡ Purple: plugin execution

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
