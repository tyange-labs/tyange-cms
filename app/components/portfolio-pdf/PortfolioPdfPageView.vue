<script setup lang="ts">
import type { PortfolioPdfPage, PortfolioPdfTheme } from '~/types/portfolio-pdf.types'
import '~/assets/css/portfolio-pdf.css'

// 페이지 하나를 1920×1080 CSS px로 렌더링한다. 편집기 미리보기와 인쇄 화면이 같은 컴포넌트를
// 쓰므로 화면에서 본 것이 그대로 PDF가 된다. 템플릿을 추가하면 utils/portfolio-pdf-schema.ts에도 더한다.
const props = defineProps<{
  page: PortfolioPdfPage
  index: number
  total: number
  theme: PortfolioPdfTheme
}>()

const d = computed(() => props.page.data ?? {})
const list = (value: unknown): any[] => (Array.isArray(value) ? value : [])
const text = (value: unknown) => (typeof value === 'string' ? value : '')

const pageNumber = computed(
  () => `${String(props.index + 1).padStart(2, '0')} / ${String(props.total).padStart(2, '0')}`,
)

const style = computed(() => ({
  '--rs-accent': props.theme.accent || '#1f4fd8',
  '--rs-accent-dark': props.theme.accent_dark || '#7da2ff',
}))

// ---- timeline: YYYY-MM 문자열을 월 단위 눈금으로 바꿔 막대 위치를 계산한다 ----
const TRACK_WIDTH = 1104 // 1664(콘텐츠 폭) - 560(라벨 열)

function monthIndex(value: string): number | null {
  const m = /^(\d{4})-(\d{1,2})$/.exec(value.trim())
  return m ? Number(m[1]) * 12 + (Number(m[2]) - 1) : null
}

const timeline = computed(() => {
  const now = new Date()
  const nowIndex = now.getFullYear() * 12 + now.getMonth()
  const rows = list(d.value.rows).map((row) => {
    const start = monthIndex(text(row.start))
    const endRaw = text(row.end).trim()
    const end = endRaw ? monthIndex(endRaw) : nowIndex
    return { row, start, end, current: !endRaw }
  })
  const valid = rows.filter((r) => r.start !== null && r.end !== null)
  if (!valid.length) return { rows: [], years: [] as { year: number; left: number }[] }

  const min = Math.min(...valid.map((r) => r.start as number)) - 1
  const max = Math.max(...valid.map((r) => r.end as number)) + 3
  const scale = TRACK_WIDTH / (max - min)
  const years: { year: number; left: number }[] = []
  for (let y = Math.floor(min / 12) + 1; y * 12 <= max; y++) {
    const left = (y * 12 - min) * scale
    // 오른쪽 끝에 걸려 눈금 글자가 트랙 밖으로 나가는 해는 그리지 않는다.
    if (left < TRACK_WIDTH - 70) years.push({ year: y, left })
  }
  return {
    years,
    rows: rows.map((r) => ({
      ...r.row,
      left: r.start === null ? 0 : (r.start - min) * scale,
      width: r.start === null || r.end === null ? 0 : Math.max((r.end - r.start + 1) * scale, 24),
      current: r.current,
      period: `${text(r.row.start).replace('-', '.')} - ${r.current ? 'NOW' : text(r.row.end).replace('-', '.')}`,
    })),
  }
})
</script>

