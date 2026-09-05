<script setup lang="ts">
import { Clock } from 'lucide-vue-next'
</script>

<template>
  <div data-testid="not-ready-yet" class="flex flex-1 flex-col items-center justify-center gap-5">
    <div>
      <Clock :size="50" />
    </div>
    <h1>아직 준비 중입니다</h1>
  </div>
</template>

<style scoped></style>
