<script setup lang="ts">
withDefaults(
  defineProps<{
    label?: string
  }>(),
  {
    label: undefined,
  },
)
</script>

<template>
  <label class="block space-y-1">
    <span v-if="label" class="block text-sm font-medium">{{ label }}</span>
    <slot />
  </label>
</template>
