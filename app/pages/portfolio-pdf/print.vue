<script setup lang="ts">
import type { PortfolioPdfDocument } from '~/types/portfolio-pdf.types'
import { fetchPortfolioPdf } from '~/composables/usePortfolioPdf'

// 인쇄 전용 화면. 모든 페이지를 1920×1080으로 쌓아 두고 window.print()를 연다 —
// 대상에서 'PDF로 저장'을 고르면 페이지당 슬라이드 한 장짜리 PDF가 된다.
definePageMeta({ layout: false, middleware: ['auth'] })

const doc = ref<PortfolioPdfDocument | null>(null)
const error = ref('')
const print = () => window.print()

onMounted(async () => {
  try {
    doc.value = (await fetchPortfolioPdf()).doc
    await nextTick()
    await document.fonts.ready
    await Promise.all(
      Array.from(document.images).map((img) =>
        img.complete
          ? Promise.resolve()
          : new Promise((resolve) => {
              img.onload = img.onerror = resolve
            }),
      ),
    )
    if (!new URLSearchParams(location.search).has('noprint')) {
      window.print()
    }
  } catch {
    error.value = '포트폴리오 PDF를 불러오지 못했습니다.'
  }
})
</script>

<template>
  <div class="print-shell">
    <div class="print-bar">
      <b>PDF로 저장하려면</b> 인쇄 창에서 대상을 <b>PDF로 저장</b>, 여백 <b>없음</b>으로 두세요.
      <button type="button" @click="print">다시 인쇄</button>
    </div>
    <p v-if="error" class="print-error">{{ error }}</p>
    <div v-if="doc" class="print-root" data-testid="portfolio-pdf-print-root">
      <PortfolioPdfPageView
        v-for="(page, i) in doc.pages"
        :key="page.id"
        :page="page"
        :index="i"
        :total="doc.pages.length"
        :theme="doc.theme"
      />
    </div>
  </div>
</template>

<style>
@page {
  size: 1920px 1080px;
  margin: 0;
}
.print-shell {
  background: #888;
  min-height: 100vh;
}
.print-bar {
  position: sticky;
  top: 0;
  z-index: 10;
  background: #fff;
  padding: 10px 16px;
  font-size: 14px;
  display: flex;
  gap: 12px;
  align-items: center;
  border-bottom: 1px solid #ddd;
}
.print-bar button {
  border: 1px solid #ccc;
  border-radius: 6px;
  padding: 4px 10px;
}
.print-error {
  color: #fff;
  padding: 24px;
}
@media screen {
  .print-root {
    zoom: 0.4;
    display: grid;
    gap: 40px;
    justify-content: center;
    padding: 24px 0;
  }
}
@media print {
  .print-bar {
    display: none;
  }
  .print-shell {
    background: none;
  }
  .print-root .rs-page {
    break-after: page;
    break-inside: avoid;
  }
  .print-root .rs-page:last-child {
    break-after: auto;
  }
}
</style>
