export type ApiKeyRole = 'admin' | 'user'

export interface ApiKeyItem {
  api_key_id: number
  name: string
  role: ApiKeyRole
  /** `tyange` CLI가 쓰는 키의 앞부분(`tyk_` + 12자). 어떤 키인지 알아보는 용도다. */
  key_prefix: string
  created_at: string
  last_used_at: string | null
  revoked_at: string | null
}

export interface ApiKeyListResponse {
  keys: ApiKeyItem[]
}

export interface CreatedApiKey {
  api_key_id: number
  name: string
  role: ApiKeyRole
  /** 키 원문. 만든 직후 응답에서만 볼 수 있다(서버는 해시만 가진다). */
  key: string
  created_at: string
}
