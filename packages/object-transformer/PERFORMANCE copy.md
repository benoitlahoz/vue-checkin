# Performance Benchmarks

**Date:** 2025-12-06

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

### Structural Complex
Advanced structural changes: splitting strings into multiple keys and flattening objects.

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
  "tags": [
    "a",
    "b",
    "c"
  ],
  "name_0": "user",
  "name_1": "0",
  "stats_score": 0,
  "stats_level": 1
}
```
</details>

---

### Extreme (Deep Nested)
Deeply nested object flattening, multiple renames, splits, and deletions.

<details>
<summary>View Input Data</summary>

```json
{
  "id": "user-0",
  "profile": {
    "personal": {
      "firstName": "John0",
      "lastName": "Doe0",
      "age": 20
    },
    "contact": {
      "email": "john0@example.com",
      "address": {
        "street": "0 Main St",
        "city": "New York",
        "country": "USA",
        "zip": "10000"
      }
    }
  },
  "orders": {
    "lastOrder": {
      "id": "ord-0",
      "total": 100
    },
    "totalSpent": 0
  },
  "metadata": {
    "created": "2023-01-01",
    "tags": "vip,active,premium"
  }
}
```
</details>

<details>
<summary>View Output Data</summary>

```json
{
  "id": "user-0",
  "orders": {
    "lastOrder": {
      "id": "ord-0",
      "total": 100
    },
    "totalSpent": 0
  },
  "metadata": {
    "tags_0": "vip",
    "tags_1": "active",
    "tags_2": "premium"
  },
  "migratedAt": "2025-12-06T17:25:48.555Z"
}
```
</details>

---

## Results

| Name | Ops/sec (Hz) | Mean (ms) | P99 (ms) | Samples |
| :--- | :--- | :--- | :--- | :--- |
| Scaling: Small (10 items) | 397319.54 | 0.0025 | 0.0034 | 198660 |
| Scaling: Medium (1,000 items) | 4175.12 | 0.2395 | 0.3737 | 2088 |
| Scaling: Large (10,000 items) | 414.78 | 2.4109 | 2.8942 | 208 |
| Complexity: Simple | 417.81 | 2.3934 | 2.7787 | 209 |
| Complexity: Structural | 171.63 | 5.8265 | 10.5822 | 86 |
| Complexity: Conditional | 477.95 | 2.0923 | 2.5957 | 239 |
| Complexity: Heavy | 116.29 | 8.5995 | 12.8735 | 59 |
| Complexity: Structural Complex | 71.60 | 13.9659 | 23.1670 | 36 |
| Complexity: Extreme (Deep Nested) | 24.60 | 40.6559 | 46.8796 | 13 |

## Performance Comparison

**Scaling: Small (10 items)** is the fastest.

- **95.16x** faster than *Scaling: Medium (1,000 items)*
- **831.30x** faster than *Complexity: Conditional*
- **950.95x** faster than *Complexity: Simple*
- **957.92x** faster than *Scaling: Large (10,000 items)*
- **2314.97x** faster than *Complexity: Structural*
- **3416.76x** faster than *Complexity: Heavy*
- **5548.94x** faster than *Complexity: Structural Complex*
- **16153.38x** faster than *Complexity: Extreme (Deep Nested)*
