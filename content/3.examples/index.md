---
title: Exemples
description: Exemples d'utilisation de vue-checkin avec différents cas d'usage
---

# Exemples

Découvrez différents cas d'usage de **vue-checkin** à travers des exemples pratiques et détaillés.

::card-group
  ::card
  ---
  title: Basic Example
  icon: i-heroicons-list-bullet
  to: /examples/basic-example
  ---
  Liste de tâches simple démontrant les concepts fondamentaux du check-in/check-out.
  ::

  ::card
  ---
  title: Tabs Example
  icon: i-heroicons-view-columns
  to: /examples/tabs-example
  ---
  Système d'onglets avec contexte partagé pour gérer l'onglet actif.
  ::

  ::card
  ---
  title: Plugin Example
  icon: i-heroicons-puzzle-piece
  to: /examples/plugin-example
  ---
  Utilisation de plugins pour étendre les fonctionnalités (ActiveItem, History).
  ::

  ::card
  ---
  title: Form Example
  icon: i-heroicons-document-text
  to: /examples/form-example
  ---
  Formulaire avec validation en temps réel via le ValidationPlugin.
  ::

  ::card
  ---
  title: Auto Check-In Example
  icon: i-heroicons-bolt
  to: /examples/auto-check-in-example
  ---
  Enregistrement et synchronisation automatiques des composants enfants.
  ::
::

## Vue d'ensemble

Ces exemples illustrent les principales fonctionnalités de **vue-checkin** :

### 🎯 Concepts de base
- Création d'un desk parent
- Enregistrement des composants enfants
- Synchronisation réactive des données
- InjectionKey pour l'injection typée

### 🔌 Fonctionnalités avancées
- **Contexte** : Partage de données entre parent et enfants
- **Plugins** : Extension des fonctionnalités du desk
- **Validation** : Validation en temps réel des données
- **Historique** : Undo/Redo avec le HistoryPlugin

### ⚡ Automatisation
- `autoCheckIn: true` : Enregistrement automatique au montage
- `watchData: true` : Synchronisation automatique des props
- Désenregistrement automatique à la destruction

## Structure des exemples

Chaque exemple suit la même structure :

```
example-name/
├── index.ts              # InjectionKey et exports
├── ParentExample.vue     # Composant parent (crée le desk)
└── ChildComponent.vue    # Composant enfant (s'enregistre au desk)
```

### InjectionKey (`index.ts`)

```typescript
import type { InjectionKey } from 'vue';
import type { CheckInDesk } from '@/vue-checkin/composables/useCheckIn';

interface MyData {
  // Type des données
}

export const MY_DESK_KEY: InjectionKey<CheckInDesk<MyData>> = Symbol('myDesk');

export { default as ParentExample } from './ParentExample.vue';
export { default as ChildComponent } from './ChildComponent.vue';
```

### Composant parent

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

### Composant enfant

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

## Prochaines étapes

::alert{type="info"}
Commencez par le [Basic Example](/examples/basic-example) pour comprendre les concepts fondamentaux, puis progressez vers des exemples plus avancés.
::

::card-group
  ::card
  ---
  title: Guide de démarrage
  icon: i-heroicons-rocket-launch
  to: /getting-started/installation
  ---
  Installation et configuration de vue-checkin
  ::

  ::card
  ---
  title: API Reference
  icon: i-heroicons-book-open
  to: /api/use-check-in
  ---
  Documentation complète de l'API
  ::
::
