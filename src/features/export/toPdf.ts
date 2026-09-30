import { EXPORT_CLASS, ensureExportStyles } from './exportStyles'
import { paginate } from './paginate'

// A4（pt）与版心。内容以 680 CSS px 宽渲染，再等比缩放到版心宽度
const PAGE_W_PT = 595.28
const PAGE_H_PT = 841.89
const MARGIN_PT = 48
const CONTENT_W_PT = PAGE_W_PT - MARGIN_PT * 2
const CONTENT_H_PT = PAGE_H_PT - MARGIN_PT * 2
const CONTENT_W_PX = 680
const PT_PER_PX = CONTENT_W_PT / CONTENT_W_PX
const PAGE_H_PX = Math.floor(CONTENT_H_PT / PT_PER_PX)
const SCALE = 2

const BLOCKS = 'p, h1, h2, h3, h4, h5, h6, li, tr, td, th, img, pre, blockquote, hr, table'

/** 允许分页的位置：块元素顶部 + 每一行文字的顶部 */
function collectBreakpoints(root: HTMLElement): number[] {
  const top0 = root.getBoundingClientRect().top
  const points: number[] = []
  root.querySelectorAll(BLOCKS).forEach((el) => points.push(el.getBoundingClientRect().top - top0))
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  const range = document.createRange()
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    // 块的第一行不单独作为断点（用块顶部），否则块的上内边距/背景会被切到上一页
    const blockTop = n.parentElement?.closest(BLOCKS)?.getBoundingClientRect().top ?? -Infinity
    range.selectNodeContents(n)
    for (const r of range.getClientRects()) {
      if (r.top - blockTop > 16) points.push(r.top - top0)
    }
  }
  return points.map((p) => Math.max(0, Math.floor(p) - 1))
}

async function waitForImages(root: HTMLElement) {
  await Promise.all(
    [...root.querySelectorAll('img')].map((img) => img.decode().catch(() => undefined)),
  )
}

export async function htmlToPdf(html: string): Promise<Blob> {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas-pro'),
    import('jspdf'),
  ])
  ensureExportStyles()

  const host = document.createElement('div')
  host.style.cssText = 'position:fixed;left:-20000px;top:0;pointer-events:none;'
  const page = document.createElement('div')
  page.className = EXPORT_CLASS
  page.style.width = `${CONTENT_W_PX}px`
  page.innerHTML = html
  host.appendChild(page)
  document.body.appendChild(host)

  try {
    await waitForImages(page)
    await document.fonts.ready
    const total = Math.ceil(page.scrollHeight)
    const slices = paginate(collectBreakpoints(page), total, PAGE_H_PX)
    const canvas = await html2canvas(page, {
      scale: SCALE,
      backgroundColor: '#ffffff',
      logging: false,
      width: CONTENT_W_PX,
      height: total,
      windowWidth: CONTENT_W_PX + 100,
    })
    const ratio = canvas.width / CONTENT_W_PX

    const pdf = new jsPDF({ unit: 'pt', format: 'a4', compress: true })
    slices.forEach(([start, end], i) => {
      if (i > 0) pdf.addPage()
      const h = end - start
      if (h <= 0) return
      const slice = document.createElement('canvas')
      slice.width = canvas.width
      slice.height = Math.ceil(h * ratio)
      const ctx = slice.getContext('2d')!
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, slice.width, slice.height)
      ctx.drawImage(canvas, 0, start * ratio, canvas.width, h * ratio, 0, 0, canvas.width, h * ratio)
      pdf.addImage(slice.toDataURL('image/jpeg', 0.92), 'JPEG', MARGIN_PT, MARGIN_PT, CONTENT_W_PT, h * PT_PER_PX)
    })
    return pdf.output('blob')
  } finally {
    host.remove()
  }
}
