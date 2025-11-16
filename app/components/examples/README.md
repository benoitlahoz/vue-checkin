# Exemples Vue Check-in

Ce dossier contient des exemples complets du système `useCheckIn`.

## 📋 Liste des Exemples

### 1. basic-example/
**Exemple basique - Todo List**

Démontre les opérations fondamentales :
- ✅ `checkIn()` - Enregistrer des items
- ❌ `checkOut()` - Retirer des items
- 🔄 `update()` - Mettre à jour des items
- 🗑️ `clear()` - Tout effacer
- 📊 Accès au registry

**Fichier** : `BasicExample.vue`

**Concepts clés** :
- Création d'un desk
- Manipulation manuelle des items
- Computed reactivity

---

### 2. tabs-example/
**Système d'onglets dynamiques**

Démontre :
- 📑 Gestion d'onglets avec état actif
- 🔄 Context partagé (`activeTab`)
- ➕ Ajout dynamique d'onglets
- ❌ Fermeture d'onglets avec gestion de l'onglet actif
- 🎨 Interface utilisateur complète

**Fichier** : `TabsExample.vue`

**Concepts clés** :
- Desk avec contexte
- Gestion de l'état actif
- Tri des items (`sortBy`, `order`)

---

### 3. plugin-example/
**Plugins - ActiveItem & History**

Démontre les plugins système :
- 🎯 **ActiveItemPlugin** - Sélection d'item actif
- 📜 **HistoryPlugin** - Historique des opérations
- ⏪ Undo/Redo
- 📋 Visualisation de l'historique

**Fichier** : `PluginExample.vue`

**Concepts clés** :
- Installation de plugins
- Méthodes ajoutées par plugins
- Event system
- State management avancé

---

### 4. form-example/
**Formulaire avec validation**

Démontre :
- ✅ Plugin de validation
- 📝 Champs de formulaire
- 🔍 Validation en temps réel
- ❌ Gestion des erreurs
- 🎯 Validation custom (email, required)

**Fichier** : `FormExample.vue`

**Concepts clés** :
- ValidationPlugin
- Rules de validation
- Error handling
- Form state management

---

### 5. auto-check-in-example/
**Auto Check-in & Watch Data**

Démontre :
- 🔄 Auto check-in automatique
- 👁️ Watch des données
- 🔗 Synchronisation parent-enfant
- 📊 Mise à jour réactive
- 🧩 Composants dynamiques

**Fichiers** :
- `AutoCheckInExample.vue`
- `DemoChild.vue`

**Concepts clés** :
- `autoCheckIn: true`
- `watchData: true`
- Composants qui s'enregistrent automatiquement
- Synchronisation bidirectionnelle

---

## 🎯 Utilisation

Chaque exemple est un composant Vue autonome structuré selon le pattern shadcn-vue avec un fichier `index.ts` pour les exports.

### Import depuis le barrel export principal

```vue
<template>
  <BasicExample />
  <TabsExample />
  <PluginExample />
  <FormExample />
  <AutoCheckInExample />
</template>

<script setup lang="ts">
import {
  BasicExample,
  TabsExample,
  PluginExample,
  FormExample,
  AutoCheckInExample,
} from '~/components/examples';
</script>
```

### Import depuis chaque dossier

```vue
<script setup lang="ts">
import { BasicExample } from '~/components/examples/basic-example';
import { TabsExample } from '~/components/examples/tabs-example';
import { PluginExample } from '~/components/examples/plugin-example';
import { FormExample } from '~/components/examples/form-example';
import { AutoCheckInExample } from '~/components/examples/auto-check-in-example';
</script>
```

### Import direct du composant

```vue
<script setup lang="ts">
import BasicExample from '~/components/examples/basic-example/BasicExample.vue';
</script>
```

## 🔧 Fonctionnalités illustrées

| Fonctionnalité | BasicExample | TabsExample | PluginExample | FormExample | AutoCheckInExample |
|----------------|--------------|-------------|---------------|-------------|--------------------|
| `createDesk()` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `checkIn()` | ✅ | ✅ | ✅ | ✅ | - |
| `checkOut()` | ✅ | ✅ | ✅ | - | Auto |
| `update()` | ✅ | - | - | ✅ | Auto |
| `clear()` | ✅ | - | - | - | - |
| `getAll()` | ✅ | ✅ | ✅ | ✅ | ✅ |
| Context | - | ✅ | - | - | - |
| Plugins | - | - | ✅ | ✅ | - |
| Auto check-in | - | - | - | - | ✅ |
| Watch data | - | - | - | - | ✅ |
| Events | - | - | ✅ | - | - |

## 📚 Ordre d'apprentissage recommandé

1. **basic-example** - Comprendre les bases
2. **tabs-example** - Voir un cas d'usage réel
3. **auto-check-in-example** - Découvrir l'automatisation
4. **plugin-example** - Apprendre les plugins
5. **form-example** - Cas d'usage avancé

## 📁 Structure des dossiers

```
examples/
├── index.ts                          # Barrel export de tous les exemples
├── basic-example/
│   ├── index.ts                      # Export du composant
│   └── BasicExample.vue
├── tabs-example/
│   ├── index.ts
│   └── TabsExample.vue
├── plugin-example/
│   ├── index.ts
│   └── PluginExample.vue
├── form-example/
│   ├── index.ts
│   └── FormExample.vue
├── auto-check-in-example/
│   ├── index.ts                      # Export des composants
│   ├── AutoCheckInExample.vue
│   └── DemoChild.vue
└── README.md
```

### Pattern shadcn-vue

Chaque exemple suit le pattern shadcn-vue :
- **`index.ts`** : Point d'entrée pour les exports
- **Composants** : Fichiers `.vue` avec la logique et le template
- **Barrel export** : `examples/index.ts` permet d'importer tous les exemples depuis un seul point

## 🎨 Style

Tous les exemples utilisent :
- **Nuxt UI** components (UButton, UBadge, UCheckbox, etc.)
- **CSS Variables** pour le theming
- **Responsive design**
- **Transitions** pour l'UX
