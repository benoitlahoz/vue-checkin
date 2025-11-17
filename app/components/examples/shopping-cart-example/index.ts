import type { InjectionKey } from 'vue';
import type { DeskCore } from '#vue-checkin/composables/useCheckIn';

interface CartItem {
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

export const CART_DESK_KEY: InjectionKey<DeskCore<CartItem>> = Symbol('cartDesk');

export { default as ShoppingCartExample } from './ShoppingCartExample.vue';
export { default as ProductCard } from './ProductCard.vue';
