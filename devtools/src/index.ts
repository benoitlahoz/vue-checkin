import type { App } from 'vue';
import { setupDevtoolsPlugin } from '@vue/devtools-api';
import { PLUGIN_ID } from './constants';
import { setupTimeline } from './timeline';
import { setupInspector } from './inspector';
import { attachGlobalHook } from './hook';

export interface AirportDevToolsOptions {
  /**
   * Enable performance tracking
   * @default true
   */
  enablePerformance?: boolean;

  /**
   * Enable timeline events
   * @default true
   */
  enableTimeline?: boolean;

  /**
   * Enable registry inspector
   * @default true
   */
  enableInspector?: boolean;
}

/**
 * Setup vue-airport DevTools integration
 */
export function setupAirportDevTools(app: App, options: AirportDevToolsOptions = {}) {
  const { enableTimeline = true, enableInspector = true } = options;

  // Attach global hook for tracking
  attachGlobalHook(app);

  setupDevtoolsPlugin(
    {
      id: PLUGIN_ID,
      label: 'Airport',
      packageName: 'vue-airport',
      homepage: 'https://github.com/benoitlahoz/vue-airport',
      logo: 'https://raw.githubusercontent.com/benoitlahoz/vue-airport/master/public/vue-airport.png',
      app: app as any,
      enableEarlyProxy: true,
    },
    (api: any) => {
      // Setup timeline layer
      if (enableTimeline) {
        setupTimeline(api);
      }

      // Setup registry inspector
      if (enableInspector) {
        setupInspector(api);
      }

      // Add custom tabs (future)
      // setupCustomTabs(api)
    }
  );
}

export * from './types';
