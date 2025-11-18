import type { InjectionKey } from 'vue';
import type { DeskCore } from '#vue-airport/composables/useCheckIn';

export interface CartItem {
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

export const CART_DESK_KEY: InjectionKey<DeskCore<CartItem>> = Symbol('cartDesk');

export { default as ShoppingCart } from './ShoppingCart.vue';
export { default as ProductCard } from './ProductCard.vue';
