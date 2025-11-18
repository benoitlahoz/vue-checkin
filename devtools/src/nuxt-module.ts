import { defineNuxtModule, addPlugin, createResolver } from '@nuxt/kit';

export default defineNuxtModule({
  meta: {
    name: 'vue-airport-devtools',
    configKey: 'vueAirportDevtools',
  },
  defaults: {
    enabled: true,
  },
  setup(options, _nuxt) {
    if (!options.enabled) {
      return;
    }

    const resolver = createResolver(import.meta.url);

    // Add plugin - will be wrapped in defineNuxtPlugin by Nuxt
    addPlugin({
      src: resolver.resolve('./nuxt'),
      mode: 'client',
    });
  },
});
