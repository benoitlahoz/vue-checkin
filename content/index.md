---
seo:
  title: VueAirport - Generic Parent-Child Registration System
  description: A flexible, type-safe Vue 3 composable for managing parent-child component registration patterns with plugin support.
---

::u-page-hero
#title
:hero-logo

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

::u-page-section
#title
Modular Architecture

#description
VueAirport is organized as a monorepo with separate packages for maximum flexibility

#features
  :::u-page-feature
  ---
  icon: i-lucide-box
  ---
  #title
  vue-airport
  
  #description
  Core composable and desk system. Install only what you need for minimal bundle size.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-plug
  ---
  #title
  @vue-airport/plugins-base
  
  #description
  Built-in plugins: activeItem, validation, debounce, and history. Optional, install separately.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-bug
  ---
  #title
  vue-airport-devtools
  
  #description
  Vue DevTools integration for debugging and inspecting check-in registries.
  :::
::

::u-page-section
#title
Use Cases

#description
VueAirport excels in scenarios where you need dynamic parent-child relationships

#features
  :::u-page-feature
  ---
  icon: i-lucide-layout-panel-top
  ---
  #title
  Tab Systems
  
  #description
  Create dynamic tabs where children register their content and metadata automatically.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-list-checks
  ---
  #title
  Todo Lists
  
  #description
  Build interactive lists where items can self-register and manage their own state.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-file-text
  ---
  #title
  Forms & Validation
  
  #description
  Complex forms where fields register themselves and validation state is centrally managed.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-shopping-cart
  ---
  #title
  Shopping Carts
  
  #description
  Product cards that automatically add/remove themselves from a central cart system.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-search
  ---
  #title
  Search Results
  
  #description
  Dynamic search with debounced updates and automatic result management.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-panel-left
  ---
  #title
  Accordions & Menus
  
  #description
  Collapsible sections that coordinate state through a shared desk.
  :::
::

  :::
::

::u-page-section
#title
See It In Action

#description
Try our interactive examples to understand how VueAirport works

:tabs

:todo-list
::
