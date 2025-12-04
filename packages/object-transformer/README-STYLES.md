# ObjectNode Styles

## Usage

Le composant `ObjectNode` utilise des classes CSS personnalisées que vous pouvez overrider.

### Import des styles

Dans votre app Nuxt, importez les styles dans `nuxt.config.ts` :

```ts
export default defineNuxtConfig({
  css: [
    '@vue-airport/object-transformer/styles'
  ]
})
```

Ou directement dans un composant :

```vue
<script setup>
import '@vue-airport/object-transformer/styles';
</script>
```

### Classes disponibles

Toutes ces classes peuvent être overridées dans votre CSS global :

- `.object-node-container` - Container principal
- `.object-node-container-deleted` - État supprimé
- `.object-node-indent` - Indentation des enfants (défaut: `ml-2`)
- `.object-node-row` - Ligne de node
- `.object-node-row-hover` - Effet hover de la ligne
- `.object-node-left` - Section gauche
- `.object-node-key-value` - Container key-value
- `.object-node-key-value-hover` - Effet hover key-value
- `.object-node-value` - Valeur primitive
- `.object-node-value-array` - Valeur array
- `.object-node-transform` - Select de transformation
- `.object-node-separator` - Séparateur

### Override via prop class

Vous pouvez aussi passer une prop `class` au composant :

```vue
<ObjectNode class="my-custom-styling" />
```

### Override complet dans votre CSS

```css
/* Changer l'indentation */
.object-node-indent {
  @apply ml-4; /* au lieu de ml-2 */
}

/* Personnaliser les valeurs */
.object-node-value {
  @apply text-blue-500 font-mono;
}
```
