# Vue CheckIn Library

This directory contains the **vue-checkin** library source code and build configuration.

## Structure

- `src/` - Library source code
  - `composables/` - Core composables (useCheckIn, types)
  - `plugins/` - Built-in plugins (activeItem, history, logger, validation)
  - `index.ts` - Main export file
- `dist/` - Built library files (generated)
- `vite.config.ts` - Vite build configuration
- `package.json` - Library package configuration
- `tsconfig.json` - TypeScript configuration

## Development

```bash
# Install dependencies
yarn install

# Build the library
yarn build

# Clean build artifacts
yarn clean
```

## Build Output

The build generates:
- `dist/vue-checkin.mjs` - ES Module format
- `dist/vue-checkin.cjs` - CommonJS format
- `dist/index.d.ts` - TypeScript declarations

## Publishing

This package is published to npm as `vue-checkin`.
