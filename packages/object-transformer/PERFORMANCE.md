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

### Current Results (vs 2025-12-09)

| Name | Ops/sec (Hz) | Mean (ms) | P99 (ms) | Samples | vs Previous |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Scaling: Small (10 items) | 63230.50 | 0.0158 | 0.0233 | 31616 | ⚪ +3.2% |
| Scaling: Medium (1,000 items) | 633.26 | 1.5791 | 2.2690 | 317 | ⚪ +3.5% |
| Scaling: Large (10,000 items) | 61.39 | 16.2906 | 19.3817 | 31 | ⚪ +1.9% |
| Complexity: Simple | 61.63 | 16.2250 | 19.6753 | 31 | ⚪ +2.6% |
| Complexity: Structural | 83.23 | 12.0154 | 25.0125 | 42 | ⚪ -4.4% |
| Complexity: Conditional | 63.48 | 15.7523 | 18.6425 | 32 | ⚪ +0.3% |
| Complexity: Heavy | 47.36 | 21.1128 | 28.1714 | 24 | ⚪ -0.1% |

### Previous Results

<details>
<summary>View previous benchmark results</summary>

**Date:** 2025-12-09

| Name | Ops/sec (Hz) | Mean (ms) | P99 (ms) | Samples |
| :--- | :--- | :--- | :--- | :--- |
| Scaling: Small (10 items) | 61267.26 | 0.0163 | 0.0232 | 30634 |
| Scaling: Medium (1,000 items) | 611.63 | 1.6350 | 2.4860 | 306 |
| Scaling: Large (10,000 items) | 60.23 | 16.6023 | 19.7955 | 31 |
| Complexity: Simple | 60.06 | 16.6514 | 20.0009 | 31 |
| Complexity: Structural | 87.03 | 11.4903 | 13.9457 | 44 |
| Complexity: Conditional | 63.31 | 15.7941 | 18.5918 | 32 |
| Complexity: Heavy | 47.43 | 21.0819 | 27.5708 | 24 |

</details>

## Performance Comparison

**Scaling: Small (10 items)** is the fastest.

- **99.85x** faster than *Scaling: Medium (1,000 items)*
- **759.74x** faster than *Complexity: Structural*
- **996.02x** faster than *Complexity: Conditional*
- **1025.91x** faster than *Complexity: Simple*
- **1030.06x** faster than *Scaling: Large (10,000 items)*
- **1334.98x** faster than *Complexity: Heavy*
