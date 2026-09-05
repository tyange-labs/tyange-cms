<script setup lang="ts">
import { nextTick, onMounted, useTemplateRef, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    rows?: number
    autoresize?: boolean
    placeholder?: string
  }>(),
  {
    rows: 3,
    autoresize: false,
    placeholder: undefined,
  },
)

const model = defineModel<string>()
const textareaRef = useTemplateRef('textareaRef')

function resize() {
  const el = textareaRef.value
  if (!el || !props.autoresize) {
    return
  }
  el.style.height = 'auto'
  el.style.height = `${el.scrollHeight}px`
}

watch(model, () => {
  if (props.autoresize) {
    nextTick(resize)
  }
})

onMounted(() => {
  if (props.autoresize) {
    resize()
  }
})
</script>

<template>
  <textarea
    ref="textareaRef"
    v-model="model"
    :rows="rows"
    :placeholder="placeholder"
    class="block w-full rounded-md border border-default bg-default px-2.5 py-1.5 text-sm text-default placeholder:text-muted outline-none focus:ring-2 focus:ring-primary"
    :class="autoresize ? 'resize-none overflow-hidden' : ''"
    @input="autoresize && resize()"
  />
</template>
