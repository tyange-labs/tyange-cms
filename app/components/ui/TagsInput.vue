<script setup lang="ts">
import { X } from 'lucide-vue-next'
import {
  TagsInputInput,
  TagsInputItem,
  TagsInputItemDelete,
  TagsInputItemText,
  TagsInputRoot,
} from 'reka-ui'
import { useAttrs } from 'vue'

defineOptions({ inheritAttrs: false })

withDefaults(
  defineProps<{
    placeholder?: string
  }>(),
  {
    placeholder: undefined,
  },
)

const model = defineModel<string[]>({ default: () => [] })
const attrs = useAttrs()
</script>

<template>
  <TagsInputRoot
    v-model="model"
    v-bind="attrs"
    class="flex w-full flex-wrap items-center gap-1.5 rounded-md border border-default bg-default px-2 py-1.5 focus-within:ring-2 focus-within:ring-primary"
  >
    <TagsInputItem
      v-for="item in model"
      :key="item"
      :value="item"
      class="flex items-center gap-1 rounded-full bg-elevated px-2 py-0.5 text-xs font-medium text-default"
    >
      <TagsInputItemText />
      <TagsInputItemDelete class="text-muted hover:text-default">
        <X class="size-3" />
      </TagsInputItemDelete>
    </TagsInputItem>

    <TagsInputInput
      :placeholder="model.length ? '' : placeholder"
      class="min-w-24 flex-1 bg-transparent text-sm text-default placeholder:text-muted outline-none"
    />
  </TagsInputRoot>
</template>
