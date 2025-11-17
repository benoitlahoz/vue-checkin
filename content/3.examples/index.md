---
title: Examples
description: Vue CheckIn usage examples with different use cases
---

# Examples

Discover different use cases of **vue-checkin** through practical and detailed examples.

::card-group
  ::card
  ---
  title: Basic Example
  icon: i-heroicons-list-bullet
  to: /examples/basic-example
  ---
  Simple todo list demonstrating fundamental check-in/check-out concepts.
  ::

  ::card
  ---
  title: Tabs Example
  icon: i-heroicons-view-columns
  to: /examples/tabs-example
  ---
  Tab system with shared context to manage the active tab.
  ::

  ::card
  ---
  title: Plugin Example
  icon: i-heroicons-puzzle-piece
  to: /examples/plugin-example
  ---
  Using plugins to extend functionality (ActiveItem, History).
  ::

  ::card
  ---
  title: Form Example
  icon: i-heroicons-document-text
  to: /examples/form-example
  ---
  Form with real-time validation via ValidationPlugin.
  ::

  ::card
  ---
  title: Auto Check-In Example
  icon: i-heroicons-bolt
  to: /examples/auto-check-in-example
  ---
  Automatic registration and synchronization of child components.
  ::

  ::card
  ---
  title: Shopping Cart Example
  icon: i-heroicons-shopping-cart
  to: /examples/shopping-cart-example
  ---
  E-commerce cart with product management, quantities and total calculation.
  ::
::

## Overview

These examples illustrate the main features of **vue-checkin**:

### 🎯 Core Concepts
- Creating a parent desk
- Registering child components
- Reactive data synchronization
- InjectionKey for typed injection

### 🔌 Advanced Features
- **Context**: Sharing data between parent and children
- **Plugins**: Extending desk functionality
- **Validation**: Real-time data validation
- **History**: Undo/Redo with HistoryPlugin

### ⚡ Automation
- `autoCheckIn: true`: Automatic registration on mount
- `watchData: true`: Automatic props synchronization
- Automatic unregistration on destroy

## Example Structure

Each example follows the same structure:

```
example-name/
├── index.ts              # InjectionKey and exports
├── ParentExample.vue     # Parent component (creates the desk)
└── ChildComponent.vue    # Child component (registers to the desk)
```

### InjectionKey (`index.ts`)

```typescript
import type { InjectionKey } from 'vue';
import type { CheckInDesk } from '@/vue-checkin/composables/useCheckIn';

interface MyData {
  // Data type
}

export const MY_DESK_KEY: InjectionKey<CheckInDesk<MyData>> = Symbol('myDesk');

export { default as ParentExample } from './ParentExample.vue';
export { default as ChildComponent } from './ChildComponent.vue';
```

### Parent Component

```vue
<script setup lang="ts">
import { useCheckIn } from '@/vue-checkin/composables/useCheckIn';
import { MY_DESK_KEY } from './index';

const { createDesk } = useCheckIn<MyData>();
const { desk } = createDesk(MY_DESK_KEY, {
  debug: true,
  // options...
});
</script>
```

### Child Component

```vue
<script setup lang="ts">
import { useCheckIn } from '@/vue-checkin/composables/useCheckIn';
import { MY_DESK_KEY } from './index';

useCheckIn<MyData>().checkIn(MY_DESK_KEY, {
  id: props.id,
  autoCheckIn: true,
  watchData: true,
  data: () => ({ ... }),
});
</script>
```

## Next Steps

::alert{type="info"}
Start with the [Basic Example](/examples/basic-example) to understand fundamental concepts, then progress to more advanced examples.
::

::card-group
  ::card
  ---
  title: Getting Started Guide
  icon: i-heroicons-rocket-launch
  to: /getting-started/installation
  ---
  Installation and configuration of vue-checkin
  ::

  ::card
  ---
  title: API Reference
  icon: i-heroicons-book-open
  to: /api/use-check-in
  ---
  Complete API documentation
  ::
::
