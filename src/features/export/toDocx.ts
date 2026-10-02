import { getLang } from '@/i18n'
import { moveSectPrToEnd } from './fixDocx'

const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

export async function htmlToDocx(html: string, title: string): Promise<Blob> {
  // 该库的浏览器构建仍引用 Node 的 `global` 与 `Buffer`（处理图片时）
  const g = globalThis as { global?: typeof globalThis; Buffer?: unknown }
  g.global ??= globalThis
  g.Buffer ??= (await import('buffer')).Buffer
  const [{ default: HTMLtoDOCX }, { default: JSZip }] = await Promise.all([
    import('@turbodocx/html-to-docx'),
    import('jszip'),
  ])
  const out = await HTMLtoDOCX(html, null, {
    title,
    lang: getLang() === 'zh' ? 'zh-CN' : 'en-US',
    font: 'Arial',
    fontSize: 22, // 半磅：11pt
    table: { row: { cantSplit: true } },
    decodeUnicode: true,
  })

  // 修正库生成的文档结构（否则第一页为空白页），见 fixDocx.ts
  const zip = await JSZip.loadAsync(out as Blob | ArrayBuffer)
  const docXml = zip.file('word/document.xml')
  if (docXml) zip.file('word/document.xml', moveSectPrToEnd(await docXml.async('string')))
  return zip.generateAsync({ type: 'blob', mimeType: DOCX_MIME, compression: 'DEFLATE' })
}
