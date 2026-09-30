import { FONT_STACK } from '@/theme'

// 导出（PDF 截图）用的固定浅色样式，全部使用十六进制颜色
export const EXPORT_CLASS = 'ims-export'

export const EXPORT_CSS = `
.${EXPORT_CLASS} { font-family: ${FONT_STACK}; font-size: 15px; line-height: 1.7; color: #1f2433; background: #fff; overflow-wrap: break-word; }
.${EXPORT_CLASS} > :first-child { margin-top: 0; }
.${EXPORT_CLASS} p { margin: 0 0 0.6em; min-height: 1.7em; }
.${EXPORT_CLASS} h1 { font-size: 26px; line-height: 1.35; margin: 0.9em 0 0.45em; font-weight: 700; }
.${EXPORT_CLASS} h2 { font-size: 21px; line-height: 1.4; margin: 0.9em 0 0.4em; font-weight: 700; }
.${EXPORT_CLASS} h3 { font-size: 17px; line-height: 1.45; margin: 0.8em 0 0.35em; font-weight: 700; }
.${EXPORT_CLASS} ul, .${EXPORT_CLASS} ol { padding-left: 1.6em; margin: 0 0 0.6em; }
.${EXPORT_CLASS} li > p { margin: 0 0 0.2em; }
.${EXPORT_CLASS} ul[data-type="taskList"] { list-style: none; padding-left: 0.2em; }
.${EXPORT_CLASS} ul[data-type="taskList"] li { display: flex; gap: 0.5em; align-items: flex-start; }
.${EXPORT_CLASS} ul[data-type="taskList"] li > label { flex: none; margin-top: 0.3em; }
.${EXPORT_CLASS} ul[data-type="taskList"] li > div { flex: 1; }
.${EXPORT_CLASS} table { border-collapse: collapse; width: 100%; margin: 0.6em 0 0.9em; table-layout: fixed; }
.${EXPORT_CLASS} td, .${EXPORT_CLASS} th { border: 1px solid #d0d5dd; padding: 6px 8px; vertical-align: top; }
.${EXPORT_CLASS} th { background: #f2f4f7; font-weight: 600; text-align: left; }
.${EXPORT_CLASS} td > p, .${EXPORT_CLASS} th > p { margin: 0; }
.${EXPORT_CLASS} img { max-width: 100%; height: auto; display: block; margin: 0.4em 0; }
.${EXPORT_CLASS} blockquote { border-left: 3px solid #d0d5dd; margin: 0.6em 0; padding-left: 1em; color: #475467; }
.${EXPORT_CLASS} pre { background: #f5f6fa; padding: 10px 12px; border-radius: 6px; font-family: Menlo, Consolas, monospace; font-size: 13px; line-height: 1.55; white-space: pre-wrap; }
.${EXPORT_CLASS} code { font-family: Menlo, Consolas, monospace; font-size: 0.9em; background: #f2f4f7; padding: 1px 4px; border-radius: 4px; }
.${EXPORT_CLASS} pre code { background: none; padding: 0; }
.${EXPORT_CLASS} hr { border: none; border-top: 1px solid #e4e7ec; margin: 1em 0; }
.${EXPORT_CLASS} a { color: #3b48c9; text-decoration: underline; }
.${EXPORT_CLASS} mark { background-color: #fef08a; color: inherit; padding: 0 1px; }
`

export function ensureExportStyles() {
  if (document.getElementById('ims-export-style')) return
  const style = document.createElement('style')
  style.id = 'ims-export-style'
  style.textContent = EXPORT_CSS
  document.head.appendChild(style)
}
