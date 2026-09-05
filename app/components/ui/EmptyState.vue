<script setup lang="ts">
import type { Component } from 'vue'

defineProps<{
  icon?: Component
  label?: string
}>()
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-2 py-12 text-center">
    <component :is="icon" v-if="icon" class="size-8 text-muted" />
    <p class="text-sm text-muted">
      {{ label }}
    </p>
  </div>
</template>
