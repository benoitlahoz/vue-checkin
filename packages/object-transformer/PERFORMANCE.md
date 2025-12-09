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
| Scaling: Small (10 items) | 62142.90 | 0.0161 | 0.0241 | 31072 | 🟢 +10.2% | 🔴 -84.4% |
| Scaling: Medium (1,000 items) | 619.32 | 1.6147 | 2.2929 | 310 | 🟢 +9.5% | 🔴 -85.2% |
| Scaling: Large (10,000 items) | 60.12 | 16.6339 | 20.0559 | 31 | 🟢 +7.6% | 🔴 -85.5% |
| Complexity: Simple | 59.68 | 16.7569 | 18.6874 | 30 | 🟢 +7.1% | 🔴 -85.7% |
| Complexity: Structural | 87.05 | 11.4882 | 15.0778 | 44 | 🟢 +14.2% | 🔴 -49.3% |
| Complexity: Conditional | 64.54 | 15.4943 | 18.8734 | 33 | 🟢 +12.2% | 🔴 -86.5% |
| Complexity: Heavy | 48.58 | 20.5826 | 24.0786 | 25 | 🟢 +8.7% | 🔴 -58.2% |

### Previous Results

<details>
<summary>View previous benchmark results</summary>

**Date:** 2025-12-09

| Name | Ops/sec (Hz) | Mean (ms) | P99 (ms) | Samples |
| :--- | :--- | :--- | :--- | :--- |
| Scaling: Small (10 items) | 56387.25 | 0.0177 | 0.0257 | 28194 |
| Scaling: Medium (1,000 items) | 565.56 | 1.7682 | 2.5495 | 283 |
| Scaling: Large (10,000 items) | 55.86 | 17.9032 | 20.5190 | 28 |
| Complexity: Simple | 55.73 | 17.9429 | 19.9100 | 28 |
| Complexity: Structural | 76.22 | 13.1198 | 15.8208 | 39 |
| Complexity: Conditional | 57.54 | 17.3789 | 19.0279 | 29 |
| Complexity: Heavy | 44.69 | 22.3746 | 25.1292 | 23 |

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

- **100.34x** faster than *Scaling: Medium (1,000 items)*
- **713.91x** faster than *Complexity: Structural*
- **962.86x** faster than *Complexity: Conditional*
- **1033.68x** faster than *Scaling: Large (10,000 items)*
- **1041.32x** faster than *Complexity: Simple*
- **1279.06x** faster than *Complexity: Heavy*
