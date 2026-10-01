import type { JSONContent } from '@tiptap/core'
import { generateHTML } from '@tiptap/html'
import { buildExtensions } from '@/features/editor/extensions'
import { t } from '@/i18n'

export type ExportTarget = 'pdf' | 'docx'
export type ImageLoader = (attrs: Record<string, unknown>) => Promise<Blob | null>

/** Word 页面（A4，默认页边距）的可用宽度约 600px */
const DOCX_MAX_IMAGE_WIDTH = 600

const blobToDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })

/** Word 对 WebP 支持不稳定：统一转 PNG，并写入明确的宽高 */
async function toDocxImage(blob: Blob, displayWidth: number | null) {
  const bitmap = await createImageBitmap(blob)
  const canvas = document.createElement('canvas')
  canvas.width = bitmap.width
  canvas.height = bitmap.height
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0)
  const width = Math.min(displayWidth || bitmap.width, DOCX_MAX_IMAGE_WIDTH)
  const height = Math.round((width * bitmap.height) / bitmap.width)
  bitmap.close()
  return { src: canvas.toDataURL('image/png'), width, height }
}

async function inlineImages(node: JSONContent, target: ExportTarget, load: ImageLoader): Promise<JSONContent> {
  const next: JSONContent = { ...node }
  if (node.content) next.content = await Promise.all(node.content.map((c) => inlineImages(c, target, load)))
  if (node.type !== 'image' || !node.attrs) return next

  const blob = await load(node.attrs).catch(() => null)
  if (!blob) return { type: 'paragraph', content: [{ type: 'text', text: t().editor.imageUnavailable }] }
  const width = Number(node.attrs.width) || null
  next.attrs =
    target === 'docx'
      ? { ...node.attrs, ...(await toDocxImage(blob, width)), aspectRatio: null }
      : { ...node.attrs, src: await blobToDataUrl(blob) }
  return next
}

/** docx 转换器不认识的结构改写成普通 HTML */
function adaptForDocx(html: string): string {
  const dom = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html')
  dom.querySelectorAll('li[data-type="taskItem"]').forEach((li) => {
    const box = li.getAttribute('data-checked') === 'true' ? '☑ ' : '☐ '
    li.querySelector(':scope > label')?.remove()
    const target = li.querySelector('p') ?? li
    target.prepend(dom.createTextNode(box))
  })
  dom.querySelectorAll('ul[data-type="taskList"]').forEach((ul) => {
    ul.removeAttribute('data-type')
    ul.setAttribute('style', 'list-style-type: none;')
  })
  dom.querySelectorAll('mark').forEach((mark) => {
    const span = dom.createElement('span')
    const color = mark.getAttribute('data-color') || '#fef08a'
    span.setAttribute('style', `background-color: ${color};`)
    span.append(...mark.childNodes)
    mark.replaceWith(span)
  })
  dom.querySelectorAll('colgroup').forEach((el) => el.remove())
  dom.querySelectorAll('table').forEach((t) => {
    t.removeAttribute('style')
    t.setAttribute('border', '1')
    t.setAttribute('style', 'width: 100%; border-collapse: collapse;')
  })
  return dom.body.innerHTML
}

export async function renderExportHtml(doc: JSONContent, target: ExportTarget, load: ImageLoader): Promise<string> {
  const inlined = await inlineImages(doc, target, load)
  const html = generateHTML(inlined, buildExtensions())
  return target === 'docx' ? adaptForDocx(html) : html
}
