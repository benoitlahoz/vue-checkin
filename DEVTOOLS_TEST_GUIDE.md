# Guide de test des DevTools Vue Airport

## 🧪 Vérification des améliorations

### Préparation
1. ✅ Lancer l'application : `yarn dev`
2. ✅ Ouvrir le navigateur sur http://localhost:3000/vue-airport/
3. ✅ Ouvrir Vue DevTools (extension navigateur)
4. ✅ Naviguer vers l'onglet "Airport"

---

## 1️⃣ Test de la Timeline

### Actions à effectuer
1. Naviguer vers un exemple utilisant `useCheckIn` (ex: Todo List, Shopping Cart, etc.)
2. Ouvrir l'onglet "Timeline" dans les DevTools
3. Rechercher la layer "Airport Events"

### Vérifications

#### ✅ Check-in
- [ ] L'événement apparaît avec l'icône ✓
- [ ] La couleur est verte (#41b883)
- [ ] Le sous-titre affiche `ID: [item-id]`
- [ ] Les détails montrent :
  - `deskId`
  - `childId`
  - `timestamp` (heure formatée)
  - `registrySize` (taille actuelle)
  - `metadata` (si présent)
  - `data` (données de l'item)

#### ✅ Check-out
- [ ] L'événement apparaît avec l'icône ✗
- [ ] La couleur est rouge (#e74c3c)
- [ ] Le logType est "error"
- [ ] Le sous-titre affiche `ID: [item-id]`
- [ ] Les détails montrent la taille du registre après suppression

#### ✅ Update
- [ ] L'événement apparaît avec l'icône ↻
- [ ] La couleur est bleue (#3498db)
- [ ] Les détails montrent :
  - `data` (nouvelles données)
  - `previousData` (données avant modification)
  - Permet de comparer les changements

#### ✅ Clear
- [ ] L'événement apparaît avec l'icône 🗑
- [ ] La couleur est orange (#f39c12)
- [ ] Le logType est "warning"
- [ ] Le sous-titre affiche `Cleared X items`
- [ ] `registrySize` montre le nombre d'items supprimés

#### ✅ Plugin Execute
- [ ] L'événement apparaît avec l'icône ⚡
- [ ] La couleur est violette (#9b59b6)
- [ ] Le nom du plugin est affiché
- [ ] La durée d'exécution est indiquée en ms
- [ ] Le contexte est présent (phase: install, hook: onCheckIn, etc.)

### Groupement
- [ ] Les événements sont groupés par `deskId`
- [ ] Chaque groupe peut être replié/déplié
- [ ] L'ordre chronologique est respecté

---

## 2️⃣ Test de l'Inspector

### Desk (niveau parent)

#### Navigation
1. Ouvrir l'onglet "Airport Registry" dans les DevTools
2. Sélectionner un desk

#### Section "Basic Info"
- [ ] `id` : identifiant du desk
- [ ] `type` : "desk"
- [ ] `children` : nombre d'items actuels

#### Section "Statistics"
- [ ] `total check-ins` : compteur incrémenté
- [ ] `total check-outs` : compteur incrémenté
- [ ] `total updates` : compteur incrémenté
- [ ] `current items` : nombre actuel d'items

#### Section "Lifecycle"
- [ ] `created at` : timestamp de création
- [ ] `last check-in` : timestamp du dernier check-in (si présent)
- [ ] `last check-out` : timestamp du dernier check-out (si présent)
- [ ] `last update` : timestamp de la dernière mise à jour (si présent)

#### Section "Plugins"
- [ ] Liste des plugins installés
- [ ] Affichage "✓ installed" pour chaque plugin
- [ ] Exemples possibles : "activeItem", "validation", "debounce", "history"

#### Section "Metadata"
- [ ] Affichage des métadonnées personnalisées
- [ ] Format JSON lisible avec indentation

### Child (item du registre)

#### Navigation
1. Développer un desk
2. Sélectionner un item enfant

#### Section "Basic Info"
- [ ] `id` : identifiant de l'item
- [ ] `type` : "child"
- [ ] `checked in at` : timestamp formaté avec date et heure

#### Section "Metadata"
- [ ] Affichage des métadonnées de l'item (si présentes)
- [ ] Format approprié (objet JSON si complexe)
- [ ] Exemples : `label`, `active`, `priority`, etc.

#### Section "Data"
- [ ] Affichage de toutes les propriétés de l'item
- [ ] Format JSON pour les objets complexes
- [ ] Valeurs primitives affichées directement
- [ ] Indentation à 2 espaces pour la lisibilité

---

## 3️⃣ Test du tracking des plugins

### Préparation
Utiliser un exemple avec plugins (ex: Multi-Plugin, Form avec validation, etc.)

### Vérifications

#### Installation
1. Ouvrir la Timeline
2. Vérifier les événements `⚡ Plugin` lors du montage
3. Détails à vérifier :
   - [ ] `pluginName` : nom du plugin
   - [ ] `phase` : "install"
   - [ ] `duration` : temps d'exécution en ms

#### Hooks onCheckIn
1. Ajouter un item dans le registre
2. Vérifier les événements plugin après le check-in
3. Détails :
   - [ ] `pluginName` : nom du plugin
   - [ ] `hook` : "onCheckIn"
   - [ ] `childId` : ID de l'item
   - [ ] `duration` : temps d'exécution

#### Hooks onCheckOut
1. Retirer un item du registre
2. Vérifier les événements plugin après le check-out
3. Détails :
   - [ ] `pluginName` : nom du plugin
   - [ ] `hook` : "onCheckOut"
   - [ ] `childId` : ID de l'item
   - [ ] `duration` : temps d'exécution

---

## 4️⃣ Test de réactivité

### Vérifications en temps réel
- [ ] Les statistiques se mettent à jour immédiatement
- [ ] Le lifecycle est actualisé après chaque opération
- [ ] La timeline affiche les événements au moment où ils se produisent
- [ ] L'arbre de l'inspector se rafraîchit automatiquement

### Performance
- [ ] Pas de lag perceptible lors des opérations
- [ ] Les durées d'exécution des plugins sont raisonnables (<1ms pour des opérations simples)
- [ ] L'interface reste fluide même avec beaucoup d'événements

---

## 5️⃣ Scénarios de test complets

### Scénario 1 : Todo List
1. Ouvrir l'exemple Todo List
2. Ajouter 3 todos
3. Vérifier dans l'inspector :
   - [ ] 3 items dans le registre
   - [ ] Statistics : totalCheckIns = 3
4. Marquer 1 todo comme complété (update)
5. Vérifier :
   - [ ] Statistics : totalUpdates = 1
   - [ ] Timeline : événement Update avec previousData
6. Supprimer 1 todo
7. Vérifier :
   - [ ] Statistics : totalCheckOuts = 1
   - [ ] 2 items restants dans le registre

### Scénario 2 : Shopping Cart
1. Ouvrir l'exemple Shopping Cart
2. Ajouter plusieurs produits
3. Vérifier les métadonnées des produits (prix, quantité, etc.)
4. Modifier la quantité d'un produit
5. Vérifier dans la Timeline :
   - [ ] Événement Update avec data et previousData
   - [ ] Possibilité de comparer les valeurs
6. Vider le panier
7. Vérifier :
   - [ ] Événement Clear
   - [ ] Sous-titre indiquant le nombre d'items supprimés

### Scénario 3 : Multi-Plugin
1. Ouvrir l'exemple Multi-Plugin
2. Observer l'installation des plugins dans la Timeline
3. Effectuer des opérations déclenchant les plugins
4. Vérifier :
   - [ ] Événements plugin-execute pour chaque plugin
   - [ ] Durées d'exécution cohérentes
   - [ ] Liste des plugins dans l'inspector

---

## 🎯 Résultat attendu

Toutes les cases doivent être cochées pour valider les améliorations des DevTools.

## 📸 Captures d'écran recommandées

Pour la documentation :
1. Timeline avec différents types d'événements
2. Inspector d'un desk avec statistiques
3. Inspector d'un item avec données
4. Événements plugin-execute dans la Timeline
5. Section Plugins dans l'inspector

## 🐛 Signalement de bugs

Si une fonctionnalité ne fonctionne pas :
1. Noter le scénario exact
2. Vérifier la console du navigateur
3. Vérifier la console du serveur
4. Créer une issue avec les détails

---

## ✅ Validation finale

Une fois tous les tests effectués :
- [ ] Timeline fonctionnelle et informative
- [ ] Inspector affichant toutes les informations
- [ ] Tracking des plugins opérationnel
- [ ] Statistiques à jour en temps réel
- [ ] Performance acceptable
- [ ] Pas d'erreurs dans la console
