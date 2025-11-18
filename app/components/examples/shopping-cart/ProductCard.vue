<script setup lang="ts">
import { inject } from 'vue';
import { type CartItem, CART_DESK_KEY } from '.';
import type { DeskCore } from '#vue-airport/composables/useCheckIn';

/**
 * Product Card Component
 *
 * Individual product card that can be added/removed from cart.
 * Handles quantity updates and cart operations.
 */

const props = defineProps<{
  id: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}>();

const emit = defineEmits<{
  updateQuantity: [id: string, quantity: number];
}>();

/**
 * Get access to the cart desk directly via inject
 * Products (NOT components) are manually added/removed from the cart
 */
const desk = inject<DeskCore<CartItem>>(CART_DESK_KEY);

// Check if product is in the cart
const isInCart = computed(() => desk?.has(props.id) ?? false);

// Function to add product to cart
const addToCart = () => {
  // If already in cart, just increment quantity
  if (desk?.has(props.id)) {
    const currentItem = desk.get(props.id);
    if (currentItem) {
      desk.update(props.id, {
        quantity: currentItem.data.quantity + 1,
      });
      emit('updateQuantity', props.id, currentItem.data.quantity + 1);
    }
  } else {
    // Add new item to cart
    desk?.checkIn(props.id, {
      name: props.name,
      price: props.price,
      quantity: props.quantity,
      imageUrl: props.imageUrl,
    });
  }
};

// Function to remove product from cart
const removeFromCart = () => {
  if (confirm('Do you really want to remove this product from the cart?')) {
    desk?.checkOut(props.id);
  }
};

// Function to increment quantity
const increment = () => {
  const newQuantity = props.quantity + 1;
  emit('updateQuantity', props.id, newQuantity);
  // Update the cart with new quantity if item is in cart
  if (desk?.has(props.id)) {
    desk?.update(props.id, {
      quantity: newQuantity,
    });
  }
};

// Function to decrement quantity
const decrement = () => {
  const newQuantity = Math.max(1, props.quantity - 1);
  emit('updateQuantity', props.id, newQuantity);
  // Update the cart with new quantity if item is in cart
  if (desk?.has(props.id)) {
    desk?.update(props.id, {
      quantity: newQuantity,
    });
  }
};
</script>

<template>
  <div
    class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-900 flex flex-col gap-3 transition-all duration-200 hover:border-primary hover:shadow-md"
  >
    <div class="flex justify-center items-center h-16 text-5xl text-primary opacity-70">
      <UIcon :name="imageUrl || 'i-heroicons-cube'" />
    </div>

    <div class="flex flex-col gap-2 flex-1">
      <h4 class="text-base font-semibold m-0">{{ name }}</h4>
      <div class="text-xl font-bold text-primary">${{ price.toFixed(2) }}</div>
    </div>

    <div class="flex flex-col gap-2">
      <!-- Add to Cart button when not in cart -->
      <UButton
        v-if="!isInCart"
        size="sm"
        color="primary"
        icon="i-heroicons-shopping-cart"
        block
        @click="addToCart"
      >
        Add to Cart
      </UButton>

      <!-- Quantity controls when in cart -->
      <div v-if="isInCart" class="flex items-center gap-2 justify-center">
        <UButton
          size="xs"
          color="primary"
          variant="soft"
          icon="i-heroicons-minus"
          :disabled="quantity <= 1"
          @click="decrement"
        />
        <span class="min-w-8 text-center font-semibold">{{ quantity }}</span>
        <UButton
          size="xs"
          color="primary"
          variant="soft"
          icon="i-heroicons-plus"
          @click="increment"
        />
      </div>

      <UButton
        v-if="isInCart"
        size="xs"
        color="error"
        variant="ghost"
        icon="i-heroicons-trash"
        @click="removeFromCart"
      >
        Remove
      </UButton>

      <UBadge v-if="isInCart" color="success" variant="subtle">
        <UIcon name="i-heroicons-check" />
        In Cart
      </UBadge>
    </div>
  </div>
</template>
