# @vue-airport/object-transformer

> 🛠️ Transformez, validez et manipulez des structures de données JSON complexes avec une interface visuelle interactive

Un package Vue.js puissant pour la transformation d'objets avec support de :
- ✅ Transformations conditionnelles avec Chain of Responsibility
- 🔄 Système de recettes immuables et reproductibles
- 🧪 Tests unitaires complets (58 tests)
- 📊 Mode modèle pour normaliser des tableaux d'objets hétérogènes
- 🎯 Types TypeScript stricts
- 🪵 Système de logging centralisé

## Installation

```bash
npm install @vue-airport/object-transformer vue-airport
# ou
yarn add @vue-airport/object-transformer vue-airport
# ou
pnpm add @vue-airport/object-transformer vue-airport
```

## Démarrage rapide

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { ObjectTransformer } from '@vue-airport/object-transformer';
import '@vue-airport/object-transformer/styles';

const sourceData = ref({
  user: {
    name: 'John Doe',
    email: 'john@example.com',
    age: 30
  }
});
</script>

<template>
  <ObjectTransformer 
    :data="sourceData" 
    @update:data="sourceData = $event" 
  />
</template>
```

## Fonctionnalités principales

### 1. Transformations conditionnelles

Appliquez des transformations uniquement si une condition est remplie :

```typescript
import { useTransforms } from 'vue-airport';
import { ConditionNumber, TransformString } from '@vue-airport/object-transformer';

const { addTransforms } = useTransforms();

// La transformation ne s'applique que si l'âge > 18
addTransforms([
  {
    name: 'Is Greater Than',
    condition: (value: number, threshold: number) => value > threshold,
    fn: (value: number) => value,
    params: [18]
  },
  {
    name: 'Uppercase',
    fn: (value: string) => value.toUpperCase(),
    params: []
  }
]);
```

### 2. Système de recettes (Recipe System v2)

Exportez et réappliquez des transformations de manière immuable :

```typescript
import { buildRecipe, applyRecipe } from '@vue-airport/object-transformer';

// Créer une recette depuis l'arbre de transformations
const recipe = buildRecipe(transformedTree);

// Appliquer la recette à de nouvelles données
const newData = { user: { name: 'Jane', age: 25 } };
const result = applyRecipe(newData, recipe, transformsMap);
```

**Format de recette :**
```json
{
  "version": 2,
  "metadata": {
    "created": "2025-12-06T13:00:00.000Z",
    "totalOperations": 3
  },
  "operations": [
    {
      "type": "transform",
      "path": ["user", "name"],
      "transforms": [
        { "name": "Uppercase", "params": [] }
      ]
    },
    {
      "type": "rename",
      "path": ["user", "email"],
      "newKey": "emailAddress"
    }
  ]
}
```

### 3. Conditions disponibles

#### ConditionString
- **Equals** : Vérifie l'égalité stricte
- **Contains** : Vérifie la présence d'une sous-chaîne
- **Starts With / Ends With** : Vérifie le début/fin
- **Matches Regex** : Validation par regex
- **Is Empty / Is Not Empty**
- **Length Equals / Greater Than / Less Than**

#### ConditionNumber (nouveau)
- **Is Even / Is Odd**
- **Is Greater Than / Less Than**
- **In Range** : Vérifie si dans [min, max]
- **Divisible By**
- **Is Positive / Is Negative**
- **Is Integer**

#### ConditionArray (nouveau)
- **Is Empty / Is Not Empty**
- **Length Equals / Greater Than / Less Than**
- **Contains** : Vérifie la présence d'un élément
- **All Items Same Type**

#### ConditionObject (nouveau)
- **Is Empty / Is Not Empty**
- **Has Property**
- **Property Count Equals / Greater Than / Less Than**

### 4. Transformations structurelles

Transformez la structure même de vos données :

```typescript
// Split : Découpe une chaîne en plusieurs enfants
"John Doe" → ["John", "Doe"]

// Array to Properties : Convertit un tableau en objet
[{name: "A"}, {name: "B"}] → {0: {name: "A"}, 1: {name: "B"}}

// To Object : Convertit une valeur en objet avec clé
"value" → {key: "value"}
```

### 5. Mode Modèle

Normalisez des tableaux d'objets avec propriétés manquantes :

```typescript
import { suggestModelMode, normalizeArrayWithTemplate } from '@vue-airport/object-transformer';

const heterogeneousData = [
  { id: 1, name: 'Alice', email: 'alice@example.com' },
  { id: 2, name: 'Bob' }, // email manquant
  { id: 3, email: 'charlie@example.com' } // name manquant
];

