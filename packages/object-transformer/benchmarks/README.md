# Performance Benchmarking System

Ce système permet de suivre les performances des benchmarks au fil du temps avec trois niveaux de comparaison :

## 📊 Fichiers de suivi

### 1. **performance.current.json** (Résultats actuels)
- Contient les résultats de la dernière exécution
- Mis à jour à chaque `yarn bench --run`
- Non versionné (`.gitignore`)

### 2. **performance.previous.json** (Résultats précédents)
- Contient les résultats de l'avant-dernière exécution
- Permet de comparer avec l'exécution immédiatement précédente
- Rotation automatique : `current` → `previous` à chaque exécution
- Non versionné (`.gitignore`)

### 3. **performance.baseline.json** (Référence de base)
- Référence de performance à battre
- Initialement défini avec les performances de v2.0.0 (Recipe avec operations)
- **Mis à jour automatiquement** si ≥50% des benchmarks s'améliorent de +5%
- **Versionné** pour suivre l'évolution de la baseline dans le temps

## 🚀 Commandes

### Exécuter les benchmarks
```bash
yarn bench --run
```
- Exécute les benchmarks
- Génère `PERFORMANCE.md` avec comparaisons
- Sauvegarde les résultats en JSON
- Affiche la comparaison dans le terminal
- Met à jour la baseline si performances améliorées

### Définir manuellement la baseline
```bash
yarn bench:baseline
```
- Définit les résultats actuels comme nouvelle baseline
- Demande confirmation si une baseline existe déjà
- Force : `yarn bench:baseline --force`

## 📈 Rapport PERFORMANCE.md

Le fichier Markdown généré contient :

### 1. Scénarios et exemples
Exemples d'input/output pour chaque scénario de benchmark

### 2. Tableau des résultats actuels
Avec 2 colonnes de comparaison :
- **vs Previous** : comparaison avec l'exécution précédente
- **vs Baseline** : comparaison avec la référence de base

Indicateurs :
- 🟢 : amélioration (+5% ou plus)
- 🔴 : régression (-5% ou moins)
- ⚪ : stable (< ±5%)

### 3. Résultats précédents (pliable)
Historique de l'exécution précédente

### 4. Baseline de référence (pliable)
Référence de performance avec date, version et description

### 5. Comparaisons relatives
Comparaison entre tous les benchmarks (le plus rapide vs les autres)

## 🔄 Mise à jour automatique de la baseline

La baseline est **automatiquement mise à jour** si :
- Au moins **50% des benchmarks** montrent une amélioration
- L'amélioration est d'au moins **+5%** par rapport à la baseline actuelle

Exemple :
```
🎉 Baseline updated! 4 benchmark(s) showed improvement
```

## 📝 Format JSON

```json
{
  "date": "2025-12-09",
  "timestamp": 1733766000000,
  "version": "v4.0.0",
  "description": "Baseline performance (updated after improvements)",
  "results": [
    {
      "name": "Scaling: Small (10 items)",
      "hz": 64161.12,
      "mean": 0.0156,
      "p99": 0.0224,
      "samples": 32081
    }
  ]
}
```

## 🎯 Workflow typique

### Développement avec optimisations

1. **État initial** : Baseline à 60K ops/sec
2. **Optimisation** : Modifier le code
3. **Benchmark** : `yarn bench --run`
4. **Résultat** : 65K ops/sec (+8.3%)
5. **Automatique** : Baseline mise à jour si >50% des benchmarks s'améliorent
6. **Itération** : Continuer les optimisations

### Comparer avec version historique

1. Les résultats de v2.0.0 sont dans la baseline initiale
2. Chaque exécution compare avec cette baseline
3. La colonne "vs Baseline" montre l'écart avec v2.0.0
4. Objectif : réduire la régression (-85% → -50% → 0% → +X%)

## 🔧 Maintenance

### Réinitialiser la baseline
Si vous voulez redéfinir manuellement la baseline :

```bash
# Exécuter les benchmarks
yarn bench --run

# Définir les résultats actuels comme nouvelle baseline
yarn bench:baseline
```

### Supprimer l'historique
```bash
rm benchmarks/performance.current.json
rm benchmarks/performance.previous.json
```

La prochaine exécution démarrera un nouvel historique.

## 📊 Exemple de comparaison dans le terminal

```
📊 Performance Comparison (vs previous run)
Previous: 2025-12-09 | Current: 2025-12-09

┌─────────────────────────────────────────────────────────────────────┐
│ Benchmark                          │ Previous  │ Current   │ Change │
├─────────────────────────────────────────────────────────────────────┤
│ Scaling: Small (10 items)          │ 63.2K     │ 64.2K     │ ⚪ +1.5 │
│ Scaling: Medium (1,000 items)      │ 633.3     │ 638.9     │ ⚪ +0.9 │
│ Complexity: Heavy                  │ 47.4      │ 48.9      │ ⚪ +3.3 │
└─────────────────────────────────────────────────────────────────────┘

Summary: No significant changes (< ±5%)
```

## 📄 Fichiers concernés

- `benchmarks/markdown-reporter.ts` : Reporter personnalisé
- `benchmarks/performance.bench.ts` : Définition des benchmarks
- `benchmarks/scenarios.ts` : Scénarios de test
- `benchmarks/set-baseline.js` : Script de définition manuelle de baseline
- `benchmarks/performance.baseline.json` : Référence de base (versionné)
- `benchmarks/performance.current.json` : Résultats actuels (non versionné)
- `benchmarks/performance.previous.json` : Résultats précédents (non versionné)
