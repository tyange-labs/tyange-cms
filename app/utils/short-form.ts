import type { Tag } from '~/types/editor.types'

// lovelog(lovelog.tyange.com)의 짧은 글 규칙. lovelog의 src/lib/timeline.ts와 같은 값을
// 들고 있으니 기준일이나 글자 수를 바꾸면 두 곳을 함께 고친다.
export const SHORT_FORM_SINCE = '2026-09-23'
export const SHORT_FORM_LIMIT = 200

const LOVELOG_CATEGORY = 'general'
const LOVELOG_TAGS = new Set(['love', 'lovelog'])

export function isShortFormPost(tags: Tag[], publishedAt: string) {
  return (
    publishedAt >= SHORT_FORM_SINCE &&
    tags.some((t) => t.category === LOVELOG_CATEGORY && LOVELOG_TAGS.has(t.tag))
  )
}

// 마크다운 문법을 걷어낸 글자. lovelog가 짧은 글로 보여줄지 가를 때와 같은 방식으로 걷어낸다.
export function plainText(markdown: string) {
  return markdown
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^>\s?/gm, '')
    .replace(/^[-*+]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/[`*_~]/g, '')
    .trim()
}

export function plainLength(markdown: string) {
  return [...plainText(markdown)].length
}
