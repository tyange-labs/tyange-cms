<script setup lang="ts">
import { Check, Plus, X } from 'lucide-vue-next'
import {
  ComboboxAnchor,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  ComboboxItemIndicator,
  ComboboxPortal,
  ComboboxRoot,
  ComboboxViewport,
} from 'reka-ui'
import { computed, ref, useAttrs } from 'vue'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    items: string[]
    placeholder?: string
  }>(),
  {
    placeholder: undefined,
  },
)

const model = defineModel<string[]>({ default: () => [] })
const attrs = useAttrs()

const query = ref('')

const hasExactMatch = computed(() =>
  props.items.some((item) => item.toLowerCase() === query.value.trim().toLowerCase()),
)
const canCreate = computed(() => query.value.trim().length > 0 && !hasExactMatch.value)

function removeTag(tag: string) {
  model.value = model.value.filter((item) => item !== tag)
}
</script>

<template>
  <ComboboxRoot v-model="model" multiple class="w-full">
    <ComboboxAnchor
      v-bind="attrs"
      class="flex w-full flex-wrap items-center gap-1.5 rounded-md border border-default bg-default px-2 py-1.5 focus-within:ring-2 focus-within:ring-primary"
    >
      <span
        v-for="tag in model"
        :key="tag"
        class="inline-flex items-center gap-1 rounded-full bg-elevated px-2 py-0.5 text-xs font-medium text-default"
      >
        {{ tag }}
        <button type="button" class="text-muted hover:text-default" @click="removeTag(tag)">
          <X class="size-3" />
        </button>
      </span>
      <!-- resetSearchTermOnSelect(기본값 true) 덕분에 선택/생성 후 검색어가 자동으로 비워진다.
           예전 UInputMenu는 이게 안 돼서 DOM을 직접 만지는 우회 코드가 필요했다. -->
      <ComboboxInput
        v-model="query"
        :placeholder="model.length ? '' : placeholder"
        class="min-w-24 flex-1 bg-transparent text-sm text-default placeholder:text-muted outline-none"
      />
    </ComboboxAnchor>

    <ComboboxPortal>
      <ComboboxContent
        class="z-50 max-h-64 overflow-hidden rounded-md border border-default bg-white shadow-lg"
        position="popper"
        :side-offset="4"
      >
        <ComboboxViewport class="p-1">
          <ComboboxItem
            v-for="item in items"
            :key="item"
            :value="item"
            class="flex cursor-pointer select-none items-center justify-between rounded px-2 py-1.5 text-sm text-default outline-none data-[highlighted]:bg-elevated"
          >
            {{ item }}
            <ComboboxItemIndicator>
              <Check class="size-3.5 text-muted" />
            </ComboboxItemIndicator>
          </ComboboxItem>

          <ComboboxItem
            v-if="canCreate"
            :value="query.trim()"
            class="flex cursor-pointer select-none items-center gap-1.5 rounded px-2 py-1.5 text-sm text-primary outline-none data-[highlighted]:bg-elevated"
          >
            <Plus class="size-3.5" />
            "{{ query.trim() }}" 추가
          </ComboboxItem>
        </ComboboxViewport>
      </ComboboxContent>
    </ComboboxPortal>
  </ComboboxRoot>
</template>
