import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'VueAirportPluginsValidation',
      formats: ['es', 'cjs'],
      fileName: (format) => `vue-airport-plugins-validation.${format === 'es' ? 'mjs' : 'cjs'}`,
    },
    rollupOptions: {
      external: ['vue', 'vue-airport'],
      output: {
        globals: {
          vue: 'Vue',
          'vue-airport': 'VueAirport',
        },
      },
    },
  },
  resolve: {
    alias: {
      'vue-airport': resolve(__dirname, '../core/src/index.ts'),
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
