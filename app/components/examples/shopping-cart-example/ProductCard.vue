<script setup lang="ts">
import { useCheckIn } from '#vue-checkin/composables/useCheckIn';
import { CART_DESK_KEY } from './index';

/**
 * Product Card Component
 * 
 * Individual product card that automatically checks in to the cart desk.
 * Handles quantity updates and cart operations.
 */

interface CartItem {
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

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

// Automatically check in to the cart desk with data watching
const { desk, checkOut } = useCheckIn<CartItem>().checkIn(CART_DESK_KEY, {
  id: props.id,
  autoCheckIn: true,
  watchData: true,
  data: () => ({
    name: props.name,
    price: props.price,
    quantity: props.quantity,
    imageUrl: props.imageUrl,
  }),
});

// Check if product is in the cart
const isInCart = computed(() => desk?.has(props.id) ?? false);

// Function to remove product from cart
const removeFromCart = () => {
  checkOut();
};

// Function to increment quantity
const increment = () => {
  emit('updateQuantity', props.id, props.quantity + 1);
};

// Function to decrement quantity
const decrement = () => {
  emit('updateQuantity', props.id, Math.max(1, props.quantity - 1));
};
</script>

<template>
  <div class="product-card">
    <div class="product-icon">
      <UIcon :name="imageUrl || 'i-heroicons-cube'" />
    </div>
    
    <div class="product-info">
      <h4 class="product-name">{{ name }}</h4>
      <div class="product-price">${{ price.toFixed(2) }}</div>
    </div>

    <div class="product-actions">
      <div v-if="isInCart" class="quantity-controls">
        <UButton
          size="xs"
          color="primary"
          variant="soft"
          icon="i-heroicons-minus"
          :disabled="quantity <= 1"
          @click="decrement"
        />
        <span class="quantity-value">{{ quantity }}</span>
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

<style scoped>
.product-card {
  border: 1px solid var(--ui-border-primary);
  border-radius: 0.5rem;
  padding: 1rem;
  background: var(--ui-bg);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  transition: all 0.2s;
}

.product-card:hover {
  border-color: var(--ui-primary);
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
}

.product-icon {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 4rem;
  font-size: 3rem;
  color: var(--ui-primary);
  opacity: 0.7;
}

.product-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
}

.product-name {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
}

.product-price {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--ui-primary);
}

.product-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.quantity-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  justify-content: center;
}

.quantity-value {
  min-width: 2rem;
  text-align: center;
  font-weight: 600;
}
</style>
