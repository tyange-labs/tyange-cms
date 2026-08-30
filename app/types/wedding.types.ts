export interface WeddingGuest {
  guest_id: number
  name: string
  companions: number
  /** 방문 시간대의 시작 시각(24시간제). 시간대를 받기 전에 접수된 하객은 null이다. */
  visit_hour: number | null
  created_at: string
}

export interface WeddingGuestListResponse {
  guests: WeddingGuest[]
  total_guests: number
  total_attendees: number
}
