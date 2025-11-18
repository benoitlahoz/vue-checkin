import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  root: __dirname,
  plugins: [
    dts({
      entryRoot: 'src',
      outDir: 'dist',
      insertTypesEntry: true,
    }),
  ],
  build: {
    outDir: 'dist',
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        vite: resolve(__dirname, 'src/vite.ts'),
        nuxt: resolve(__dirname, 'src/nuxt.ts'),
        'nuxt-module': resolve(__dirname, 'src/nuxt-module.ts'),
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: [
        'vue',
        'vue-checkin',
        '@vue/devtools-api',
        '@nuxt/devtools-kit',
        '@nuxt/kit',
        'vite',
      ],
      output: {
        preserveModules: false,
        // Éviter les conflits de noms avec Vue
        manualChunks: undefined,
      },
    },
    minify: false, // Désactiver la minification pour éviter les conflits
    sourcemap: true,
  },
});
