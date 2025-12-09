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
| Scaling: Small (10 items) | 61193.16 | 0.0163 | 0.0240 | 30597 | 🔴 -38.9% | 🔴 -84.6% |
| Scaling: Medium (1,000 items) | 615.12 | 1.6257 | 2.2700 | 308 | 🔴 -42.9% | 🔴 -85.3% |
| Scaling: Large (10,000 items) | 60.05 | 16.6522 | 19.9345 | 31 | 🔴 -42.9% | 🔴 -85.5% |
| Complexity: Simple | 60.50 | 16.5284 | 19.8666 | 31 | 🔴 -43.1% | 🔴 -85.5% |
| Complexity: Structural | 86.56 | 11.5524 | 14.9768 | 44 | 🔴 -49.1% | 🔴 -49.6% |
| Complexity: Conditional | 64.49 | 15.5056 | 18.8620 | 33 | 🔴 -43.1% | 🔴 -86.5% |
| Complexity: Heavy | 48.77 | 20.5035 | 24.7988 | 25 | 🔴 -21.1% | 🔴 -58.1% |

### Previous Results

<details>
<summary>View previous benchmark results</summary>

**Date:** 2025-12-09

| Name | Ops/sec (Hz) | Mean (ms) | P99 (ms) | Samples |
| :--- | :--- | :--- | :--- | :--- |
| Scaling: Small (10 items) | 100113.62 | 0.0100 | 0.0262 | 50057 |
| Scaling: Medium (1,000 items) | 1078.18 | 0.9275 | 1.5052 | 540 |
| Scaling: Large (10,000 items) | 105.10 | 9.5143 | 12.5172 | 53 |
| Complexity: Simple | 106.25 | 9.4118 | 11.8156 | 54 |
| Complexity: Structural | 170.15 | 5.8771 | 9.2824 | 86 |
| Complexity: Conditional | 113.36 | 8.8217 | 13.7475 | 57 |
| Complexity: Heavy | 61.81 | 16.1790 | 19.8328 | 31 |

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

- **99.48x** faster than *Scaling: Medium (1,000 items)*
- **706.93x** faster than *Complexity: Structural*
- **948.84x** faster than *Complexity: Conditional*
- **1011.42x** faster than *Complexity: Simple*
- **1019.00x** faster than *Scaling: Large (10,000 items)*
- **1254.68x** faster than *Complexity: Heavy*
