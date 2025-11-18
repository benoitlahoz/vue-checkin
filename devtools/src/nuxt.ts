import { setupAirportDevTools } from './index';

/**
 * Nuxt plugin for vue-airport DevTools
 * Auto-loaded by the Nuxt module
 */
export default function (nuxtApp: any) {
  // Only run in development and on client-side
  if (typeof window !== 'undefined') {
    setupAirportDevTools(nuxtApp.vueApp);
  }
}