// Détecte automatiquement si le mode modèle est recommandé
const shouldUseModel = suggestModelMode(heterogeneousData); // true

// Normalise avec le template le plus complet (index 0)
const normalized = normalizeArrayWithTemplate(heterogeneousData, 0);
// Résultat : tous les objets ont { id, name, email }
```

## Architecture

### Pattern Chain of Responsibility

Les conditions utilisent le pattern Chain of Responsibility pour évaluer séquentiellement les transformations :

```typescript
// Dans une chaîne de transformations
transforms: [
  { name: 'Is Greater Than', condition: (v) => v > 18, params: [18] },
  { name: 'Uppercase', fn: (v) => v.toUpperCase() },
  { name: 'Trim', fn: (v) => v.trim() }
]

// Si la condition échoue, les transformations suivantes ne s'appliquent pas
```

### Système de logging

Tous les logs sont centralisés et protégés par `import.meta.env.DEV` :

```typescript
import { logger, LogLevel } from '@vue-airport/object-transformer';

logger.debug('Message de debug');
logger.info('Message informatif');
logger.warn('Avertissement');
logger.error('Erreur', errorObject);
```

### Tests

Le package inclut 58 tests unitaires couvrant :
- Type guards (`isArray`, `isObject`, `isStructuralResult`)
- Node builder (construction d'arbres)
- Immutable updates (mises à jour immuables)
- Recipe applier (application de recettes)

```bash
yarn test        # Exécuter les tests
yarn test:ui     # Interface UI Vitest
yarn test:coverage  # Rapport de couverture
```

## API Reference

### Composants Vue

#### `<ObjectTransformer>`
Composant principal pour transformer des objets interactivement.

**Props :**
- `data` : Données source (objet ou tableau)
- `mode` : `'object'` | `'model'` - Mode de transformation
- `templateIndex` : Index du template en mode modèle

**Events :**
- `@update:data` : Émis quand les données changent

#### `<ObjectPreview>`
Prévisualisation en lecture seule des données transformées.

#### `<RecipePreview>`
Visualisation et export/import de recettes.

### Fonctions utilitaires

#### Recipe System
```typescript
buildRecipe(tree: ObjectNodeData): Recipe
applyRecipe(data: any, recipe: Recipe, transforms: Map<string, Transform>): any
importRecipe(json: string): Recipe
```

#### Immutable Updates
```typescript
updateAt(data: any, path: Path, updater: (val: any) => any): any
deleteAt(data: any, path: Path): any
renameAt(data: any, path: Path, newKey: string): any
addAt(data: any, path: Path, key: string, value: any): any
```

#### Type Guards
```typescript
isArray(value: unknown): value is any[]
isObject(value: unknown): value is Record<string, any>
isPrimitive(type: ObjectNodeType): boolean
isStructuralResult(result: any): boolean
```

## Exemples

### Validation de formulaire

```typescript
import { ConditionString, TransformString } from '@vue-airport/object-transformer';

// Valider et normaliser un email
const emailTransforms = [
  { name: 'Trim', fn: (v: string) => v.trim() },
  { name: 'Lowercase', fn: (v: string) => v.toLowerCase() },
  { 
    name: 'Matches Regex', 
    condition: (v: string, pattern: string) => new RegExp(pattern).test(v),
    fn: (v: string) => v,
    params: ['^[^@]+@[^@]+\\.[^@]+$']
  }
];
```

### Transformation de données business

```typescript
// Calculer une remise conditionnelle
const priceTransforms = [
  {
    name: 'Is Greater Than',
    condition: (price: number, threshold: number) => price > threshold,
    fn: (price: number) => price,
    params: [100]
  },
  {
    name: 'Apply Discount',
    fn: (price: number, discount: number) => price * (1 - discount),
    params: [0.15] // 15% de réduction
  }
];
```

## Contribution

Les contributions sont les bienvenues ! Veuillez :

1. Fork le projet
2. Créer une branche (`git checkout -b feature/amazing-feature`)
3. Commit vos changements (`git commit -m 'Add amazing feature'`)
4. Push vers la branche (`git push origin feature/amazing-feature`)
5. Ouvrir une Pull Request

### Standards de code

- ✅ Tests unitaires pour toute nouvelle fonctionnalité
- ✅ Types TypeScript stricts (pas de `any`)
- ✅ Logs protégés par `import.meta.env.DEV`
- ✅ Documentation des nouvelles APIs

## License

MIT © Benoit Lahoz

## Liens

- [Documentation vue-airport](https://github.com/benoitlahoz/vue-airport)
- [Exemples en ligne](https://vue-airport-docs.example.com/examples)
- [Issue Tracker](https://github.com/benoitlahoz/vue-airport/issues)
