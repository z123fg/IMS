import { describe, expect, it } from 'vitest'
import { applyFilters, typeOptions, valueOptions, type ListFilters } from './filter'

const base: ListFilters = { types: [], when: 'all', sort: 'received_at', dir: 'desc' }

function row(id: string, over: Partial<Record<string, string | null>> = {}) {
  return {
    id,
    client: '',
    vendor: '',
    interviewee: '',
    interviewer: '',
    interview_type: '',
    received_at: null as string | null,
    interview_at: null as string | null,
    created_at: '2026-01-01T00:00:00Z',
    ...over,
  } as {
    id: string
    client: string
    vendor: string
    interviewee: string
    interviewer: string
    interview_type: string
    received_at: string | null
    interview_at: string | null
    created_at: string
  }
}

const ids = (rows: { id: string }[]) => rows.map((r) => r.id)
const NOW = Date.parse('2026-09-30T12:00:00Z')

describe('applyFilters', () => {
  const rows = [
    row('a', { client: 'Acme', vendor: 'TekSystems', interview_type: 'HR', received_at: '2026-09-01', interview_at: '2026-10-02T09:00:00Z' }),
    row('b', { client: 'Globex', vendor: 'Randstad', interview_type: 'Technical', received_at: '2026-09-20', interview_at: '2026-09-25T09:00:00Z' }),
    row('c', { client: 'initech', vendor: 'acme staffing', interview_type: 'Technical', received_at: '2026-08-15' }),
    row('d', { client: '', vendor: '', received_at: null }),
  ]

  it('只保留搜索命中的行，并可按相关度排序', () => {
    const rank = new Map([['c', 9], ['a', 3]])
    expect(ids(applyFilters(rows, { ...base, rank }))).toEqual(['a', 'c'])
    expect(ids(applyFilters(rows, { ...base, rank, sort: 'relevance' }))).toEqual(['c', 'a'])
  })

  it('按面试类型过滤', () => {
    expect(ids(applyFilters(rows, { ...base, types: ['Technical'] }))).toEqual(['b', 'c'])
    expect(ids(applyFilters(rows, { ...base, types: ['HR', 'Final'] }))).toEqual(['a'])
  })

  it('即将到来 / 已过去；无面试时间的行两者都不包含', () => {
    expect(ids(applyFilters(rows, { ...base, when: 'upcoming' }, NOW))).toEqual(['a'])
    expect(ids(applyFilters(rows, { ...base, when: 'past' }, NOW))).toEqual(['b'])
  })

  it('按收到日期升降序，空值始终在最后', () => {
    expect(ids(applyFilters(rows, { ...base, sort: 'received_at', dir: 'desc' }))).toEqual(['b', 'a', 'c', 'd'])
    expect(ids(applyFilters(rows, { ...base, sort: 'received_at', dir: 'asc' }))).toEqual(['c', 'a', 'b', 'd'])
  })

  it('按面试时间排序，空值始终在最后', () => {
    expect(ids(applyFilters(rows, { ...base, sort: 'interview_at', dir: 'asc' }))).toEqual(['b', 'a', 'c', 'd'])
    expect(ids(applyFilters(rows, { ...base, sort: 'interview_at', dir: 'desc' }))).toEqual(['a', 'b', 'c', 'd'])
  })

  it('文本列按字母序（不区分大小写），空字符串视为空值', () => {
    expect(ids(applyFilters(rows, { ...base, sort: 'client', dir: 'asc' }))).toEqual(['a', 'b', 'c', 'd'])
    expect(ids(applyFilters(rows, { ...base, sort: 'client', dir: 'desc' }))).toEqual(['c', 'b', 'a', 'd'])
  })

  it('值相同时按创建时间新→旧', () => {
    const tie = [
      row('old', { client: 'X', created_at: '2026-01-01T00:00:00Z' }),
      row('new', { client: 'X', created_at: '2026-02-01T00:00:00Z' }),
    ]
    expect(ids(applyFilters(tie, { ...base, sort: 'client', dir: 'asc' }))).toEqual(['new', 'old'])
    expect(ids(applyFilters(tie, { ...base, sort: 'client', dir: 'desc' }))).toEqual(['new', 'old'])
  })

  it('不修改原数组', () => {
    const copy = [...rows]
    applyFilters(rows, { ...base, sort: 'client', dir: 'asc' })
    expect(rows).toEqual(copy)
  })
})

describe('typeOptions', () => {
  it('预置在前，自定义值去重排序在后', () => {
    const opts = typeOptions([
      { interview_type: 'Onsite' },
      { interview_type: 'HR' },
      { interview_type: ' Coding ' },
      { interview_type: 'Onsite' },
      { interview_type: '' },
    ])
    expect(opts).toEqual(['Screening', 'Technical', 'Managerial', 'HR', 'Final', 'Coding', 'Onsite'])
  })
})

describe('valueOptions', () => {
  it('去重、忽略空值，出现次数多的在前', () => {
    const r = [{ vendor: 'B' }, { vendor: 'A' }, { vendor: 'B ' }, { vendor: '' }, { vendor: 'C' }].map((x, i) =>
      row(String(i), x),
    )
    expect(valueOptions(r, 'vendor')).toEqual(['B', 'A', 'C'])
  })
})
