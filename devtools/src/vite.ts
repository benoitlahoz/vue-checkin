import type { Plugin } from 'vite';

export interface VitePluginOptions {
  /**
   * Enable in production
   * @default false
   */
  productionEnabled?: boolean;

  /**
   * Auto-inject DevTools in app entry
   * Set to false for Nuxt projects (use the Nuxt plugin instead)
   * @default true
   */
  autoInject?: boolean;
}

/**
 * Vite plugin for vue-airport DevTools
 * For Nuxt projects, set autoInject: false and use the Nuxt plugin instead
 */
export function VueAirportDevTools(options: VitePluginOptions = {}): Plugin {
  const { productionEnabled = false, autoInject = true } = options;

  return {
    name: 'vue-airport-devtools',
    enforce: 'pre',

    config(config, { mode }) {
      // Skip in production unless explicitly enabled
      if (mode === 'production' && !productionEnabled) {
        return;
      }

      return {
        optimizeDeps: {
          include: ['vue-airport-devtools', '@vue/devtools-api'],
        },
      };
    },

    transform(code, id) {
      // Skip auto-injection if disabled (e.g., for Nuxt)
      if (!autoInject) {
        return;
      }

      // Auto-inject DevTools setup in main entry
      if (id.includes('main.ts') || id.includes('main.js')) {
        const injection = `
import { setupAirportDevTools } from 'vue-airport-devtools';

const __originalCreateApp = createApp;
const createApp = (...args) => {
  const app = __originalCreateApp(...args);
  if (import.meta.env.DEV) {
    setupAirportDevTools(app);
  }
  return app;
};
`;
        return {
          code: injection + code,
          map: null,
        };
      }
    },
  };
}
