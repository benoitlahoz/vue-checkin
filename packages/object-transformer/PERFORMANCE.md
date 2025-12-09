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
  "fullName": "user-0",
  "stats": {
    "score": 0
  },
  "tags": [
    "a",
    "b",
    "c"
  ],
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
  "fullName": "USER-0",
  "stats": {
    "score": 0,
    "level": 1
  },
  "processedAt": "2025-12-06"
}
```
</details>

---

## Results

### Current Results (vs 2025-12-09 and baseline)

| Name | Ops/sec (Hz) | Mean (ms) | P99 (ms) | Samples | vs Previous | vs Baseline |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Scaling: Small (10 items) | 62731.38 | 0.0159 | 0.0243 | 31366 | 🟢 +5.4% | 🔴 -84.2% |
| Scaling: Medium (1,000 items) | 638.21 | 1.5669 | 2.1647 | 320 | ⚪ +2.9% | 🔴 -84.7% |
| Scaling: Large (10,000 items) | 62.23 | 16.0684 | 19.5545 | 32 | ⚪ +3.1% | 🔴 -85.0% |
| Complexity: Simple | 62.51 | 15.9983 | 19.3396 | 32 | ⚪ +3.4% | 🔴 -85.0% |
| Complexity: Structural | 87.47 | 11.4324 | 14.9117 | 44 | ⚪ +1.8% | 🔴 -49.0% |
| Complexity: Conditional | 65.00 | 15.3843 | 18.4948 | 33 | 🟢 +5.8% | 🔴 -86.4% |
| Complexity: Heavy | 49.00 | 20.4091 | 23.1423 | 25 | 🟢 +5.8% | 🔴 -57.9% |

### Previous Results

<details>
<summary>View previous benchmark results</summary>

**Date:** 2025-12-09

| Name | Ops/sec (Hz) | Mean (ms) | P99 (ms) | Samples |
| :--- | :--- | :--- | :--- | :--- |
| Scaling: Small (10 items) | 59490.70 | 0.0168 | 0.0485 | 29746 |
| Scaling: Medium (1,000 items) | 620.43 | 1.6118 | 2.3024 | 311 |
| Scaling: Large (10,000 items) | 60.38 | 16.5619 | 20.0060 | 31 |
| Complexity: Simple | 60.48 | 16.5348 | 19.9110 | 31 |
| Complexity: Structural | 85.95 | 11.6350 | 15.2507 | 43 |
| Complexity: Conditional | 61.45 | 16.2723 | 19.0610 | 31 |
| Complexity: Heavy | 46.33 | 21.5863 | 25.0910 | 24 |

</details>

### Baseline Reference

<details>
<summary>View baseline benchmark results</summary>

**Date:** 2025-12-06
**Version:** v2.0.0
**Description:** Baseline performance (Recipe v2.0.0 with operations)

| Name | Ops/sec (Hz) | Mean (ms) | P99 (ms) | Samples |
| :--- | :--- | :--- | :--- | :--- |
| Scaling: Small (10 items) | 397319.54 | 0.0025 | 0.0034 | 198660 |
| Scaling: Medium (1,000 items) | 4175.12 | 0.2395 | 0.3737 | 2088 |
| Scaling: Large (10,000 items) | 414.78 | 2.4109 | 2.8942 | 208 |
| Complexity: Simple | 417.81 | 2.3934 | 2.7787 | 209 |
| Complexity: Structural | 171.63 | 5.8265 | 10.5822 | 86 |
| Complexity: Conditional | 477.95 | 2.0923 | 2.5957 | 239 |
| Complexity: Heavy | 116.29 | 8.5995 | 12.8735 | 59 |

</details>

## Performance Comparison

**Scaling: Small (10 items)** is the fastest.

- **98.29x** faster than *Scaling: Medium (1,000 items)*
- **717.17x** faster than *Complexity: Structural*
- **965.08x** faster than *Complexity: Conditional*
- **1003.60x** faster than *Complexity: Simple*
- **1007.99x** faster than *Scaling: Large (10,000 items)*
- **1280.29x** faster than *Complexity: Heavy*
