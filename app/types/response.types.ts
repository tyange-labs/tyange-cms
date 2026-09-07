export interface AuthResponse {
  access_token: string
  user_role: 'admin' | 'user'
}

export interface CMSResponse<T> {
  status: boolean
  data: T | null
  message: string | null
}
