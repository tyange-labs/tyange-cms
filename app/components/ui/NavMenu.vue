<script setup lang="ts">
defineProps<{
  items: Array<{ label: string; to: string; active?: boolean }>
}>()
</script>

<template>
  <nav class="flex items-center gap-1">
    <NuxtLink
      v-for="item in items"
      :key="item.to"
      :to="item.to"
      class="rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
      :class="
        item.active ? 'bg-elevated text-default' : 'text-muted hover:bg-elevated hover:text-default'
      "
    >
      {{ item.label }}
    </NuxtLink>
  </nav>
</template>
