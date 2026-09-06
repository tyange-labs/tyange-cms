<script setup lang="ts">
import { Check } from 'lucide-vue-next'
import { ToastPortal, ToastProvider, ToastRoot, ToastTitle, ToastViewport } from 'reka-ui'
import { useToast } from '~/composables/useToast'

const { toasts } = useToast()
</script>

<template>
  <ToastProvider>
    <!-- open을 항상 true로 고정해 ToastRoot 자체의 duration 타이머는 쓰지 않는다 —
         실제 표시 시간은 useToast()가 배열에서 빼는 시점(setTimeout)이 결정하고,
         이 컴포넌트는 그 배열 변화에 맞춰 나타나고 사라지는 애니메이션만 담당한다. -->
    <TransitionGroup name="toast">
      <ToastRoot
        v-for="toast in toasts"
        :key="toast.id"
        :open="true"
        class="toast-item flex items-center gap-2 rounded-lg border border-default bg-default px-3.5 py-2.5 text-sm text-default shadow-lg"
      >
        <Check class="size-4 shrink-0 text-primary" />
        <ToastTitle>{{ toast.title }}</ToastTitle>
      </ToastRoot>
    </TransitionGroup>

    <ToastPortal>
      <ToastViewport
        class="fixed right-4 bottom-4 z-50 flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2 outline-none"
      />
    </ToastPortal>
  </ToastProvider>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(4px);
}

/* 남은 토스트가 자리를 옮길 때도 순간이동 대신 자연스럽게 움직이게 한다. */
.toast-move {
  transition: transform 0.15s ease;
}
</style>
