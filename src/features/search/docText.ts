import type { JSONContent } from '@tiptap/core'

const BLOCKS = new Set(['paragraph', 'heading', 'listItem', 'taskItem', 'tableCell', 'tableHeader', 'codeBlock', 'blockquote'])

/** 富文本 JSON → 纯文本（块之间换行），用于搜索与片段 */
export function docText(doc: JSONContent | null): string {
  if (!doc) return ''
  const out: string[] = []
  const walk = (n: JSONContent) => {
    if (n.type === 'text' && n.text) out.push(n.text)
    if (n.type === 'hardBreak') out.push('\n')
    n.content?.forEach(walk)
    if (n.type && BLOCKS.has(n.type)) out.push('\n')
  }
  walk(doc)
  return out
    .join('')
    .replace(/\n{2,}/g, '\n')
    .trim()
}
