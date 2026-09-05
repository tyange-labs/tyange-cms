<script setup lang="ts">
import NotReadyYet from '~/components/NotReadyYet.vue'

definePageMeta({
  layout: 'default',
  middleware: ['auth'],
})
</script>

<template>
  <div data-testid="dashboard-page" class="flex flex-1">
    <NotReadyYet />
  </div>
</template>

<style scoped></style>
