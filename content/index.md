---
seo:
  title: VueAirport - Generic Parent-Child Registration System
  description: A flexible, type-safe Vue 3 composable for managing parent-child component registration patterns with plugin support.
---

::u-page-hero
#title
VueAirport

#description
A generic check-in system for parent/child component registration pattern in Vue 3 using Inversion of Control (IoC).

Like an airport check-in desk: parent components provide a check-in counter where child components register themselves with their data. Built on dependency injection principles for clean, maintainable component architecture.

#links
  :::u-button
  ---
  color: neutral
  size: xl
  to: /getting-started/installation
  trailing-icon: i-lucide-arrow-right
  ---
  Get started
  :::

  :::u-button
  ---
  color: neutral
  icon: simple-icons-github
  size: xl
  to: https://github.com/benoitlahoz/vue-airport
  variant: outline
  ---
  Star on GitHub
  :::
::

::u-page-section
#title
Core Features

#features
  :::u-page-feature
  ---
  icon: i-lucide-check-circle
  ---
  #title
  [Type-Safe Registration]{.text-primary}
  
  #description
  Full TypeScript support with generic types for your data. Safely register and retrieve child components with complete type inference.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-plug
  ---
  #title
  [Extensible Plugin System]{.text-primary}
  
  #description
  Extend functionality with plugins. Built-in plugins include active item tracking, history logging, validation, and debug logging.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-refresh-cw
  ---
  #title
  [Reactive by Design]{.text-primary}
  
  #description
  Built on Vue 3's reactivity system. Automatically track check-ins, check-outs, and updates with full reactivity support.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-box
  ---
  #title
  [Inversion of Control]{.text-primary}
  
  #description
  Implements IoC pattern using Vue's provide/inject for dependency injection. Children register with parents instead of parents managing children directly.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-radio
  ---
  #title
  [Event System]{.text-primary}
  
  #description
  Subscribe to check-in, check-out, update, and clear events. Perfect for implementing custom behaviors and side effects.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-package
  ---
  #title
  [Batch Operations]{.text-primary}
  
  #description
  Efficiently handle multiple items at once with checkInMany, checkOutMany, and updateMany methods for optimal performance.
  :::
::
