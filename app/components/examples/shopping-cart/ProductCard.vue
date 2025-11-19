<script setup lang="ts">
import { useCheckIn } from '#vue-airport/composables/useCheckIn';
import { type CartItem, type CartContext, CART_DESK_KEY } from '.';

/**
 * Product Card Component
 *
 * Automatically checks in and retrieves product data from desk context.
 */

const props = defineProps<{
  id: string;
}>();

// Check in to the cart desk and get context
const { checkIn } = useCheckIn<CartItem, CartContext>();
const { desk } = checkIn(CART_DESK_KEY, {
  id: props.id,
  autoCheckIn: false,
  watchData: true,
  data: (desk) => {
    const product = desk.products.value.find((p) => p.id === props.id);
    return {
      name: product?.name ?? '',
      price: product?.price ?? 0,
      quantity: product?.quantity ?? 1,
      imageUrl: product?.imageUrl,
    };
  },
});

// Get product data from context
const productData = computed(() => {
  return desk?.products?.value.find((p) => p.id === props.id);
});

// Check if product is in the cart (checked in to desk)
const isInCart = computed(() => desk?.has(props.id) ?? false);

// Function to add product to cart
const addToCart = () => {
  if (!productData.value) return;

  // If already in cart, just increment quantity
  if (desk?.has(props.id)) {
    const currentItem = desk.get(props.id);
    if (currentItem) {
      const newQty = currentItem.data.quantity + 1;
      desk.update(props.id, { quantity: newQty });
      desk.updateQuantity(props.id, newQty);
    }
  } else {
    // Add new item to cart by checking in
    desk?.checkIn(props.id, {
      name: productData.value.name,
      price: productData.value.price,
      quantity: productData.value.quantity,
      imageUrl: productData.value.imageUrl,
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
  if (!productData.value) return;
  const newQuantity = productData.value.quantity + 1;
  desk?.updateQuantity(props.id, newQuantity);

  // Update the cart with new quantity if item is in cart
  if (desk?.has(props.id)) {
    desk.update(props.id, { quantity: newQuantity });
  }
};

// Function to decrement quantity
const decrement = () => {
  if (!productData.value) return;
  const newQuantity = Math.max(1, productData.value.quantity - 1);
  desk?.updateQuantity(props.id, newQuantity);

  // Update the cart with new quantity if item is in cart
  if (desk?.has(props.id)) {
    desk.update(props.id, { quantity: newQuantity });
  }
};
</script>

<template>
  <div
    class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-900 flex flex-col gap-3 transition-all duration-200 hover:border-primary hover:shadow-md"
  >
    <div class="flex justify-center items-center h-16 text-5xl text-primary opacity-70">
      <UIcon :name="productData?.imageUrl || 'i-heroicons-cube'" />
    </div>

    <div class="flex flex-col gap-2 flex-1">
      <h4 class="text-base font-semibold m-0">{{ productData?.name }}</h4>
      <div class="text-xl font-bold text-primary">${{ productData?.price.toFixed(2) }}</div>
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
          :disabled="(productData?.quantity ?? 1) <= 1"
          @click="decrement"
        />
        <span class="min-w-8 text-center font-semibold">{{ productData?.quantity }}</span>
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
