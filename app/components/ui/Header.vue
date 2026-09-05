<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string
  }>(),
  {
    title: undefined,
  },
)
</script>

<template>
  <header class="h-(--header-height) shrink-0 border-b border-default">
    <div class="mx-auto flex h-full w-full max-w-3xl items-center justify-between gap-3 px-5">
      <div class="flex items-center gap-6 overflow-x-auto">
        <NuxtLink v-if="title" to="/" class="shrink-0 font-semibold">
          {{ title }}
        </NuxtLink>
        <slot />
      </div>
      <div class="flex shrink-0 items-center gap-3">
        <slot name="right" />
      </div>
    </div>
  </header>
</template>
