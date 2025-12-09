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
| Scaling: Small (10 items) | 63139.49 | 0.0158 | 0.0237 | 31601 | ⚪ +0.7% | ⚪ +0.7% |
| Scaling: Medium (1,000 items) | 639.82 | 1.5629 | 2.1464 | 320 | ⚪ +0.3% | ⚪ +0.3% |
| Scaling: Large (10,000 items) | 62.33 | 16.0429 | 19.4590 | 32 | ⚪ +0.2% | ⚪ +0.2% |
| Complexity: Simple | 59.92 | 16.6902 | 19.7079 | 30 | ⚪ -4.1% | ⚪ -4.1% |
| Complexity: Structural | 85.91 | 11.6406 | 15.0250 | 43 | ⚪ -1.8% | ⚪ -1.8% |
| Complexity: Conditional | 127.64 | 7.8347 | 8.4074 | 64 | 🟢 +96.4% | 🟢 +96.4% |
| Complexity: Heavy | 79.27 | 12.6146 | 15.9290 | 40 | 🟢 +61.8% | 🟢 +61.8% |

### Previous Results

<details>
<summary>View previous benchmark results</summary>

**Date:** 2025-12-09

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

- **98.68x** faster than *Scaling: Medium (1,000 items)*
- **494.68x** faster than *Complexity: Conditional*
- **734.98x** faster than *Complexity: Structural*
- **796.48x** faster than *Complexity: Heavy*
- **1012.94x** faster than *Scaling: Large (10,000 items)*
- **1053.81x** faster than *Complexity: Simple*
