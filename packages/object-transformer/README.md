# @vue-airport/object-transformer

Object transformer core and Vue wrapper for the `vue-airport` ecosystem.

This repository package is a scaffold inside the `vue-airport` monorepo. It is intended
to be split into a pure TypeScript `core` (transformation logic, recipe builder/apply)
and a `vue` wrapper (Vue 3 components, integration with `vue-airport`).

Quick notes

- Package name: `@vue-airport/object-transformer`
- Peer dependencies: `vue` and `vue-airport` (declared as `peerDependencies`)
- Build: Vite (lib mode), TypeScript declarations generated via `vite-plugin-dts`

Getting started (local development)

1. From monorepo root, install deps and run the dev script inside the package:

```bash
yarn
cd packages/object-transformer
yarn dev
```

Planned structure

- `src/core` — pure TypeScript core utilities (move `utils/*` here)
- `src/vue` — Vue components that depend on the core and `vue-airport`
- `src/index.ts` — public entry that re-exports core functions and components

Next steps

1. Extract core utilities from the monorepo (`app/components/examples/object-transformer/utils/*`) into `src/core`.
2. Move Vue components into `src/vue` and update imports to consume the core package local APIs.
3. Add tests (vitest), CI pipeline, and example/demo.

If you want, I can proceed to extract the core code and create a working build/test setup.
