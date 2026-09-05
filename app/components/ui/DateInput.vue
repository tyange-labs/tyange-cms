<script setup lang="ts">
import type { CalendarDate } from '@internationalized/date'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import {
  DatePickerAnchor,
  DatePickerArrow,
  DatePickerCalendar,
  DatePickerCell,
  DatePickerCellTrigger,
  DatePickerContent,
  DatePickerField,
  DatePickerGrid,
  DatePickerGridBody,
  DatePickerGridHead,
  DatePickerGridRow,
  DatePickerHeadCell,
  DatePickerHeader,
  DatePickerHeading,
  DatePickerInput,
  DatePickerNext,
  DatePickerPrev,
  DatePickerRoot,
  DatePickerTrigger,
} from 'reka-ui'
import { useAttrs } from 'vue'

defineOptions({ inheritAttrs: false })
const model = defineModel<CalendarDate>()
const attrs = useAttrs()
</script>

<template>
  <DatePickerRoot v-model="model" granularity="day">
    <DatePickerAnchor
      v-bind="attrs"
      class="flex items-center gap-2 rounded-md border border-default bg-default px-2.5 py-1.5 text-sm text-default focus-within:ring-2 focus-within:ring-primary"
    >
      <DatePickerField v-slot="{ segments }" class="flex items-center gap-0.5">
        <template v-for="segment in segments" :key="segment.part">
          <DatePickerInput
            v-if="segment.part !== 'literal'"
            :part="segment.part"
            class="rounded px-0.5 text-center tabular-nums outline-none focus:bg-elevated"
          >
            {{ segment.value }}
          </DatePickerInput>
          <span v-else class="text-muted">{{ segment.value }}</span>
        </template>
      </DatePickerField>
      <DatePickerTrigger class="text-muted hover:text-default">
        <CalendarIcon class="size-4" />
      </DatePickerTrigger>
    </DatePickerAnchor>

    <DatePickerContent
      class="z-50 rounded-md border border-default bg-white p-3 shadow-lg"
      :side-offset="4"
    >
      <DatePickerCalendar v-slot="{ weekDays, grid }">
        <DatePickerHeader class="mb-2 flex items-center justify-between">
          <DatePickerPrev class="rounded p-1 hover:bg-elevated">
            <ChevronLeft class="size-4" />
          </DatePickerPrev>
          <DatePickerHeading class="text-sm font-medium" />
          <DatePickerNext class="rounded p-1 hover:bg-elevated">
            <ChevronRight class="size-4" />
          </DatePickerNext>
        </DatePickerHeader>
        <DatePickerGrid
          v-for="month in grid"
          :key="month.value.toString()"
          class="w-full border-collapse"
        >
          <DatePickerGridHead>
            <DatePickerGridRow class="flex">
              <DatePickerHeadCell
                v-for="day in weekDays"
                :key="day"
                class="w-9 text-center text-xs font-medium text-muted"
              >
                {{ day }}
              </DatePickerHeadCell>
            </DatePickerGridRow>
          </DatePickerGridHead>
          <DatePickerGridBody>
            <DatePickerGridRow
              v-for="(weekDates, index) in month.rows"
              :key="`week-${index}`"
              class="flex"
            >
              <DatePickerCell
                v-for="weekDate in weekDates"
                :key="weekDate.toString()"
                :date="weekDate"
              >
                <DatePickerCellTrigger
                  :day="weekDate"
                  :month="month.value"
                  class="flex size-9 items-center justify-center rounded text-sm hover:bg-elevated data-[selected]:bg-primary data-[selected]:text-white data-[today]:font-semibold data-[outside-view]:text-muted/50"
                />
              </DatePickerCell>
            </DatePickerGridRow>
          </DatePickerGridBody>
        </DatePickerGrid>
      </DatePickerCalendar>
      <DatePickerArrow class="fill-white" />
    </DatePickerContent>
  </DatePickerRoot>
</template>
