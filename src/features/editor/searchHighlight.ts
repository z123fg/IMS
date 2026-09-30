import { Extension, type Editor } from '@tiptap/core'
import type { Node as PMNode } from '@tiptap/pm/model'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

// 搜索命中高亮：只是视图层装饰，不会写入文档内容

export const SEARCH_HIT_CLASS = 'ims-search-hit'
const key = new PluginKey<DecorationSet>('searchHighlight')

function build(doc: PMNode, terms: string[]): DecorationSet {
  const words = terms.map((t) => t.toLowerCase()).filter(Boolean)
  if (words.length === 0) return DecorationSet.empty
  const decos: Decoration[] = []
  doc.descendants((node, pos) => {
    if (!node.isText || !node.text) return
    const text = node.text.toLowerCase()
    const ranges: [number, number][] = []
    for (const w of words) {
      for (let i = text.indexOf(w); i !== -1; i = text.indexOf(w, i + w.length)) ranges.push([i, i + w.length])
    }
    // 合并重叠区间（如「线上故障」与其中的「线上」「故障」），否则会被切成多段高亮
    ranges.sort((a, b) => a[0] - b[0])
    const merged: [number, number][] = []
    for (const r of ranges) {
      const last = merged.at(-1)
      if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1])
      else merged.push([...r])
    }
    for (const [a, b] of merged) decos.push(Decoration.inline(pos + a, pos + b, { class: SEARCH_HIT_CLASS }))
  })
  return DecorationSet.create(doc, decos)
}

export const SearchHighlight = Extension.create({
  name: 'searchHighlight',
  addProseMirrorPlugins() {
    return [
      new Plugin<DecorationSet>({
        key,
        state: {
          init: () => DecorationSet.empty,
          apply(tr, old) {
            const terms = tr.getMeta(key) as string[] | undefined
            return terms ? build(tr.doc, terms) : old.map(tr.mapping, tr.doc)
          },
        },
        props: { decorations: (state) => key.getState(state) },
      }),
    ]
  },
})

export function setSearchTerms(editor: Editor, terms: string[]) {
  editor.view.dispatch(editor.state.tr.setMeta(key, terms))
}

/** 把第一处命中滚到可视区域中间 */
export function scrollToFirstHit(editor: Editor) {
  const el = editor.view.dom.querySelector(`.${SEARCH_HIT_CLASS}`)
  el?.scrollIntoView({ block: 'center', behavior: 'smooth' })
}
