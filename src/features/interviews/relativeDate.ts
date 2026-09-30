import dayjs, { type Dayjs } from 'dayjs'

export type RelativeTone = 'urgent' | 'future' | 'today' | 'past'
export type RelativeHint = { label: string; tone: RelativeTone }

const WEEKDAY = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
const DIGIT = ['零', '一', '两', '三', '四', '五', '六', '七', '八', '九', '十']

/** 口语化中文数字：2→两，11→十一，超过 19 用阿拉伯数字 */
export function cnNumber(n: number): string {
  if (n <= 10) return DIGIT[n]
  if (n < 20) return `十${n === 10 ? '' : DIGIT[n - 10].replace('两', '二')}`
  return String(n)
}

/** 以周一为一周开始 */
const weekStart = (d: Dayjs) => d.startOf('day').subtract((d.day() + 6) % 7, 'day')

/**
 * 相对日期提示：今天 / 明天 / 后天 / 昨天 / 前天 / 本周五 / 下周一 / 上周三 /
 * 两周后 / 三周前 / 两个月后 / 一年前 …（按日历日、自然周、自然月计算）
 */
export function relativeHint(input: string | Dayjs | null, now: Dayjs = dayjs()): RelativeHint | null {
  if (!input) return null
  const d = dayjs(input)
  if (!d.isValid()) return null

  const days = d.startOf('day').diff(now.startOf('day'), 'day')
  const future = days > 0
  const tone: RelativeTone = days === 0 ? 'today' : days === 1 ? 'urgent' : future ? 'future' : 'past'
  const suffix = future ? '后' : '前'

  if (days === 0) return { label: '今天', tone }
  if (Math.abs(days) <= 2) return { label: { 1: '明天', 2: '后天', [-1]: '昨天', [-2]: '前天' }[days]!, tone }

  const weeks = Math.round(weekStart(d).diff(weekStart(now), 'day') / 7)
  const weekday = WEEKDAY[d.day()]
  if (weeks === 0) return { label: `本${weekday}`, tone }
  if (weeks === 1) return { label: `下${weekday}`, tone }
  if (weeks === -1) return { label: `上${weekday}`, tone }

  if (Math.abs(weeks) <= 4) return { label: `${cnNumber(Math.abs(weeks))}周${suffix}`, tone }

  // 更远按实际间隔四舍五入到月 / 年
  const years = Math.abs(d.diff(now, 'year'))
  if (years >= 1) return { label: `${years === 1 ? '一' : cnNumber(years)}年${suffix}`, tone }
  const months = Math.max(1, Math.round(Math.abs(d.diff(now, 'month', true))))
  if (months >= 12) return { label: `一年${suffix}`, tone }
  return { label: `${months === 1 ? '一' : cnNumber(months)}个月${suffix}`, tone }
}
