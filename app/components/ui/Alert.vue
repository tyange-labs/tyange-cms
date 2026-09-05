<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    color?: 'error' | 'success' | 'warning' | 'neutral'
    variant?: 'subtle' | 'soft'
    title?: string
    description?: string
  }>(),
  {
    color: 'neutral',
    variant: 'subtle',
    title: undefined,
    description: undefined,
  },
)

const colorVariantClasses: Record<string, Record<string, string>> = {
  error: {
    subtle: 'bg-red-50 text-red-800 ring-1 ring-inset ring-red-200',
    soft: 'bg-red-50 text-red-800',
  },
  success: {
    subtle: 'bg-green-50 text-green-800 ring-1 ring-inset ring-green-200',
    soft: 'bg-green-50 text-green-800',
  },
  warning: {
    subtle: 'bg-yellow-50 text-yellow-800 ring-1 ring-inset ring-yellow-200',
    soft: 'bg-yellow-50 text-yellow-800',
  },
  neutral: {
    subtle: 'bg-slate-50 text-slate-700 ring-1 ring-inset ring-slate-200',
    soft: 'bg-slate-50 text-slate-700',
  },
}

const classes = computed(() => colorVariantClasses[props.color][props.variant])
</script>

<template>
  <div class="rounded-lg p-4" :class="classes">
    <p v-if="title" class="text-sm font-medium">
      {{ title }}
    </p>
    <p v-if="description" class="text-sm" :class="title ? 'mt-1 opacity-90' : ''">
      {{ description }}
    </p>
  </div>
</template>
