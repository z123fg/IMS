import type { JSONContent } from '@tiptap/core'
import { describe, expect, it } from 'vitest'
import { collectImagePaths, hydrateDoc, serializeDoc } from './doc'

const doc: JSONContent = {
  type: 'doc',
  content: [
    { type: 'paragraph', content: [{ type: 'text', text: '你好' }] },
    { type: 'image', attrs: { src: 'https://signed/a?token=1', storagePath: 'row1/a.webp', width: 320 } },
    {
      type: 'table',
      content: [
        {
          type: 'tableRow',
          content: [
            {
              type: 'tableCell',
              content: [{ type: 'image', attrs: { src: 'https://signed/b', storagePath: 'row1/b.webp' } }],
            },
          ],
        },
      ],
    },
    { type: 'image', attrs: { src: 'https://example.com/external.png', storagePath: null } },
  ],
}

describe('doc helpers', () => {
  it('收集所有（含嵌套的）图片路径，忽略外链图片', () => {
    expect(collectImagePaths(doc)).toEqual(['row1/a.webp', 'row1/b.webp'])
    expect(collectImagePaths(null)).toEqual([])
  })

  it('serialize 去掉有 storagePath 图片的 src，保留其他属性与外链图片', () => {
    const out = serializeDoc(doc)
    expect(out.content![1].attrs).toEqual({ src: null, storagePath: 'row1/a.webp', width: 320 })
    expect(out.content![2].content![0].content![0].content![0].attrs!.src).toBeNull()
    expect(out.content![3].attrs!.src).toBe('https://example.com/external.png')
  })

  it('serialize 不修改原文档', () => {
    const before = JSON.stringify(doc)
    serializeDoc(doc)
    expect(JSON.stringify(doc)).toBe(before)
  })

  it('hydrate 按路径填回 src，缺失的路径保持原样', () => {
    const stored = serializeDoc(doc)
    const out = hydrateDoc(stored, { 'row1/a.webp': 'https://new/a' })
    expect(out.content![1].attrs!.src).toBe('https://new/a')
    expect(out.content![2].content![0].content![0].content![0].attrs!.src).toBeNull()
  })

  it('无图片文档 round-trip 不变', () => {
    const plain: JSONContent = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'x' }] }] }
    expect(hydrateDoc(serializeDoc(plain), {})).toEqual(plain)
  })
})
