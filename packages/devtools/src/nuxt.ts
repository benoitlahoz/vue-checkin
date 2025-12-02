import { defineNuxtPlugin } from '#app';
import { setupAirportDevTools } from '.';

/**
 * Nuxt plugin for vue-airport DevTools
 * Auto-loaded by the Nuxt module
 */
export default defineNuxtPlugin((nuxtApp) => {
  // Only run in development and on client-side
  if (typeof window !== 'undefined') {
    setupAirportDevTools(nuxtApp.vueApp);
  }
});
