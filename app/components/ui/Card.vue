<script setup lang="ts">
withDefaults(
  defineProps<{
    bodyClass?: string
  }>(),
  {
    bodyClass: undefined,
  },
)
</script>

<template>
  <div class="overflow-hidden rounded-lg border border-default bg-default">
    <div v-if="$slots.header" class="border-b border-default px-4 py-3">
      <slot name="header" />
    </div>
    <div class="p-4" :class="bodyClass">
      <slot />
    </div>
  </div>
</template>
