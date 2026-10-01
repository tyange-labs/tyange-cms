<script setup lang="ts">
import { ArrowDown, ArrowUp, ImageUp, Plus, Trash, X } from 'lucide-vue-next'
import imageCompression from 'browser-image-compression'
import type { PortfolioPdfField } from '~/utils/portfolio-pdf-schema'
import { emptyItem } from '~/utils/portfolio-pdf-schema'
import type { CMSResponse } from '~/types/response.types'
import { authenticatedFetch } from '~/composables/useAuthenticatedApi'

// 스키마(utils/portfolio-pdf-schema.ts)대로 폼을 그리는 재귀 컴포넌트. 문서 객체를 직접 수정한다.
// 문자열 목록은 textarea+줄바꿈 split 대신 입력칸 목록으로 둔다 — 포트폴리오 편집기에서
// 마지막 줄 Enter가 씹히던 문제를 구조적으로 피하려는 선택이다.
const props = defineProps<{ fields: PortfolioPdfField[] }>()
const model = defineModel<Record<string, any>>({ required: true })

const config = useRuntimeConfig()
const uploading = ref<string | null>(null)
const uploadError = ref('')

function ensureArray(key: string): any[] {
  if (!Array.isArray(model.value[key])) model.value[key] = []
  return model.value[key]
}

function move(list: any[], index: number, delta: number) {
  const target = index + delta
  if (target < 0 || target >= list.length) return
  const [item] = list.splice(index, 1)
  list.splice(target, 0, item)
}

async function upload(key: string, event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  uploading.value = key
  uploadError.value = ''
  try {
    const compressed = await imageCompression(file, {
      maxSizeMB: 1,
      maxWidthOrHeight: 1600,
      useWebWorker: true,
    })
    const formData = new FormData()
    formData.append('file', compressed)
    const res = await authenticatedFetch<CMSResponse<{ image_path: string }>>(
      '/api/post/upload-image?id=portfolio_pdf',
      {
        method: 'POST',
        body: formData,
      },
    )
    if (!res.data?.image_path) throw new Error('이미지 업로드 응답이 비어 있습니다.')
    model.value[key] = `${config.public.tyangeCmsApiBaseProd}${res.data.image_path}`
  } catch (error) {
    uploadError.value = error instanceof Error ? error.message : '이미지 업로드에 실패했습니다.'
  } finally {
    uploading.value = null
  }
}
</script>

<template>
  <div class="space-y-3">
    <template v-for="field in props.fields" :key="field.key">
      <UiFormField v-if="field.type === 'text'" :label="field.label">
        <UiInput v-model="model[field.key]" />
      </UiFormField>

      <UiFormField v-else-if="field.type === 'textarea'" :label="field.label">
        <UiTextarea v-model="model[field.key]" :rows="4" />
      </UiFormField>

      <div v-else-if="field.type === 'image'" class="space-y-1">
        <span class="block text-sm font-medium">{{ field.label }}</span>
        <div class="flex gap-2">
          <UiInput v-model="model[field.key]" placeholder="이미지 URL" />
          <label
            class="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-md bg-slate-100 px-3 text-sm text-slate-700 hover:bg-slate-200"
          >
            <ImageUp class="size-4" />
            {{ uploading === field.key ? '올리는 중…' : '업로드' }}
            <input
              type="file"
              accept="image/*"
              class="hidden"
              @change="upload(field.key, $event)"
            />
          </label>
        </div>
        <img
          v-if="model[field.key]"
          :src="model[field.key]"
          alt=""
          class="mt-1 h-16 rounded border border-default object-cover"
        />
      </div>

      <div v-else-if="field.type === 'strings'" class="space-y-1">
        <span class="block text-sm font-medium">{{ field.label }}</span>
        <div v-for="(_, i) in ensureArray(field.key)" :key="i" class="flex gap-1">
          <UiInput v-model="model[field.key][i]" />
          <UiButton
            color="neutral"
            variant="ghost"
            :icon="X"
            aria-label="삭제"
            @click="model[field.key].splice(i, 1)"
          />
        </div>
        <UiButton
          color="neutral"
          variant="soft"
          size="sm"
          :icon="Plus"
          @click="ensureArray(field.key).push('')"
          >추가</UiButton
        >
      </div>

      <div
        v-else-if="field.type === 'object'"
        class="space-y-2 rounded-md border border-default p-3"
      >
        <span class="block text-sm font-semibold">{{ field.label }}</span>
        <PortfolioPdfFieldEditor v-model="model[field.key]" :fields="field.fields" />
      </div>

      <div v-else-if="field.type === 'list'" class="space-y-2">
        <span class="block text-sm font-semibold">{{ field.label }}</span>
        <div
          v-for="(_, i) in ensureArray(field.key)"
          :key="i"
          class="space-y-2 rounded-md border border-default bg-elevated/40 p-3"
        >
          <div class="flex items-center justify-between">
            <span class="text-xs text-muted">{{ field.itemLabel }} {{ i + 1 }}</span>
            <div class="flex">
              <UiButton
                color="neutral"
                variant="ghost"
                size="sm"
                :icon="ArrowUp"
                aria-label="위로"
                :disabled="i === 0"
                @click="move(model[field.key], i, -1)"
              />
              <UiButton
                color="neutral"
                variant="ghost"
                size="sm"
                :icon="ArrowDown"
                aria-label="아래로"
                :disabled="i === model[field.key].length - 1"
                @click="move(model[field.key], i, 1)"
              />
              <UiButton
                color="error"
                variant="ghost"
                size="sm"
                :icon="Trash"
                aria-label="삭제"
                @click="model[field.key].splice(i, 1)"
              />
            </div>
          </div>
          <PortfolioPdfFieldEditor v-model="model[field.key][i]" :fields="field.item" />
        </div>
        <UiButton
          color="neutral"
          variant="soft"
          size="sm"
          :icon="Plus"
          @click="ensureArray(field.key).push(emptyItem(field.item))"
        >
          {{ field.itemLabel }} 추가
        </UiButton>
      </div>
    </template>
    <p v-if="uploadError" class="text-sm text-red-600">{{ uploadError }}</p>
  </div>
</template>
