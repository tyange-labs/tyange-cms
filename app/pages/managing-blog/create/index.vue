<script setup lang="ts">
definePageMeta({
  layout: 'default',
  middleware: ['auth'],
})
</script>

<template>
  <Editor />
</template>

<style scoped></style>
