<script setup lang="ts">
import type { CMSResponse } from '~/types/response.types'
import type { WeddingGuest, WeddingGuestListResponse } from '~/types/wedding.types'
import { handleUnauthorizedError, useAuthHeaders } from '~/composables/useAuthenticatedApi'

definePageMeta({
  layout: 'default',
  middleware: ['auth'],
})

// 전시가 12시에 열고 5시에 닫는다. lovelog의 VISIT_HOURS, cms-api의 VISIT_HOUR_MIN/MAX와
// 같은 범위다. 전시 시간이 바뀌면 세 곳을 함께 고친다.
const VISIT_HOURS = [12, 13, 14, 15, 16]

const authHeaders = useAuthHeaders()

function getErrorMessage(error: unknown, fallback: string) {
  const fetchError = error as {
    data?: { message?: string } | string
    statusCode?: number
    statusMessage?: string
  }

  if (fetchError?.statusCode === 401) {
    return '로그인이 만료되었습니다. 다시 로그인해 주세요.'
  }

  if (fetchError?.statusCode === 403) {
    return '관리자만 하객 명단을 조회할 수 있습니다.'
  }

  if (typeof fetchError?.data === 'string' && fetchError.data) {
    return fetchError.data
  }

  if (fetchError?.data && typeof fetchError.data === 'object' && 'message' in fetchError.data && typeof fetchError.data.message === 'string') {
    return fetchError.data.message
  }

  if (fetchError?.statusMessage) {
    return fetchError.statusMessage
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return fallback
}

function toClock(hour24: number) {
  return hour24 > 12 ? hour24 - 12 : hour24
}

function visitHourLabel(hour: number) {
  return `${toClock(hour)}-${toClock(hour + 1)}시`
}

function headCount(guest: WeddingGuest) {
  return guest.companions + 1
}

// created_at은 SQLite의 CURRENT_TIMESTAMP라 UTC로 저장된다. 그대로 찍으면 9시간이 어긋나므로
// Z를 붙여 UTC로 읽은 뒤 서울 시각으로 옮겨 보여준다.
const seoulFormatter = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul',
  month: 'numeric',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

function formatReceivedAt(createdAt: string) {
  const parsed = new Date(`${createdAt.replace(' ', 'T')}Z`)

  if (Number.isNaN(parsed.getTime())) {
    return createdAt
  }

  return seoulFormatter.format(parsed)
}

const { data, refresh, status, error } = await useFetch<CMSResponse<WeddingGuestListResponse>>('/api/wedding-guests', {
  headers: authHeaders,
  credentials: 'include',
  server: false,
})

watch(error, async (value) => {
  if (value) {
    await handleUnauthorizedError(value)
  }
}, { immediate: true })

const guests = computed(() => data.value?.data?.guests ?? [])
const totalGuests = computed(() => data.value?.data?.total_guests ?? 0)
const totalAttendees = computed(() => data.value?.data?.total_attendees ?? 0)
const isLoading = computed(() => status.value === 'pending')
const loadErrorMessage = computed(() => error.value ? getErrorMessage(error.value, '하객 명단을 불러오지 못했습니다.') : '')

// 예상 밖의 시간대가 저장돼 있어도 조용히 사라지지 않도록 데이터에 있는 시각을 함께 모은다.
const breakdown = computed(() => {
  const hours = new Set<number>(VISIT_HOURS)

  for (const guest of guests.value) {
    if (guest.visit_hour !== null) {
      hours.add(guest.visit_hour)
    }
  }

  const rows = [...hours].sort((a, b) => a - b).map((hour) => {
    const matched = guests.value.filter(guest => guest.visit_hour === hour)

    return {
      key: String(hour),
      label: visitHourLabel(hour),
      groups: matched.length,
      attendees: matched.reduce((sum, guest) => sum + headCount(guest), 0),
    }
  })

  const undecided = guests.value.filter(guest => guest.visit_hour === null)

  if (undecided.length > 0) {
    rows.push({
      key: 'undecided',
      label: '시간 미정',
      groups: undecided.length,
      attendees: undecided.reduce((sum, guest) => sum + headCount(guest), 0),
    })
  }

  return rows
})

const busiestAttendees = computed(() =>
  breakdown.value.reduce((max, row) => Math.max(max, row.attendees), 0),
)

function barWidth(attendees: number) {
  if (busiestAttendees.value === 0) {
    return '0%'
  }

  return `${(attendees / busiestAttendees.value) * 100}%`
}
</script>

<template>
  <div data-testid="wedding-guests-page" class="space-y-6">
    <UAlert
      v-if="loadErrorMessage"
      color="error"
      variant="subtle"
      title="요청을 처리하지 못했습니다."
      :description="loadErrorMessage"
    />

    <template v-if="isLoading">
      <div class="grid grid-cols-2 gap-3">
        <USkeleton v-for="i in 2" :key="i" class="h-20" />
      </div>
      <USkeleton class="h-40" />
      <UCard v-for="i in 4" :key="i">
        <div class="space-y-2">
          <USkeleton class="h-5 w-1/3" />
          <USkeleton class="h-4 w-1/2" />
        </div>
      </UCard>
    </template>

    <template v-else-if="!loadErrorMessage && guests.length > 0">
      <div class="grid grid-cols-2 gap-3">
        <UCard>
          <p class="text-sm text-muted">
            신청 건수
          </p>
          <p class="text-2xl font-semibold">
            {{ totalGuests }}건
          </p>
        </UCard>
        <UCard>
          <p class="text-sm text-muted">
            총 인원 (동반 포함)
          </p>
          <p class="text-2xl font-semibold">
            {{ totalAttendees }}명
          </p>
        </UCard>
      </div>

      <UCard>
        <div class="flex items-center justify-between gap-3">
          <h2 class="font-semibold">
            시간대별 인원
          </h2>
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-lucide-refresh-cw"
            size="sm"
            @click="refresh()"
          >
            새로고침
          </UButton>
        </div>

        <ul class="mt-4 space-y-3">
          <li v-for="row in breakdown" :key="row.key" class="space-y-1">
            <div class="flex items-baseline justify-between gap-3 text-sm">
              <span class="font-medium">{{ row.label }}</span>
              <span class="text-muted">{{ row.attendees }}명 · {{ row.groups }}건</span>
            </div>
            <div class="h-2 rounded-full bg-elevated">
              <div class="h-2 rounded-full bg-primary" :style="{ width: barWidth(row.attendees) }" />
            </div>
          </li>
        </ul>
      </UCard>

      <div class="space-y-3">
        <h2 class="font-semibold">
          명단
        </h2>
        <UCard
          v-for="guest in guests"
          :key="guest.guest_id"
          :ui="{ body: 'flex items-center justify-between gap-4' }"
        >
          <div class="min-w-0 space-y-1">
            <p class="font-semibold truncate">
              {{ guest.name }}
            </p>
            <p class="text-xs text-muted">
              {{ formatReceivedAt(guest.created_at) }} 접수
            </p>
          </div>

          <div class="flex shrink-0 items-center gap-2">
            <UBadge v-if="guest.companions > 0" variant="subtle" size="sm">
              외 {{ guest.companions }}명
            </UBadge>
            <UBadge
              :variant="guest.visit_hour === null ? 'outline' : 'solid'"
              :color="guest.visit_hour === null ? 'neutral' : 'primary'"
              size="sm"
            >
              {{ guest.visit_hour === null ? '시간 미정' : visitHourLabel(guest.visit_hour) }}
            </UBadge>
          </div>
        </UCard>
      </div>
    </template>

    <UEmpty
      v-else-if="!loadErrorMessage"
      icon="i-lucide-users"
      label="아직 접수된 하객이 없습니다."
    />
  </div>
</template>
