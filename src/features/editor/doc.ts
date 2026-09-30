import type { JSONContent } from '@tiptap/core'

// 文档里的图片只持久化 storagePath；src 是临时签名链接，打开时再填回

function mapImages(node: JSONContent, fn: (attrs: Record<string, unknown>) => Record<string, unknown>): JSONContent {
  const next: JSONContent = { ...node }
  if (node.type === 'image' && node.attrs) next.attrs = fn({ ...node.attrs })
  if (node.content) next.content = node.content.map((c) => mapImages(c, fn))
  return next
}

export function collectImagePaths(doc: JSONContent | null): string[] {
  const paths = new Set<string>()
  const walk = (n: JSONContent) => {
    const p = n.type === 'image' ? n.attrs?.storagePath : undefined
    if (typeof p === 'string' && p) paths.add(p)
    n.content?.forEach(walk)
  }
  if (doc) walk(doc)
  return [...paths]
}

/** 保存前：有 storagePath 的图片去掉 src（签名链接会过期，不应入库） */
export function serializeDoc(doc: JSONContent): JSONContent {
  return mapImages(doc, (attrs) => (attrs.storagePath ? { ...attrs, src: null } : attrs))
}

/** 打开时：按 storagePath 填回可访问的 src */
export function hydrateDoc(doc: JSONContent, urls: Record<string, string>): JSONContent {
  return mapImages(doc, (attrs) => {
    const p = attrs.storagePath
    return typeof p === 'string' && urls[p] ? { ...attrs, src: urls[p] } : attrs
  })
}
