import MiniSearch from 'minisearch'
import { DOC_FIELDS, type DocField, type Interview } from '@/features/interviews/types'
import { docText } from './docText'
import { hanRuns, isHan, normalize, tokenize } from './tokenize'

// 本地全文搜索：BM25 相关度 + 英文前缀 / 拼写容错 + 短字段子串兜底。
// 以后要加语义检索（向量），在 search() 里与这里的结果做融合排序即可，调用方不变。

export const SHORT_FIELDS = ['client', 'vendor', 'interviewee', 'interviewer', 'interview_type'] as const
export type ShortField = (typeof SHORT_FIELDS)[number]
export type SearchField = ShortField | DocField

export const FIELD_LABEL: Record<SearchField, string> = {
  client: 'Client',
  vendor: 'Vendor',
  interviewee: '面试者',
  interviewer: '面试官',
  interview_type: '面试类型',
  jd: 'JD',
  materials: '材料',
  questions: '面试题',
}

export type SnippetPart = { text: string; hit: boolean }
export type Snippet = { field: DocField; parts: SnippetPart[]; count: number }

export type SearchHit = {
  score: number
  fields: SearchField[]
  /** 在原文中高亮用的词（小写）：命中的英文词 + 查询里的中文片段 */
  terms: string[]
  snippet: Snippet | null
}

type Indexed = Record<SearchField, string> & { id: string }

const BOOST: Record<SearchField, number> = {
  client: 3,
  vendor: 3,
  interviewee: 3,
  interviewer: 3,
  interview_type: 2,
  jd: 1,
  materials: 1,
  questions: 1.2,
}

const latin = (term: string) => !isHan(term)

function makeSnippet(text: string, terms: string[], field: DocField): Snippet | null {
  const lower = normalize(text)
  const ranges: [number, number][] = []
  for (const term of terms) {
    if (!term) continue
    for (let i = lower.indexOf(term); i !== -1; i = lower.indexOf(term, i + term.length)) ranges.push([i, i + term.length])
  }
  if (ranges.length === 0) return null
  ranges.sort((a, b) => a[0] - b[0] || b[1] - a[1])
  // 合并重叠的命中（如「首屏性能」与其中的「性能」），计数按合并后的处数
  const merged: [number, number][] = []
  for (const r of ranges) {
    const last = merged.at(-1)
    if (last && r[0] < last[1]) last[1] = Math.max(last[1], r[1])
    else merged.push([...r])
  }
  ranges.length = 0
  ranges.push(...merged)

  const [first] = ranges[0]
  let start = Math.max(0, first - 24)
  const end = Math.min(text.length, first + 80)
  // 不从片段中间的换行处开始
  const nl = text.lastIndexOf('\n', first)
  if (nl >= start) start = nl + 1

  const parts: SnippetPart[] = []
  let pos = start
  for (const [a, b] of ranges) {
    if (a < pos || a >= end) continue
    if (a > pos) parts.push({ text: text.slice(pos, a), hit: false })
    parts.push({ text: text.slice(a, Math.min(b, end)), hit: true })
    pos = Math.min(b, end)
  }
  if (pos < end) parts.push({ text: text.slice(pos, end), hit: false })
  const flat = parts.map((p) => ({ ...p, text: p.text.replace(/\s*\n\s*/g, ' · ') }))
  if (start > 0) flat.unshift({ text: '…', hit: false })
  if (end < text.length) flat.push({ text: '…', hit: false })
  return { field, parts: flat, count: ranges.length }
}

export function buildSearchIndex(rows: Interview[]) {
  const docs: Indexed[] = rows.map((r) => ({
    id: r.id,
    client: r.client,
    vendor: r.vendor,
    interviewee: r.interviewee,
    interviewer: r.interviewer,
    interview_type: r.interview_type,
    jd: docText(r.jd),
    materials: docText(r.materials),
    questions: docText(r.questions),
  }))
  const byId = new Map(docs.map((d) => [d.id, d]))

  const mini = new MiniSearch<Indexed>({
    fields: [...SHORT_FIELDS, ...DOC_FIELDS],
    tokenize,
    processTerm: (t) => t,
    searchOptions: {
      boost: BOOST,
      // 英文：≥2 个字母做前缀匹配；4 个字母允许 1 处拼写差异，≥5 个允许 2 处（含字母互换）。中文不做模糊
      prefix: (term) => latin(term) && term.length >= 2,
      fuzzy: (term) => (!latin(term) || term.length < 4 ? false : term.length === 4 ? 1 : 2),
    },
  })
  mini.addAll(docs)

  function search(query: string): Map<string, SearchHit> {
    const hits = new Map<string, SearchHit>()
    const q = normalize(query).trim()
    if (!q || tokenize(q).length === 0) return hits

    // 先要求所有词都命中；没有结果再放宽为任一词命中
    let results = mini.search(q, { combineWith: 'AND' })
    if (results.length === 0) results = mini.search(q, { combineWith: 'OR' })

    const han = hanRuns(q)
    for (const r of results) {
      const fields = new Set<SearchField>()
      for (const fs of Object.values(r.match)) for (const f of fs) fields.add(f as SearchField)
      // 英文取实际命中的词（含模糊 / 前缀命中）；中文取查询原文片段 + 命中的双字词（单字太泛，不高亮）
      const hanPairs = r.terms.filter((t) => isHan(t) && [...t].length === 2)
      const terms = [...new Set([...r.terms.filter(latin), ...han, ...hanPairs])]
      // 字段只有包含查询原词（英文命中词或中文原文片段）才算命中，避免零散单字造成误标
      const primary = [...new Set([...r.terms.filter(latin), ...han])]
      const doc = byId.get(r.id as string)!
      const exact = [...fields].filter((f) => primary.some((t) => normalize(doc[f]).includes(t)))
      hits.set(r.id as string, { score: r.score, fields: exact.length ? exact : [...fields], terms, snippet: null })
    }

    // 子串兜底：短字段中间的片段（如 "systems" 命中 "TekSystems"）
    const compact = q.replace(/\s+/g, '')
    for (const d of docs) {
      const matched = SHORT_FIELDS.filter((f) => normalize(d[f]).replace(/\s+/g, '').includes(compact))
      if (matched.length === 0) continue
      const hit = hits.get(d.id) ?? { score: 0, fields: [], terms: [compact], snippet: null }
      hit.score += 5 * matched.length
      hit.fields = [...new Set([...hit.fields, ...matched])]
      hits.set(d.id, hit)
    }

    // 命中片段：取命中次数最多的文档字段
    for (const [id, hit] of hits) {
      const d = byId.get(id)!
      const snippets = DOC_FIELDS.filter((f) => hit.fields.includes(f))
        .map((f) => makeSnippet(d[f], hit.terms, f))
        .filter((s): s is Snippet => s !== null)
        .sort((a, b) => b.count - a.count)
      hit.snippet = snippets[0] ?? null
    }
    return hits
  }

  return { search }
}

export type SearchIndex = ReturnType<typeof buildSearchIndex>
