<script setup lang="ts">
import type { Component } from 'vue'
import { LoaderCircle } from 'lucide-vue-next'
import { computed, useSlots } from 'vue'

const props = withDefaults(
  defineProps<{
    color?: 'primary' | 'neutral' | 'error'
    variant?: 'solid' | 'soft' | 'subtle' | 'ghost'
    size?: 'sm' | 'md' | 'xl'
    icon?: Component
    loading?: boolean
    disabled?: boolean
    block?: boolean
    to?: string
    type?: 'button' | 'submit'
  }>(),
  {
    color: 'primary',
    variant: 'solid',
    size: 'md',
    icon: undefined,
    loading: false,
    disabled: false,
    block: false,
    to: undefined,
    type: 'button',
  },
)

const slots = useSlots()
const hasLabel = computed(() => !!slots.default)

const colorVariantClasses: Record<string, Record<string, string>> = {
  primary: {
    solid: 'bg-green-500 text-white hover:bg-green-600 focus-visible:ring-green-500',
    soft: 'bg-green-50 text-green-700 hover:bg-green-100 focus-visible:ring-green-500',
    subtle:
      'bg-green-50 text-green-700 ring-1 ring-inset ring-green-200 hover:bg-green-100 focus-visible:ring-green-500',
    ghost: 'text-green-700 hover:bg-green-100 focus-visible:ring-green-500',
  },
  neutral: {
    solid: 'bg-slate-700 text-white hover:bg-slate-800 focus-visible:ring-slate-500',
    soft: 'bg-slate-100 text-slate-700 hover:bg-slate-200 focus-visible:ring-slate-500',
    subtle:
      'bg-slate-50 text-slate-700 ring-1 ring-inset ring-slate-200 hover:bg-slate-100 focus-visible:ring-slate-500',
    ghost: 'text-slate-600 hover:bg-slate-100 focus-visible:ring-slate-500',
  },
  error: {
    solid: 'bg-red-500 text-white hover:bg-red-600 focus-visible:ring-red-500',
    soft: 'bg-red-50 text-red-600 hover:bg-red-100 focus-visible:ring-red-500',
    subtle:
      'bg-red-50 text-red-600 ring-1 ring-inset ring-red-200 hover:bg-red-100 focus-visible:ring-red-500',
    ghost: 'text-red-600 hover:bg-red-100 focus-visible:ring-red-500',
  },
}

const sizeClasses: Record<string, { withLabel: string; iconOnly: string; icon: string }> = {
  sm: { withLabel: 'gap-1.5 px-2 py-1 text-xs', iconOnly: 'p-1', icon: 'size-3.5' },
  md: { withLabel: 'gap-1.5 px-2.5 py-1.5 text-sm', iconOnly: 'p-1.5', icon: 'size-4' },
  xl: { withLabel: 'gap-2 px-4 py-3 text-base', iconOnly: 'p-3', icon: 'size-5' },
}

const rootClasses = computed(() => [
  'inline-flex items-center justify-center rounded-md font-medium transition-colors',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
  'disabled:opacity-50 disabled:pointer-events-none',
  colorVariantClasses[props.color][props.variant],
  hasLabel.value ? sizeClasses[props.size].withLabel : sizeClasses[props.size].iconOnly,
  props.block ? 'w-full' : '',
])

const iconSizeClass = computed(() => sizeClasses[props.size].icon)
</script>

<template>
  <NuxtLink v-if="to" :to="to" :class="rootClasses">
    <LoaderCircle v-if="loading" class="animate-spin" :class="iconSizeClass" />
    <component :is="icon" v-else-if="icon" :class="iconSizeClass" />
    <slot />
  </NuxtLink>
  <button v-else :type="type" :disabled="disabled || loading" :class="rootClasses">
    <LoaderCircle v-if="loading" class="animate-spin" :class="iconSizeClass" />
    <component :is="icon" v-else-if="icon" :class="iconSizeClass" />
    <slot />
  </button>
</template>
