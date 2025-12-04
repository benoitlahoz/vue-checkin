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
    head: {
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/vue-airport/favicon.ico' },
        { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/vue-airport/favicon-16x16.png' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/vue-airport/favicon-32x32.png' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/vue-airport/apple-touch-icon.png' },
        { rel: 'manifest', href: '/vue-airport/site.webmanifest' },
      ],
    },
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
    '@vue-airport/plugins-validation': fileURLToPath(
      new URL('./packages/plugins-validation/src', import.meta.url)
    ),
    'vue-airport-devtools': fileURLToPath(new URL('./packages/devtools/src', import.meta.url)),
    'vue-airport-devtools/nuxt': fileURLToPath(
      new URL('./packages/devtools/src/nuxt-module.ts', import.meta.url)
    ),
    '@vue-airport/object-transformer': fileURLToPath(
      new URL('./packages/object-transformer/src', import.meta.url)
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
