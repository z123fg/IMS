// 开发用：导出效果验证页（/dev/export-poc.html），不依赖 Supabase
import type { JSONContent } from '@tiptap/core'
import { ensureExportStyles, EXPORT_CLASS } from '@/features/export/exportStyles'
import { renderExportHtml } from '@/features/export/renderHtml'
import { htmlToDocx } from '@/features/export/toDocx'
import { htmlToPdf } from '@/features/export/toPdf'

const t = (text: string, marks?: JSONContent['marks']): JSONContent => ({ type: 'text', text, marks })
const p = (...content: JSONContent[]): JSONContent => ({ type: 'paragraph', content })
const h = (level: number, text: string): JSONContent => ({ type: 'heading', attrs: { level }, content: [t(text)] })
const li = (text: string): JSONContent => ({ type: 'listItem', content: [p(t(text))] })
const cell = (text: string, header = false): JSONContent => ({
  type: header ? 'tableHeader' : 'tableCell',
  content: [p(t(text))],
})

const long =
  '负责核心交易系统的设计与开发，参与高并发场景下的性能优化，与产品、测试团队紧密协作，推动需求从评审到上线的全流程落地。熟悉分布式系统、消息队列与缓存设计者优先。'

const doc: JSONContent = {
  type: 'doc',
  content: [
    h(1, 'Senior Frontend Engineer — 职位描述'),
    p(t('客户：'), t('Acme Financial', [{ type: 'bold' }]), t('　渠道：TekSystems　'), t('重点', [{ type: 'highlight', attrs: { color: '#fde68a' } }])),
    p(t('红色文字', [{ type: 'textStyle', attrs: { color: '#dc2626' } }]), t(' 与 '), t('斜体 italic', [{ type: 'italic' }]), t(' 以及 '), t('下划线', [{ type: 'underline' }]), t(' 和 '), t('code()', [{ type: 'code' }])),
    h(2, '岗位职责'),
    { type: 'bulletList', content: [li('使用 React + TypeScript 构建复杂的交易界面'), li('与后端协作设计 API，推动性能与可访问性改进'), li('指导初级工程师，参与 Code Review')] },
    h(2, '任职要求'),
    { type: 'orderedList', attrs: { start: 1 }, content: [li('5 年以上前端开发经验'), li('精通 React、状态管理与测试'), li('良好的英文读写能力')] },
    h(3, '准备清单'),
    {
      type: 'taskList',
      content: [
        { type: 'taskItem', attrs: { checked: true }, content: [p(t('复习 React 渲染机制'))] },
        { type: 'taskItem', attrs: { checked: false }, content: [p(t('准备 STAR 项目案例'))] },
      ],
    },
    h(2, '常见问题与回答'),
    {
      type: 'table',
      content: [
        { type: 'tableRow', content: [cell('问题', true), cell('回答要点', true)] },
        { type: 'tableRow', content: [cell('为什么离开上一家公司？'), cell('寻求更大的技术挑战，聚焦交易系统领域')] },
        { type: 'tableRow', content: [cell('如何优化首屏性能？'), cell('代码分割、预加载关键资源、减少主线程阻塞、使用 CDN 与缓存策略')] },
      ],
    },
    { type: 'image', attrs: { src: null, storagePath: 'demo/diagram.webp', width: 420 } },
    { type: 'blockquote', content: [p(t('面试官提示：重点考察系统设计与沟通能力。'))] },
    { type: 'codeBlock', attrs: { language: 'ts' }, content: [t('function add(a: number, b: number) {\n  return a + b\n}')] },
    { type: 'horizontalRule' },
    ...Array.from({ length: 22 }, (_, i) => p(t(`${i + 1}. ${long}`))),
  ],
}

async function demoImage(): Promise<Blob> {
  const c = document.createElement('canvas')
  c.width = 1200
  c.height = 700
  const ctx = c.getContext('2d')!
  const g = ctx.createLinearGradient(0, 0, 1200, 700)
  g.addColorStop(0, '#4f5bd5')
  g.addColorStop(1, '#0ea5a4')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 1200, 700)
  ctx.fillStyle = '#fff'
  ctx.font = 'bold 72px sans-serif'
  ctx.fillText('系统架构图 Demo', 80, 380)
  return new Promise((r) => c.toBlob((b) => r(b!), 'image/webp', 0.85))
}

const loader = async () => demoImage()

function download(blob: Blob, name: string) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 10_000)
}

const status = document.getElementById('status')!
async function run(kind: 'pdf' | 'docx') {
  status.textContent = `${kind} 生成中…`
  try {
    const started = performance.now()
    const html = await renderExportHtml(doc, kind, loader)
    const blob = kind === 'pdf' ? await htmlToPdf(html) : await htmlToDocx(html, 'POC')
    download(blob, `poc.${kind}`)
    status.textContent = `${kind} 完成：${(blob.size / 1024).toFixed(0)} KB，${Math.round(performance.now() - started)} ms`
  } catch (e) {
    console.error(e)
    status.textContent = `${kind} 失败：${String(e)}`
  }
}

document.getElementById('pdf')!.onclick = () => run('pdf')
document.getElementById('docx')!.onclick = () => run('docx')

ensureExportStyles()
const preview = document.getElementById('preview')!
preview.className = EXPORT_CLASS
void renderExportHtml(doc, 'pdf', loader).then((html) => (preview.innerHTML = html))
