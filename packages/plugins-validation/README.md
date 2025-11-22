
# @vue-airport/plugins-validation

> **Advanced validation for VueAirport**
>
> This package provides validation and constraint plugins for the VueAirport ecosystem. It allows you to express complex business rules on data and relationships, both declaratively and functionally.
>
> **Note:** The validation plugin was moved here from `@vue-airport/plugins-base` to improve modularity and maintainability. Please update your imports accordingly.

---


## Table of Contents

- [Installation](#installation)
- [API](#api)
- [Usage Examples](#usage-examples)
- [Typing & Integration](#typing--integration)
- [FAQ](#faq)
- [License](#license)

---

## Installation

```sh
npm install @vue-airport/plugins-validation
```

---

## API

### `createConstraintsPlugin`

Apply constraints to children registered in a VueAirport desk:

- **Uniqueness** of a property
- **Cardinality** (max/min count)
- **Dependencies** and relationships between children
- **Custom rules** (function)

#### Signature

```ts
function createConstraintsPlugin<T = any>(constraints: Constraint<T>[]): CheckInPlugin<T>
```

#### Constraint Typing

```ts
type ConstraintFn<T> = (child: T, children: T[]) => string | null
type ConstraintObj<T> =
  | { type: 'unique'; key: keyof T; message?: string }
  | { type: 'maxCount'; count: number; message?: string }
  | { type: 'relation'; rule: ConstraintFn<T>; message?: string }
  | { type: 'beforeCheckOut'; rule: ConstraintFn<T>; message?: string }
type Constraint<T> = ConstraintFn<T> | ConstraintObj<T>
```

---

## Usage Examples

### 1. Simple constraints

```ts
import { useCheckIn } from 'vue-airport'
import { createConstraintsPlugin } from '@vue-airport/plugins-validation'

const constraints = [
  { type: 'unique', key: 'email', message: 'Email already used' },
  { type: 'maxCount', count: 5, message: 'Maximum 5 members' },
]

const { children } = useCheckIn({
  plugins: [createConstraintsPlugin(constraints)]
})
```

### 2. Custom business rule

```ts
const constraints = [
  (child, children) => child.role === 'admin' && children.filter(u => u.role === 'admin').length >= 2
    ? 'Maximum 2 admins'
    : null,
]
```

### 3. Dependency between items

```ts
const constraints = [
  (child, children) => child.type === 'important' && !children.some(c => c.type === 'debrief' && c.start === child.end)
    ? 'A debrief must follow an important meeting'
    : null,
]
```

---

## Typing & Integration

- Fully TypeScript compatible (generic types, static validation)
- Integrates with `useCheckIn` or any VueAirport desk
- Can be combined with other plugins (validation, history, etc.)
- Uses `onBeforeCheckIn` and `onBeforeCheckOut` hooks to ensure business consistency

---

## FAQ

**Q: Can I inject dynamic constraints?**
A: Yes, constraints can be functions or objects, and can depend on business context.

**Q: What happens if a constraint is violated?**
A: The plugin throws an exception (blocks the operation) and can return a custom error message.

**Q: Can I combine multiple validation plugins?**
A: Yes, they are chainable and compatible.

---

## License

MIT


## 🔗 Links

- [Documentation](https://benoitlahoz.github.io/vue-airport)
- [GitHub Repository](https://github.com/benoitlahoz/vue-airport)
- [npm Package](https://www.npmjs.com/package/@vue-airport/plugins-validation)
- [Core Package](https://www.npmjs.com/package/vue-airport)