<template>
  <section class="rs-page" :class="{ 'rs-dark': page.dark }" :style="style">
    <div class="rs-label rs-mono">{{ text(d.label) }}</div>

    <!-- cover -->
    <template v-if="page.template === 'cover'">
      <div class="rs-cover-name">{{ text(d.name) }}</div>
      <div class="rs-cover-role rs-mono">{{ text(d.role) }}</div>
      <p class="rs-cover-intro rs-pre">{{ text(d.intro) }}</p>
    </template>

    <!-- timeline -->
    <template v-else-if="page.template === 'timeline'">
      <h1>{{ text(d.title) }}</h1>
      <div class="rs-tl">
        <div class="rs-tl-axis">
          <span
            v-for="y in timeline.years"
            :key="y.year"
            class="rs-tl-year rs-mono"
            :style="{ left: `${y.left + 8}px` }"
            >{{ y.year }}</span
          >
        </div>
        <div class="rs-tl-grid">
          <i v-for="y in timeline.years" :key="y.year" :style="{ left: `${y.left}px` }" />
        </div>
        <div class="rs-tl-rows">
          <div v-for="(row, i) in timeline.rows" :key="i" class="rs-tl-row">
            <div>
              <h3>
                {{ text(row.company) }}
                <span class="rs-muted" style="font-weight: 500; font-size: 24px">{{
                  text(row.role)
                }}</span>
              </h3>
              <div class="rs-muted rs-sm rs-mono">{{ row.period }}</div>
              <div class="rs-sm">{{ text(row.desc) }}</div>
            </div>
            <div class="rs-tl-track">
              <div
                class="rs-tl-bar"
                :class="{ 'rs-now': row.current }"
                :style="{ left: `${row.left}px`, width: `${row.width}px` }"
              />
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- compare -->
    <template v-else-if="page.template === 'compare'">
      <h1>{{ text(d.title) }}</h1>
      <p v-if="text(d.subtitle)" class="rs-sub">{{ text(d.subtitle) }}</p>
      <div class="rs-body">
        <div class="rs-cmp">
          <template v-for="(row, i) in list(d.rows)" :key="i">
            <div class="rs-co rs-mono">{{ text(row.tag) }}</div>
            <div class="rs-card rs-sm">{{ text(row.from) }}</div>
            <div class="rs-row-arrow">→</div>
            <div class="rs-card rs-ink rs-sm">
              <b>{{ text(row.to) }}</b
              ><span v-if="text(row.note)" class="rs-muted">{{ text(row.note) }}</span>
            </div>
          </template>
        </div>
      </div>
    </template>

    <!-- cards -->
    <template v-else-if="page.template === 'cards'">
      <h1>{{ text(d.title) }}</h1>
      <p v-if="text(d.subtitle)" class="rs-sub">{{ text(d.subtitle) }}</p>
      <div class="rs-body">
        <div class="rs-cards">
          <div v-for="(c, i) in list(d.cards)" :key="i" class="rs-card">
            <div class="rs-accent rs-sm rs-mono">{{ text(c.tag) }}</div>
            <p class="rs-sm rs-pre" style="margin-top: 8px">{{ text(c.body) }}</p>
            <p v-if="text(c.sub)" class="rs-sm rs-accent rs-mono" style="margin-top: 12px">
              {{ text(c.sub) }}
            </p>
          </div>
        </div>
      </div>
    </template>

    <!-- layers -->
    <template v-else-if="page.template === 'layers'">
      <h1>{{ text(d.title) }}</h1>
      <p v-if="text(d.subtitle)" class="rs-sub">{{ text(d.subtitle) }}</p>
      <div class="rs-body">
        <div class="rs-layers">
          <div v-for="(r, i) in list(d.rows)" :key="i" class="rs-layer">
            <b>{{ text(r.key) }}</b>
            <span>{{ text(r.text) }}</span>
            <div class="rs-co rs-mono">{{ text(r.tag) }}</div>
          </div>
        </div>
      </div>
    </template>

    <!-- hub -->
    <template v-else-if="page.template === 'hub'">
      <h1>{{ text(d.title) }}</h1>
      <p v-if="text(d.subtitle)" class="rs-sub">{{ text(d.subtitle) }}</p>
      <div class="rs-body">
        <div class="rs-hub">
          <div class="rs-card">
            <div class="rs-accent rs-sm rs-mono">{{ text(d.source?.tag) }}</div>
            <h3>{{ text(d.source?.title) }}</h3>
            <div class="rs-sm rs-muted">{{ text(d.source?.desc) }}</div>
          </div>
          <div class="rs-row-arrow">→</div>
          <div class="rs-hub-center">
            <div class="rs-card rs-hubcard">
              <div class="rs-accent rs-sm rs-mono">{{ text(d.hub?.tag) }}</div>
              <h2>{{ text(d.hub?.title) }}</h2>
              <div
                v-for="(line, i) in list(d.hub?.lines)"
                :key="i"
                class="rs-sm"
                :class="{ 'rs-muted': i > 0 }"
                style="margin-top: 10px"
              >
                {{ line }}
              </div>
            </div>
            <div v-if="text(d.footer)" class="rs-hub-foot rs-sm">{{ text(d.footer) }}</div>
          </div>
          <div class="rs-row-arrow">→</div>
          <div class="rs-hub-targets">
            <div
              v-for="(t, i) in list(d.targets)"
              :key="i"
              class="rs-card"
              style="padding: 12px 22px"
            >
              <div class="rs-accent rs-sm rs-mono">{{ text(t.tag) }}</div>
              <div class="rs-sm">
                <b>{{ text(t.title) }}</b> <span class="rs-muted">{{ text(t.desc) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- showcase -->
    <template v-else-if="page.template === 'showcase'">
      <h1>{{ text(d.title) }}</h1>
      <div class="rs-show">
        <div class="rs-screens">
          <div v-for="(s, i) in list(d.screens)" :key="i" class="rs-screen">
            <div class="rs-thumb">
              <img v-if="text(s.image)" class="rs-img" :src="text(s.image)" alt="" />
            </div>
            <div>
              <div class="rs-accent rs-sm rs-mono">{{ text(s.tag) }}</div>
              <h3>{{ text(s.title) }}</h3>
              <p class="rs-sm">{{ text(s.desc) }}</p>
            </div>
          </div>
        </div>
        <div class="rs-card rs-feature">
          <div class="rs-accent rs-sm rs-mono">{{ text(d.feature?.tag) }}</div>
          <h3>{{ text(d.feature?.title) }}</h3>
          <p class="rs-sm rs-pre" style="margin-top: 6px">{{ text(d.feature?.desc) }}</p>
          <div class="rs-phones">
            <div v-for="(src, i) in list(d.feature?.images)" :key="i" class="rs-phone">
              <img :src="text(src)" alt="" />
            </div>
          </div>
        </div>
      </div>
      <p v-if="text(d.note)" class="rs-sm rs-muted" style="margin-top: auto">{{ text(d.note) }}</p>
    </template>

    <!-- project -->
    <template v-else-if="page.template === 'project'">
      <h1>{{ text(d.title) }}</h1>
      <div class="rs-proj">
        <div>
          <p class="rs-sm rs-pre">{{ text(d.intro) }}</p>
          <div class="rs-two">
            <div
              v-for="(m, i) in list(d.modes)"
              :key="i"
              class="rs-card rs-sm"
              style="padding: 16px 20px"
            >
              <div class="rs-accent rs-mono">{{ text(m.tag) }}</div>
              {{ text(m.desc) }}
            </div>
          </div>
          <div v-if="text(d.note)" class="rs-note">
            <p class="rs-sm rs-pre">
              <b v-if="text(d.note_title)">{{ text(d.note_title) }} — </b>{{ text(d.note) }}
            </p>
          </div>
        </div>
        <div class="rs-shot">
          <img v-if="text(d.image)" class="rs-img" :src="text(d.image)" alt="" />
        </div>
      </div>
      <div v-if="list(d.steps).length" style="margin-top: auto">
        <div v-if="text(d.steps_label)" class="rs-kicker">{{ text(d.steps_label) }}</div>
        <div class="rs-flow rs-sm">
          <template v-for="(s, i) in list(d.steps)" :key="i">
            <div v-if="i > 0" class="rs-sep">→</div>
            <div
              class="rs-node rs-card"
              :class="{ 'rs-ink': i === list(d.steps).length - 1 }"
              style="padding: 14px 20px"
            >
              <span class="rs-muted rs-mono">{{ text(s.tag) }}</span> {{ text(s.text) }}
            </div>
          </template>
        </div>
      </div>
    </template>

    <!-- skills -->
    <template v-else-if="page.template === 'skills'">
      <h1>{{ text(d.title) }}</h1>
      <div class="rs-skills">
        <div v-for="(c, i) in list(d.columns)" :key="i" class="rs-card">
          <div class="rs-accent rs-sm rs-mono">{{ text(c.tag) }}</div>
          <div class="rs-chips">
            <span v-for="(chip, j) in list(c.chips)" :key="j" class="rs-chip">{{ chip }}</span>
          </div>
          <p class="rs-sm rs-pre">{{ text(c.desc) }}</p>
        </div>
      </div>
      <div class="rs-notes">
        <div v-for="(n, i) in list(d.notes)" :key="i">
          <div class="rs-kicker">{{ text(n.title) }}</div>
          <p class="rs-sm">{{ text(n.text) }}</p>
        </div>
      </div>
    </template>

    <!-- closing -->
    <template v-else-if="page.template === 'closing'">
      <div class="rs-closing-title rs-pre">{{ text(d.title) }}</div>
      <div v-if="list(d.contacts).length" class="rs-contacts">
        <div v-for="(c, i) in list(d.contacts)" :key="i">
          <div class="rs-k rs-mono">{{ text(c.k) }}</div>
          {{ text(c.v) }}
        </div>
      </div>
    </template>

    <div class="rs-foot rs-mono">{{ pageNumber }}</div>
  </section>
</template>
