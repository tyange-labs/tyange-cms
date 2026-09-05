<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    type?: string
    size?: 'md' | 'xl'
    placeholder?: string
    autocomplete?: string
    disabled?: boolean
  }>(),
  {
    type: 'text',
    size: 'md',
    placeholder: undefined,
    autocomplete: undefined,
    disabled: false,
  },
)

const [model, modifiers] = defineModel<string | number>()

// v-model.number를 쓰는 호출부(PortfolioEditor의 version 필드)를 위해
// 네이티브 input이 아닌 커스텀 컴포넌트라 modifier를 직접 적용해줘야 한다.
const proxyModel = computed({
  get: () => model.value,
  set: (value) => (model.value = modifiers.number ? Number(value) : value),
})

const sizeClasses: Record<string, string> = {
  md: 'px-2.5 py-1.5 text-sm',
  xl: 'px-4 py-3 text-base',
}

const classes = computed(() => [
  'block w-full rounded-md border border-default bg-default text-default placeholder:text-muted',
  'outline-none focus:ring-2 focus:ring-primary',
  'disabled:opacity-50 disabled:pointer-events-none',
  sizeClasses[props.size],
])
</script>

<template>
  <input
    v-model="proxyModel"
    :type="type"
    :placeholder="placeholder"
    :autocomplete="autocomplete"
    :disabled="disabled"
    :class="classes"
  />
</template>
