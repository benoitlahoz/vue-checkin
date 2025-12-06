# Migration CSS - Préfixe 'ot-' ✅

## Résumé

Toutes les classes CSS de l'object-transformer ont été migrées avec le préfixe `ot-` (ObjectTransformer) et centralisées dans `ObjectNode.vue`.

## Changements principaux

### 1. Variables CSS
- `--object-node-*` → `--ot-*`
- Ajout des variables de couleur pour recipe/preview feedback:
  - `--ot-blue`, `--ot-blue-bg`, `--ot-blue-border`
  - `--ot-green`, `--ot-green-bg`, `--ot-green-border`
  - `--ot-red`, `--ot-red-bg`, `--ot-red-border`

### 2. Classes centralisées dans ObjectNode.vue

#### Node Structure
- `.object-node-*` → `.ot-node-*` (container, grid, row, chevron, etc.)

#### Utilities
- `.copy-button` → `.ot-copy-button`
- `.progress-bar` → `.ot-progress-bar`
- `.button-*` → `.ot-button-*`

#### Components
- **NodeActions**: `.node-actions-*` → `.ot-actions-*`
- **NodeKeyEditor**: `.node-key-*` → `.ot-key-*`
- **NodeOpen**: `.node-open-icon` → `.ot-open-icon`
- **NodeValue**: `.object-node-value*` → `.ot-node-value*`
- **NodeTransformsList**: `.transform-*` → `.ot-transform-*`
- **TransformParam**: `.transform-param-*` → `.ot-param-*`
- **TransformSelect**: `.transform-select-*` → `.ot-select-*`
- **RecipePreview**: `.recipe-preview-container` → `.ot-recipe-container`
- **DefaultRecipeLayout**: `.recipe-*` → `.ot-recipe-*`
- **ObjectPreview**: `.object-preview-container` → `.ot-preview-container`
- **DefaultPreviewLayout**: `.preview-*` → `.ot-preview-*`

### 3. Fichiers modifiés

**Styles supprimés (centralisés dans ObjectNode.vue):**
- NodeActions.vue
- NodeKeyEditor.vue
- NodeOpen.vue
- NodeTransformsList.vue
- NodeValue.vue
- TransformParam.vue
- TransformSelect.vue
- DefaultNodeLayout.vue
- RecipePreview.vue
- ObjectPreview.vue

**Styles minimaux conservés:**
- DefaultRecipeLayout.vue (override progress bar)
- DefaultPreviewLayout.vue (override progress bar)

### 4. Avantages

✅ **Namespace unique** - Toutes les classes ont le préfixe `ot-` pour éviter les conflits
✅ **Centralisation** - Un seul fichier CSS à maintenir (ObjectNode.vue)
✅ **Cohérence** - Toutes les variables et classes suivent la même convention
✅ **Performance** - Moins de duplication CSS
✅ **Maintenance** - Plus facile de trouver et modifier les styles

## Migration automatique

La migration a été effectuée par script automatisé qui a :
1. Remplacé toutes les variables `--object-node-*` par `--ot-*`
2. Remplacé toutes les classes CSS et leurs usages dans le HTML
3. Centralisé tous les styles dans ObjectNode.vue
4. Nettoyé les blocs `<style>` des composants enfants

## Compatibilité

✅ Aucune erreur TypeScript
✅ Serveur de dev démarre correctement
✅ Toutes les fonctionnalités préservées
