// https://nuxt.com/docs/api/configuration/nuxt-config
import { fileURLToPath } from 'node:url';

export default defineNuxtConfig({
  site: {
    name: 'Vue Check-in',
    description: 'Documentation for Vue Check-in composable and features',
  },
  app: {
    baseURL: '/vue-checkin/',
  },
  alias: {
    '#vue-checkin': fileURLToPath(new URL('./lib/src', import.meta.url)),
  },
  components: [
    {
      path: '~/components',
      pathPrefix: false,
      extensions: ['.vue'],
      ignore: ['**/index.ts']
    },
  ],
  modules: ["@nuxt/content", "@nuxt/eslint", "@nuxt/ui"],
  robots: {
    robotsTxt: false,
  },
  llms: {
    domain: 'https://benoitlahoz.github.io/vue-checkin/',
    title: 'VueCheck-in',
    description: 'Documentation for Vue Check-in composable and features',
  }
}) 