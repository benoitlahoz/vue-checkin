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

### Vite / Vue 3

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VueCheckInDevTools } from 'vue-airport-devtools/vite'

export default defineConfig({
  plugins: [
    vue(),
    VueCheckInDevTools(),
  ],
})
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
window.__VUE_CHECKIN_DEVTOOLS_HOOK__
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
