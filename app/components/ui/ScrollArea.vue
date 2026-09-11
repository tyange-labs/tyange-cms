<script setup lang="ts">
import { ScrollAreaRoot, ScrollAreaScrollbar, ScrollAreaThumb, ScrollAreaViewport } from 'reka-ui'

withDefaults(
  defineProps<{
    orientation?: 'horizontal' | 'vertical'
  }>(),
  {
    orientation: 'vertical',
  },
)
</script>

<template>
  <ScrollAreaRoot class="relative overflow-hidden">
    <ScrollAreaViewport class="h-full w-full">
      <slot />
    </ScrollAreaViewport>
    <ScrollAreaScrollbar
      :orientation="orientation"
      class="flex touch-none p-0.5 select-none data-[orientation=horizontal]:h-2 data-[orientation=vertical]:w-2"
    >
      <ScrollAreaThumb class="flex-1 rounded-full bg-slate-300 hover:bg-slate-400" />
    </ScrollAreaScrollbar>
  </ScrollAreaRoot>
</template>
