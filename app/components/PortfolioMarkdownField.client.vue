<script setup lang="ts">
// 포트폴리오의 "글" 성격 필드(intro.content, project.body_markdown,
// company.career_items_markdown)를 편집하는 공용
// markdown 에디터. 블로그 포스트 에디터(Editor.client.vue)와 같은 md-editor-v3를
// 쓰지만, 여기 필드들은 짧은 문단/불릿 리스트라 이미지 업로드·표·수식·미리보기
// 전체화면 같은 무거운 툴바 항목은 뺐다.
//
// .client.vue인 이유는 Editor.client.vue와 동일 — md-editor-v3가 내부적으로
// CodeMirror를 쓰는데 SSR이 안 된다.
import type { ToolbarNames } from 'md-editor-v3'
import KO_KR from '@vavt/cm-extension/dist/locale/ko-KR'
import { config as MdEditorConfig, MdEditor } from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'

// Editor.client.vue와 같은 설정 — MdEditorConfig는 전역 설정이라 두 번 불러도
// 안전하다(멱등).
MdEditorConfig({
  editorConfig: {
    languageUserDefined: { 'ko-KR': KO_KR },
  },
})

const modelValue = defineModel<string>({ required: true })

withDefaults(
  defineProps<{
    placeholder?: string
  }>(),
  {
    placeholder: '',
  },
)

const toolbarsExclude: ToolbarNames[] = [
  'image',
  'table',
  'mermaid',
  'katex',
  'save',
  'pageFullscreen',
  'fullscreen',
  'htmlPreview',
  'catalog',
  'github',
  'sub',
  'sup',
]
</script>

<template>
  <MdEditor
    v-model="modelValue"
    language="ko-KR"
    :toolbars-exclude="toolbarsExclude"
    :placeholder="placeholder"
    :preview="false"
  />
</template>
