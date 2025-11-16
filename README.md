````mdc
# Vue CheckIn

A monorepo containing the **vue-checkin** library and its documentation.

## Project Structure

```
vue-checkin/
├── lib/                    # Library package
│   ├── src/               # Library source code
│   ├── dist/              # Built library (generated)
│   ├── package.json       # Library package.json
│   └── vite.config.ts     # Build configuration
├── content/               # Documentation content (Markdown)
├── public/                # Documentation static assets
├── package.json           # Documentation package.json
└── nuxt.config.ts         # Documentation config
```

## Library Development

The library is located in the `lib/` directory and has its own independent package.json.

```bash
# Install library dependencies
yarn lib:install

# Build the library
yarn lib:build

# Clean library build
yarn lib:clean
```

Or work directly in the lib directory:

```bash
cd lib
yarn install
yarn build
```

## Documentation

The documentation is built with Nuxt + Docus and lives in the root directory.

```bash
# Install documentation dependencies
yarn install

# Start documentation dev server
yarn dev

# Build documentation
yarn build

# Clean documentation cache
yarn clean
```

## ⚡ Built with

- **Library**: [Vue 3](https://vuejs.org/) + [Vite](https://vitejs.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Documentation**: [Nuxt 4](https://nuxt.com) + [Docus](https://docus.dev) + [Nuxt UI](https://ui.nuxt.com)

## Publishing

The library (`lib/` directory) is published to npm as `vue-checkin`.
The documentation is separate and not included in the npm package.

## 📄 License

[MIT License](https://opensource.org/licenses/MIT) 
```` 