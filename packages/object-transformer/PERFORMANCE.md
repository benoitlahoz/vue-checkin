# Performance Benchmarks

**Date:** 2025-12-09

## Benchmark Scenarios & Outputs

### Simple
Basic value transformations (uppercase, add).

<details>
<summary>View Input Data</summary>

```json
{
  "id": 0,
  "name": "user-0",
  "stats": {
    "score": 0,
    "level": 1
  },
  "tags": [
    "a",
    "b",
    "c"
  ]
}
```
</details>

<details>
<summary>View Output Data</summary>

```json
{
  "id": 0,
  "name": "USER-0",
  "stats": {
    "score": 10,
    "level": 1
  },
  "tags": [
    "a",
    "b",
    "c"
  ]
}
```
</details>

---

### Structural
Renaming keys, deleting keys, adding static values.

<details>
<summary>View Input Data</summary>

```json
{
  "id": 0,
  "name": "user-0",
  "stats": {
    "score": 0,
    "level": 1
  },
  "tags": [
    "a",
    "b",
    "c"
  ]
}
```
</details>

<details>
<summary>View Output Data</summary>

```json
{
  "id": 0,
  "stats": {
    "score": 0
  },
  "tags": [
    "a",
    "b",
    "c"
  ],
  "fullName": "user-0",
  "processed": true
}
```
</details>

---

### Conditional
Applying transforms only if a condition is met (e.g. score > 500).

<details>
<summary>View Input Data</summary>

```json
{
  "id": 0,
  "name": "user-0",
  "stats": {
    "score": 0,
    "level": 1
  },
  "tags": [
    "a",
    "b",
    "c"
  ]
}
```
</details>

<details>
<summary>View Output Data</summary>

```json
{
  "id": 0,
  "name": "user-0",
  "stats": {
    "score": 0,
    "level": 1
  },
  "tags": [
    "a",
    "b",
    "c"
  ]
}
```
</details>

---

### Heavy
Combination of all above: rename, transform, delete, conditional, add.

<details>
<summary>View Input Data</summary>

```json
{
  "id": 0,
  "name": "user-0",
  "stats": {
    "score": 0,
    "level": 1
  },
  "tags": [
    "a",
    "b",
    "c"
  ]
}
```
</details>

<details>
<summary>View Output Data</summary>

```json
{
  "id": 0,
  "stats": {
    "score": 0,
    "level": 1
  },
  "fullName": "USER-0",
  "processedAt": "2025-12-06"
}
```
</details>

---

## Results

### Current Results (vs 2025-12-09 and baseline)

| Name | Ops/sec (Hz) | Mean (ms) | P99 (ms) | Samples | vs Previous | vs Baseline |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Scaling: Small (10 items) | 62472.50 | 0.0160 | 0.0236 | 31237 | ⚪ -1.0% | ⚪ -0.4% |
| Scaling: Medium (1,000 items) | 627.63 | 1.5933 | 2.1926 | 314 | ⚪ -1.1% | ⚪ -1.7% |
| Scaling: Large (10,000 items) | 58.62 | 17.0584 | 20.4761 | 30 | ⚪ -2.8% | 🔴 -5.8% |
| Complexity: Simple | 60.18 | 16.6164 | 19.8698 | 31 | ⚪ -1.4% | ⚪ -3.7% |
| Complexity: Structural | 69.07 | 14.4775 | 17.9053 | 35 | ⚪ +1.2% | 🔴 -21.0% |
| Complexity: Conditional | 109.77 | 9.1101 | 9.8559 | 55 | 🟢 +10.8% | 🟢 +68.9% |
| Complexity: Heavy | 59.78 | 16.7278 | 20.8010 | 30 | 🟢 +6.1% | 🟢 +22.0% |

### Previous Results

<details>
<summary>View previous benchmark results</summary>

**Date:** 2025-12-09

| Name | Ops/sec (Hz) | Mean (ms) | P99 (ms) | Samples |
| :--- | :--- | :--- | :--- | :--- |
| Scaling: Small (10 items) | 63116.57 | 0.0158 | 0.0243 | 31559 |
| Scaling: Medium (1,000 items) | 634.80 | 1.5753 | 2.1680 | 318 |
| Scaling: Large (10,000 items) | 60.34 | 16.5725 | 20.3517 | 31 |
| Complexity: Simple | 61.05 | 16.3798 | 19.6728 | 31 |
| Complexity: Structural | 68.25 | 14.6528 | 17.9410 | 35 |
| Complexity: Conditional | 99.06 | 10.0950 | 10.7523 | 50 |
| Complexity: Heavy | 56.36 | 17.7443 | 21.2997 | 29 |

</details>

### Baseline Reference

<details>
<summary>View baseline benchmark results</summary>

**Date:** 2025-12-09
**Version:** v4.0.0
**Description:** Baseline performance (manually set)

| Name | Ops/sec (Hz) | Mean (ms) | P99 (ms) | Samples |
| :--- | :--- | :--- | :--- | :--- |
| Scaling: Small (10 items) | 62731.38 | 0.0159 | 0.0243 | 31366 |
| Scaling: Medium (1,000 items) | 638.21 | 1.5669 | 2.1647 | 320 |
| Scaling: Large (10,000 items) | 62.23 | 16.0684 | 19.5545 | 32 |
| Complexity: Simple | 62.51 | 15.9983 | 19.3396 | 32 |
| Complexity: Structural | 87.47 | 11.4324 | 14.9117 | 44 |
| Complexity: Conditional | 65.00 | 15.3843 | 18.4948 | 33 |
| Complexity: Heavy | 49.00 | 20.4091 | 23.1423 | 25 |

</details>

## Performance Comparison

**Scaling: Small (10 items)** is the fastest.

- **99.54x** faster than *Scaling: Medium (1,000 items)*
- **569.13x** faster than *Complexity: Conditional*
- **904.45x** faster than *Complexity: Structural*
- **1038.07x** faster than *Complexity: Simple*
- **1045.03x** faster than *Complexity: Heavy*
- **1065.68x** faster than *Scaling: Large (10,000 items)*
