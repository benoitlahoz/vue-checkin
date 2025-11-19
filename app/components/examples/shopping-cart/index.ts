import type { InjectionKey, Ref } from 'vue';
import type { DeskCore } from '#vue-airport/composables/useCheckIn';

export interface CartItem {
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

export interface CartContext {
  products: Ref<Product[]>;
  updateQuantity: (id: string, quantity: number) => void;
}

export const CART_DESK_KEY: InjectionKey<DeskCore<CartItem> & CartContext> = Symbol('cartDesk');

export { default as ShoppingCart } from './ShoppingCart.vue';
export { default as ProductCard } from './ProductCard.vue';
