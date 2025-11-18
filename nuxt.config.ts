// https://nuxt.com/docs/api/configuration/nuxt-config
import { fileURLToPath } from 'node:url';

export default defineNuxtConfig({
  site: {
    name: 'VueAirport',
    description: 'Documentation for VueAirport composable and features',
  },
  app: {
    baseURL: '/vue-airport/',
  },
  alias: {
    '#vue-airport': fileURLToPath(new URL('./lib/src', import.meta.url)),
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
  modules: ['@nuxt/content', '@nuxt/eslint', '@nuxt/ui'],
  robots: {
    robotsTxt: false,
  },
  llms: {
    domain: 'https://benoitlahoz.github.io/vue-airport/',
    title: 'VueAirport',
    description: 'Documentation for VueAirport composable and features',
  },
});
