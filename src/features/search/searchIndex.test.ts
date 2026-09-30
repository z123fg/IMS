import type { JSONContent } from '@tiptap/core'
import { describe, expect, it } from 'vitest'
import type { Interview } from '@/features/interviews/types'
import { docText } from './docText'
import { buildSearchIndex } from './searchIndex'
import { tokenize } from './tokenize'

const doc = (...paras: string[]): JSONContent => ({
  type: 'doc',
  content: paras.map((text) => ({ type: 'paragraph', content: [{ type: 'text', text }] })),
})

function row(id: string, over: Partial<Interview>): Interview {
  return {
    id,
    client: '',
    vendor: '',
    interviewee: '',
    interviewer: '',
    interview_type: '',
    received_at: null,
    interview_at: null,
    jd: null,
    jd_rev: 0,
    materials: null,
    materials_rev: 0,
    questions: null,
    questions_rev: 0,
    created_by: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...over,
  }
}

const rows = [
  row('acme', {
    client: 'Acme Financial',
    vendor: 'TekSystems',
    interviewee: '张三',
    interviewer: 'Sarah Chen',
    interview_type: 'Technical',
    jd: doc('Senior Frontend Engineer', '负责前端工程化与性能优化，熟悉 React 和 TypeScript。'),
  }),
  row('globex', {
    client: 'Globex',
    vendor: 'Randstad',
    interviewee: 'Li Si',
    interview_type: 'HR',
    questions: doc('为什么离开上一家公司？', '介绍一个你主导的 Kubernetes 迁移项目。'),
  }),
  row('initech', { client: 'Initech', vendor: 'Robert Half', materials: doc('系统设计：消息队列与缓存') }),
]
const index = buildSearchIndex(rows)
const ids = (q: string) => [...index.search(q).keys()]

describe('tokenize', () => {
  it('英文按词、中文按单字 + 双字', () => {
    expect(tokenize('React 前端')).toEqual(['react', '前', '端', '前端'])
    expect(tokenize('Ｔｅｋ-Systems')).toEqual(['tek', 'systems'])
  })
})

describe('docText', () => {
  it('提取纯文本，块之间换行', () => {
    expect(docText(doc('一', '二'))).toBe('一\n二')
    expect(docText(null)).toBe('')
  })
})

describe('search', () => {
  it('空查询没有结果', () => {
    expect(ids('')).toEqual([])
    expect(ids('  ,, ')).toEqual([])
  })

  it('大小写不敏感 + 前缀匹配', () => {
    expect(ids('acme')).toEqual(['acme'])
    expect(ids('glob')).toEqual(['globex'])
  })

  it('拼写容错', () => {
    expect(ids('raect')).toContain('acme')
    expect(ids('kubernets')).toEqual(['globex'])
  })

  it('短字段中间的子串也能命中', () => {
    expect(ids('systems')).toEqual(['acme'])
    expect(ids('half')).toEqual(['initech'])
  })

  it('搜索文档正文（JD / 材料 / 面试题），中文词语匹配', () => {
    expect(ids('性能优化')).toEqual(['acme'])
    expect(ids('消息队列')).toEqual(['initech'])
    expect(ids('离开')).toEqual(['globex'])
    expect(ids('张三')).toEqual(['acme'])
    expect(ids('sarah')).toEqual(['acme'])
    expect(index.search('chen').get('acme')!.fields).toEqual(['interviewer'])
  })

  it('多个词优先要求全部命中', () => {
    expect(ids('react 性能')).toEqual(['acme'])
  })

  it('全部命中无结果时放宽为任一命中', () => {
    expect(ids('react 消息队列').sort()).toEqual(['acme', 'initech'])
  })

  it('返回命中字段与带高亮的片段', () => {
    const hit = index.search('性能优化').get('acme')!
    expect(hit.fields).toContain('jd')
    expect(hit.snippet?.field).toBe('jd')
    const highlighted = hit.snippet!.parts.filter((p) => p.hit).map((p) => p.text)
    expect(highlighted).toContain('性能优化')
    expect(hit.snippet!.parts.map((p) => p.text).join('')).toContain('负责前端工程化与')
  })

  it('模糊命中时高亮实际出现的词', () => {
    const hit = index.search('typescrpt').get('acme')!
    expect(hit.terms).toContain('typescript')
    expect(hit.snippet!.parts.find((p) => p.hit)?.text).toBe('TypeScript')
  })

  it('短字段命中的相关度高于正文命中', () => {
    const r = [
      row('body', { jd: doc('我们与 Randstad 合作多年') }),
      row('field', { vendor: 'Randstad' }),
    ]
    const hits = buildSearchIndex(r).search('randstad')
    expect(hits.get('field')!.score).toBeGreaterThan(hits.get('body')!.score)
  })
  it('只有包含查询原词的字段才标为命中；重叠命中合并计数', () => {
    const r = [
      row('x', {
        jd: doc('熟悉性能优化'),
        questions: doc('如何优化首屏性能？'),
      }),
    ]
    const hit = buildSearchIndex(r).search('首屏性能').get('x')!
    expect(hit.fields).toEqual(['questions'])
    expect(hit.snippet?.field).toBe('questions')
    expect(hit.snippet?.count).toBe(1)
  })
})
