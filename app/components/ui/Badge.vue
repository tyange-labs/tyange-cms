<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    color?: 'primary' | 'neutral'
    variant?: 'solid' | 'subtle' | 'outline'
    size?: 'sm'
  }>(),
  {
    color: 'primary',
    variant: 'subtle',
    size: 'sm',
  },
)

const colorVariantClasses: Record<string, Record<string, string>> = {
  primary: {
    solid: 'bg-green-500 text-white',
    subtle: 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-200',
    outline: 'text-green-700 ring-1 ring-inset ring-green-300',
  },
  neutral: {
    solid: 'bg-slate-700 text-white',
    subtle: 'bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200',
    outline: 'text-slate-600 ring-1 ring-inset ring-slate-300',
  },
}

const classes = computed(() => colorVariantClasses[props.color][props.variant])
</script>

<template>
  <span
    class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
    :class="classes"
  >
    <slot />
  </span>
</template>
