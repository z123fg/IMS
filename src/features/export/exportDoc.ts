import type { JSONContent } from '@tiptap/core'
import { downloadImage } from '@/features/editor/images'
import { DOC_LABEL, type DocField, type Interview } from '@/features/interviews/types'
import { renderExportHtml, type ExportTarget, type ImageLoader } from './renderHtml'
import { htmlToDocx } from './toDocx'
import { htmlToPdf } from './toPdf'

const loadImage: ImageLoader = async (attrs) => {
  if (typeof attrs.storagePath === 'string' && attrs.storagePath) return downloadImage(attrs.storagePath)
  if (typeof attrs.src === 'string' && attrs.src) {
    const res = await fetch(attrs.src)
    return res.ok ? res.blob() : null
  }
  return null
}

function fileBase(row: Pick<Interview, 'client' | 'vendor'>, field: DocField) {
  const parts = [row.client || '未命名', row.vendor, DOC_LABEL[field]].filter(Boolean)
  return parts.join('-').replace(/[\\/:*?"<>|\s]+/g, '_')
}

function download(blob: Blob, name: string) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(a.href), 10_000)
}

export async function exportDocument(kind: ExportTarget, doc: JSONContent, row: Interview, field: DocField) {
  const name = fileBase(row, field)
  const html = await renderExportHtml(doc, kind, loadImage)
  const blob = kind === 'pdf' ? await htmlToPdf(html) : await htmlToDocx(html, name)
  download(blob, `${name}.${kind}`)
}
