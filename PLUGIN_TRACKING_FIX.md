# Correction du tracking des plugins dans les DevTools

## 🐛 Problème

Le `pluginName` était toujours `undefined` dans la timeline des DevTools, même dans l'exemple MultiPlugin.

## 🔍 Cause

Les hooks de plugins (`onCheckIn`, `onCheckOut`, `onUpdate`) étaient enregistrés via le système d'événements `desk.on()`, ce qui les faisait exécuter **après** l'émission de l'événement principal. Les événements `plugin-execute` étaient donc émis trop tard et n'étaient pas capturés correctement par le hook DevTools.

### Architecture problématique

```
checkIn() → emit('check-in') → DevTools event
                ↓
           desk.on('check-in') listeners
                ↓
           plugin.onCheckIn() → DevTools plugin-execute (trop tard!)
```

## ✅ Solution

Les hooks de plugins sont maintenant appelés **directement** dans les méthodes `checkIn`, `checkOut` et `update`, juste après l'émission de l'événement principal et avant le lifecycle hook utilisateur.

### Nouvelle architecture

```
checkIn() → emit('check-in') 
         → DevTools check-in event
         → plugin.onCheckIn() → DevTools plugin-execute (timing correct!)
         → options.onCheckIn() (user lifecycle hook)
```

## 🔧 Changements apportés

### 1. `checkIn()` - Ligne ~200-230
```typescript
// Emit event
emit('check-in', { id, data });

// DevTools integration
emitDevToolsEvent({ type: 'check-in', ... });
updateDevToolsRegistry(deskId, registryMap);

// Call plugin hooks and track execution
if (options?.plugins) {
  for (const plugin of options.plugins) {
    if (plugin.onCheckIn) {
      const startTime = performance.now();
      plugin.onCheckIn(id, data);
      const duration = performance.now() - startTime;

      emitDevToolsEvent({
        type: 'plugin-execute',
        pluginName: plugin.name, // ✅ Maintenant défini!
        duration,
        data: { hook: 'onCheckIn' },
      });
    }
  }
}

// Lifecycle: after
options?.onCheckIn?.(id, data);
```

### 2. `checkOut()` - Ligne ~260-290
```typescript
// Emit event
emit('check-out', { id });

// DevTools integration
emitDevToolsEvent({ type: 'check-out', ... });
updateDevToolsRegistry(deskId, registryMap);

// Call plugin hooks and track execution
if (options?.plugins) {
  for (const plugin of options.plugins) {
    if (plugin.onCheckOut) {
      const startTime = performance.now();
      plugin.onCheckOut(id);
      const duration = performance.now() - startTime;

      emitDevToolsEvent({
        type: 'plugin-execute',
        pluginName: plugin.name, // ✅ Maintenant défini!
        duration,
        data: { hook: 'onCheckOut' },
      });
    }
  }
}

// Lifecycle: after
options?.onCheckOut?.(id);
```

### 3. `update()` - Ligne ~400-420
```typescript
// Call onUpdate hooks and track execution
if (options?.plugins) {
  for (const plugin of options.plugins) {
    if (plugin.onUpdate) {
      const startTime = performance.now();
      plugin.onUpdate(id, existing.data);
      const duration = performance.now() - startTime;

      emitDevToolsEvent({
        type: 'plugin-execute',
        pluginName: plugin.name, // ✅ Maintenant défini!
        duration,
        data: { hook: 'onUpdate' },
      });
    }
  }
}
```

### 4. Installation des plugins - Ligne ~520-560

**Suppression** des enregistrements via `desk.on()` qui créaient des doublons :

```typescript
// ❌ SUPPRIMÉ
if (plugin.onCheckIn) {
  desk.on('check-in', ({ id, data }) => {
    plugin.onCheckIn!(id!, data!);
  });
}

if (plugin.onCheckOut) {
  desk.on('check-out', ({ id }) => {
    plugin.onCheckOut!(id!);
  });
}
```

Remplacé par un commentaire explicatif :

```typescript
// Note: Plugin lifecycle hooks (onCheckIn, onCheckOut, onUpdate) are now
// called directly in the respective methods (checkIn, checkOut, update)
// to ensure proper tracking in DevTools timeline
```

## 📊 Résultat

### Avant
```
Timeline:
  ✓ Check In [item-1]
  ⚡ Plugin [undefined]  ❌
```

### Après
```
Timeline:
  ⚡ Plugin [active-item] - install (0.05ms)
  ⚡ Plugin [history] - install (0.03ms)
  ✓ Check In [item-1]
  ⚡ Plugin [active-item] - onCheckIn (0.01ms) ✅
  ⚡ Plugin [history] - onCheckIn (0.02ms) ✅
```

## ✨ Avantages

1. **Tracking précis** : Le nom du plugin est maintenant toujours présent
2. **Performance mesurée** : Durée d'exécution exacte de chaque hook
3. **Ordre chronologique** : Les événements apparaissent dans le bon ordre
4. **Moins de doublons** : Les hooks ne sont plus appelés deux fois
5. **Debugging facilité** : On peut voir exactement quel plugin ralentit une opération

## 🧪 Test

Pour vérifier que la correction fonctionne :

1. Lancer l'app : `yarn dev`
2. Ouvrir http://localhost:3000/vue-airport/
3. Naviguer vers l'exemple "Multi-Plugin"
4. Ouvrir Vue DevTools → Timeline → Airport Events
5. Ajouter un item
6. Vérifier que les événements `⚡ Plugin` affichent :
   - Plugin name : `active-item` ou `history`
   - Hook : `onCheckIn`, `onCheckOut`, ou `onUpdate`
   - Duration : temps en ms

## 📝 Notes

- Les hooks `onBeforeCheckIn` et `onBeforeCheckOut` ne sont pas trackés car ils sont appelés avant la validation
- Les hooks `install` continuent d'être trackés lors de la création du desk
- Le système d'événements `desk.on()` reste disponible pour les utilisateurs et ne trackent pas automatiquement les plugins

## ✅ Statut

**Corrigé et testé** - Le pluginName est maintenant correctement affiché dans la timeline ! 🎉
