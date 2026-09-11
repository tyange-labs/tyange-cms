<script setup lang="ts">
import { Menu } from 'lucide-vue-next'
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuRoot,
  DropdownMenuTrigger,
} from 'reka-ui'

defineProps<{
  items: Array<{ label: string; to: string; active?: boolean }>
}>()
</script>

<template>
  <!-- md 이상: 한 줄로 펼친 인라인 nav -->
  <nav class="hidden shrink-0 items-center gap-1 md:flex">
    <NuxtLink
      v-for="item in items"
      :key="item.to"
      :to="item.to"
      class="shrink-0 rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors"
      :class="
        item.active ? 'bg-elevated text-default' : 'text-muted hover:bg-elevated hover:text-default'
      "
    >
      {{ item.label }}
    </NuxtLink>
  </nav>

  <!-- md 미만: 햄버거 트리거 + 오버레이 -->
  <DropdownMenuRoot>
    <DropdownMenuTrigger
      class="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted transition-colors outline-none hover:bg-elevated hover:text-default md:hidden"
      aria-label="메뉴 열기"
    >
      <Menu class="size-4.5" />
    </DropdownMenuTrigger>
    <DropdownMenuPortal>
      <DropdownMenuContent
        class="z-50 min-w-40 overflow-hidden rounded-md border border-default bg-white p-1 shadow-lg"
        align="start"
        :side-offset="8"
      >
        <DropdownMenuItem v-for="item in items" :key="item.to" as-child>
          <NuxtLink
            :to="item.to"
            class="block cursor-pointer rounded px-2.5 py-2 text-sm outline-none select-none data-[highlighted]:bg-elevated"
            :class="item.active ? 'font-medium text-default' : 'text-muted'"
          >
            {{ item.label }}
          </NuxtLink>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenuPortal>
  </DropdownMenuRoot>
</template>
