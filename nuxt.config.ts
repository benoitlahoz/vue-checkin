// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  site: {
    name: 'Vue Check-in',
    description: 'Documentation for Vue Check-in composable and features',
  },
  app: {
    baseURL: '/vue-checkin/',
  },
  alias: {
    '@/vue-checkin': './lib/src',
  },
  modules: ["@nuxt/content", "@nuxt/eslint", "@nuxt/ui"],
  robots: {
    robotsTxt: false,
  },
  llms: {
    domain: 'https://benoitlahoz.github.io/vue-checkin/',
    title: 'Vue Check-in',
    description: 'Documentation for Vue Check-in composable and features',
  }
})