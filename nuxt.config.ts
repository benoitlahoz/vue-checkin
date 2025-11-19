// https://nuxt.com/docs/api/configuration/nuxt-config
import { fileURLToPath } from 'node:url';

export default defineNuxtConfig({
  extends: ['docus'],
  site: {
    name: 'VueAirport',
    description: 'Documentation for VueAirport composable and features',
  },
  app: {
    baseURL: '/vue-airport/',
  },
  css: ['~/assets/css/main.css'],
  alias: {
    '@/lib': fileURLToPath(new URL('./app/lib', import.meta.url)),
    '@/components': fileURLToPath(new URL('./app/components', import.meta.url)),
    '#vue-airport': fileURLToPath(new URL('./packages/core/src', import.meta.url)),
    '#vue-airport/plugins': fileURLToPath(new URL('./packages/plugins-base/src', import.meta.url)),
    'vue-airport': fileURLToPath(new URL('./packages/core/src', import.meta.url)),
    '@vue-airport/plugins-base': fileURLToPath(
      new URL('./packages/plugins-base/src', import.meta.url)
    ),
    'vue-airport-devtools': fileURLToPath(new URL('./packages/devtools/src', import.meta.url)),
    'vue-airport-devtools/nuxt': fileURLToPath(
      new URL('./packages/devtools/src/nuxt-module.ts', import.meta.url)
    ),
  },
  vite: {
    resolve: {
      alias: {
        '@/lib': fileURLToPath(new URL('./app/lib', import.meta.url)),
        '@/components': fileURLToPath(new URL('./app/components', import.meta.url)),
        '#vue-airport': fileURLToPath(new URL('./packages/core/src', import.meta.url)),
        '#vue-airport/plugins': fileURLToPath(
          new URL('./packages/plugins-base/src', import.meta.url)
        ),
        'vue-airport': fileURLToPath(new URL('./packages/core/src', import.meta.url)),
        '@vue-airport/plugins-base': fileURLToPath(
          new URL('./packages/plugins-base/src', import.meta.url)
        ),
        'vue-airport-devtools': fileURLToPath(new URL('./packages/devtools/src', import.meta.url)),
        'vue-airport-devtools/nuxt': fileURLToPath(
          new URL('./packages/devtools/src/nuxt-module.ts', import.meta.url)
        ),
      },
    },
  },
  components: [
    {
      path: '~/components',
      pathPrefix: false,
      extensions: ['.vue'],
      ignore: ['**/index.ts'],
      global: true,
    },
  ],
  modules: ['@nuxt/content', '@nuxt/eslint', '@nuxt/ui', 'vue-airport-devtools/nuxt'],
  robots: {
    robotsTxt: false,
  },
  llms: {
    domain: 'https://benoitlahoz.github.io/vue-airport/',
    title: 'VueAirport',
    description: 'Documentation for VueAirport composable and features',
  },
});
