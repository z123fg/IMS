import dayjs, { type Dayjs } from 'dayjs'
import type { Lang } from '@/i18n'

export type RelativeTone = 'urgent' | 'future' | 'today' | 'past'
export type RelativeHint = { label: string; tone: RelativeTone }

/** 与语言无关的相对关系，再由各语言格式化 */
type Relation =
  | { kind: 'day'; days: number } // -2..2
  | { kind: 'week'; weeks: -1 | 0 | 1; weekday: number } // 上周 / 本周 / 下周 + 星期几
  | { kind: 'span'; unit: 'week' | 'month' | 'year'; n: number; future: boolean }

const DIGIT = ['零', '一', '两', '三', '四', '五', '六', '七', '八', '九', '十']
const ZH_WEEKDAY = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
const EN_WEEKDAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/** 口语化中文数字：2→两，11→十一，超过 19 用阿拉伯数字 */
export function cnNumber(n: number): string {
  if (n <= 10) return DIGIT[n]
  if (n < 20) return `十${DIGIT[n - 10].replace('两', '二')}`
  return String(n)
}

/** 以周一为一周开始 */
const weekStart = (d: Dayjs) => d.startOf('day').subtract((d.day() + 6) % 7, 'day')

function relate(d: Dayjs, now: Dayjs): Relation {
  const days = d.startOf('day').diff(now.startOf('day'), 'day')
  if (Math.abs(days) <= 2) return { kind: 'day', days }

  const weeks = Math.round(weekStart(d).diff(weekStart(now), 'day') / 7)
  if (Math.abs(weeks) <= 1) return { kind: 'week', weeks: weeks as -1 | 0 | 1, weekday: d.day() }

  const future = days > 0
  if (Math.abs(weeks) <= 4) return { kind: 'span', unit: 'week', n: Math.abs(weeks), future }
  // 更远按实际间隔四舍五入到月 / 年
  const years = Math.abs(d.diff(now, 'year'))
  if (years >= 1) return { kind: 'span', unit: 'year', n: years, future }
  const months = Math.max(1, Math.round(Math.abs(d.diff(now, 'month', true))))
  if (months >= 12) return { kind: 'span', unit: 'year', n: 1, future }
  return { kind: 'span', unit: 'month', n: months, future }
}

function formatZh(r: Relation): string {
  switch (r.kind) {
    case 'day':
      return { 0: '今天', 1: '明天', 2: '后天', [-1]: '昨天', [-2]: '前天' }[r.days]!
    case 'week':
      return `${{ [-1]: '上', 0: '本', 1: '下' }[r.weeks]}${ZH_WEEKDAY[r.weekday]}`
    case 'span': {
      const num = r.n === 1 ? '一' : cnNumber(r.n)
      const unit = { week: '周', month: '个月', year: '年' }[r.unit]
      return `${num}${unit}${r.future ? '后' : '前'}`
    }
  }
}

function formatEn(r: Relation): string {
  switch (r.kind) {
    case 'day':
      return { 0: 'Today', 1: 'Tomorrow', 2: 'In 2 days', [-1]: 'Yesterday', [-2]: '2 days ago' }[r.days]!
    case 'week':
      return `${{ [-1]: 'Last', 0: 'This', 1: 'Next' }[r.weeks]} ${EN_WEEKDAY[r.weekday]}`
    case 'span': {
      const unit = `${r.unit}${r.n === 1 ? '' : 's'}`
      return r.future ? `In ${r.n} ${unit}` : `${r.n} ${unit} ago`
    }
  }
}

/**
 * 相对日期提示（按日历日、自然周、自然月计算）：
 * 中文：今天 / 明天 / 后天 / 昨天 / 前天 / 本周五 / 下周一 / 上周三 / 两周后 / 三周前 / 两个月后 / 一年前 …
 * English: Today / Tomorrow / In 2 days / This Fri / Next Mon / Last Wed / In 2 weeks / 3 weeks ago …
 */
export function relativeHint(
  input: string | Dayjs | null,
  now: Dayjs = dayjs(),
  lang: Lang = 'zh',
): RelativeHint | null {
  if (!input) return null
  const d = dayjs(input)
  if (!d.isValid()) return null

  const days = d.startOf('day').diff(now.startOf('day'), 'day')
  const tone: RelativeTone = days === 0 ? 'today' : days === 1 ? 'urgent' : days > 0 ? 'future' : 'past'
  const r = relate(d, now)
  return { label: lang === 'zh' ? formatZh(r) : formatEn(r), tone }
}
