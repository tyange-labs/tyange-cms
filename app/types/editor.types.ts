import type { POST_STATUS } from '~/constants/post-status.constant'

export interface Tag {
  tag: string
  category: string
}

export interface PostListItem {
  post_id: string
  title: string
  description: string
  published_at: string
  tags: Tag[]
  content: string
  status: POST_STATUS
  // /admin/posts 목록만 채우는 본문 앞부분(마크다운 원문, 최대 300자)
  excerpt?: string
}

export interface TagWithCategory {
  category: string
  tags: string[]
}
