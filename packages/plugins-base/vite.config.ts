import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'VueAirportPlugins',
      formats: ['es', 'cjs'],
      fileName: (format) => `vue-airport-plugins.${format === 'es' ? 'mjs' : 'cjs'}`,
    },
    rollupOptions: {
      external: ['vue', '@vue-airport/core'],
      output: {
        globals: {
          vue: 'Vue',
          '@vue-airport/core': 'VueAirport',
        },
      },
    },
  },
  plugins: [
    dts({
      outDir: 'dist',
      insertTypesEntry: true,
      rollupTypes: true,
    }),
  ],
});
