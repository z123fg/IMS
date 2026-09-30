import { PRESET_TYPES, type Interview } from './types'

export type SortKey = 'client' | 'vendor' | 'interviewee' | 'interviewer' | 'interview_type' | 'received_at' | 'interview_at'
/** 有搜索词时可按相关度排序 */
export type SortOption = SortKey | 'relevance'
export type SortDir = 'asc' | 'desc'
export type When = 'all' | 'upcoming' | 'past'

export type ListFilters = {
  types: string[]
  when: When
  sort: SortOption
  dir: SortDir
  /** 搜索命中的相关度（id → 分数）；提供时只保留命中的行 */
  rank?: Map<string, number>
}

type Filterable = Pick<
  Interview,
  'id' | 'client' | 'vendor' | 'interviewee' | 'interviewer' | 'interview_type' | 'received_at' | 'interview_at' | 'created_at'
>

const collator = new Intl.Collator('zh-CN', { numeric: true, sensitivity: 'base' })

function sortValue(row: Filterable, key: SortKey): string | number | null {
  switch (key) {
    case 'interview_at':
      return row.interview_at ? Date.parse(row.interview_at) : null
    case 'received_at':
      return row.received_at || null
    default: {
      const v = row[key].trim()
      return v === '' ? null : v
    }
  }
}

function compareValues(a: string | number, b: string | number, key: SortKey) {
  if (typeof a === 'number' && typeof b === 'number') return a - b
  // received_at 是 YYYY-MM-DD，直接按字符串比较即为时间顺序
  if (key === 'received_at') return a < b ? -1 : a > b ? 1 : 0
  return collator.compare(String(a), String(b))
}

export function applyFilters<T extends Filterable>(rows: T[], f: ListFilters, now = Date.now()): T[] {
  const types = new Set(f.types)
  const rank = f.rank

  const filtered = rows.filter((r) => {
    if (rank && !rank.has(r.id)) return false
    if (types.size > 0 && !types.has(r.interview_type)) return false
    if (f.when !== 'all') {
      if (!r.interview_at) return false
      const upcoming = Date.parse(r.interview_at) >= now
      if (upcoming !== (f.when === 'upcoming')) return false
    }
    return true
  })

  if (f.sort === 'relevance') {
    const score = (r: T) => rank?.get(r.id) ?? 0
    return [...filtered].sort((a, b) => score(b) - score(a) || b.created_at.localeCompare(a.created_at))
  }
  const sortKey = f.sort
  const sign = f.dir === 'asc' ? 1 : -1
  return filtered
    .map((row) => ({ row, v: sortValue(row, sortKey) }))
    .sort((a, b) => {
      // 空值无论升降序都排在最后；平局按创建时间新→旧，保证顺序稳定
      if (a.v === null || b.v === null) {
        if (a.v !== b.v) return a.v === null ? 1 : -1
      } else {
        const c = compareValues(a.v, b.v, sortKey)
        if (c !== 0) return sign * c
      }
      return b.row.created_at.localeCompare(a.row.created_at)
    })
    .map((x) => x.row)
}

/** 某文本列已有的值（去重），出现次数多的在前；用于自动补全 */
export function valueOptions(rows: Filterable[], key: 'client' | 'vendor' | 'interviewee' | 'interviewer'): string[] {
  const counts = new Map<string, number>()
  for (const r of rows) {
    const v = r[key].trim()
    if (v) counts.set(v, (counts.get(v) ?? 0) + 1)
  }
  return [...counts].sort((a, b) => b[1] - a[1] || collator.compare(a[0], b[0])).map(([v]) => v)
}

/** 预置环节在前（保持预置顺序），库中出现过的自定义值按字母序在后 */
export function typeOptions(rows: Pick<Interview, 'interview_type'>[]): string[] {
  const preset = new Set(PRESET_TYPES)
  const custom = new Set<string>()
  for (const r of rows) {
    const t = r.interview_type.trim()
    if (t && !preset.has(t)) custom.add(t)
  }
  return [...PRESET_TYPES, ...[...custom].sort(collator.compare)]
}
