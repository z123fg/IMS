import { getLang } from '@/i18n'

export async function htmlToDocx(html: string, title: string): Promise<Blob> {
  // 该库的浏览器构建仍引用 Node 的 `global` 与 `Buffer`（处理图片时）
  const g = globalThis as { global?: typeof globalThis; Buffer?: unknown }
  g.global ??= globalThis
  g.Buffer ??= (await import('buffer')).Buffer
  const { default: HTMLtoDOCX } = await import('@turbodocx/html-to-docx')
  const out = await HTMLtoDOCX(html, null, {
    title,
    lang: getLang() === 'zh' ? 'zh-CN' : 'en-US',
    font: 'Arial',
    fontSize: 22, // 半磅：11pt
    table: { row: { cantSplit: true } },
    decodeUnicode: true,
  })
  return out instanceof Blob
    ? out
    : new Blob([out as ArrayBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      })
}
