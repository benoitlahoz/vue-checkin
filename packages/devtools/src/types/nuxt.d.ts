declare module '#app' {
  import type { App } from 'vue';

  export interface NuxtApp {
    vueApp: App;
    [key: string]: any;
  }

  export function defineNuxtPlugin(plugin: (nuxtApp: NuxtApp) => void | Promise<void>): any;
}
