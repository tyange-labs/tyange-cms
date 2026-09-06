export interface ToastItem {
  id: number
  title: string
}

// 여러 컴포넌트(포트폴리오 에디터의 섹션별 저장 버튼 등)에서 공통으로 쓰는 토스트 큐.
// useState로 두면 이 페이지 안에서는 사실상 싱글턴이지만, Nuxt의 SSR 하이드레이션
// 규칙도 그대로 지킨다 — 실제로는 client-only 액션(저장 버튼 클릭)에서만 채워진다.
const toasts = () => useState<ToastItem[]>('ui-toasts', () => [])

let nextId = 0

export function useToast() {
  function push(title: string, duration = 2400) {
    const id = nextId++
    toasts().value.push({ id, title })

    setTimeout(() => {
      const list = toasts().value
      const index = list.findIndex((toast) => toast.id === id)
      if (index !== -1) {
        list.splice(index, 1)
      }
    }, duration)
  }

  return { toasts: toasts(), push }
}
