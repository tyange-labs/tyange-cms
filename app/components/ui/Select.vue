<script setup lang="ts">
import { ChevronDown } from 'lucide-vue-next'
import {
  SelectContent,
  SelectIcon,
  SelectItem,
  SelectItemText,
  SelectPortal,
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectViewport,
} from 'reka-ui'
import { useAttrs } from 'vue'

defineOptions({ inheritAttrs: false })
defineProps<{
  items: string[]
}>()
const model = defineModel<string>()
const attrs = useAttrs()
</script>

<template>
  <SelectRoot v-model="model">
    <SelectTrigger
      v-bind="attrs"
      class="flex items-center justify-between gap-2 rounded-md border border-default bg-default px-2.5 py-1.5 text-sm text-default outline-none focus:ring-2 focus:ring-primary"
    >
      <SelectValue />
      <SelectIcon>
        <ChevronDown class="size-4 text-muted" />
      </SelectIcon>
    </SelectTrigger>
    <SelectPortal>
      <SelectContent
        class="z-50 overflow-hidden rounded-md border border-default bg-white shadow-lg"
        position="popper"
        :side-offset="4"
      >
        <SelectViewport class="p-1">
          <SelectItem
            v-for="item in items"
            :key="item"
            :value="item"
            class="cursor-pointer select-none rounded px-2 py-1.5 text-sm text-default outline-none data-[highlighted]:bg-elevated"
          >
            <SelectItemText>{{ item }}</SelectItemText>
          </SelectItem>
        </SelectViewport>
      </SelectContent>
    </SelectPortal>
  </SelectRoot>
</template>
