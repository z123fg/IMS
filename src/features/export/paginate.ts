export type Slice = [start: number, end: number]

/**
 * 把总高 total 的长图切成若干页（每页最多 pageHeight）。
 * breakpoints 是允许下刀的位置（块元素顶部、文字行顶部），取不超过页尾的最大者，避免切断文字；
 * 若合适的断点离页首太近（下一块超高，放不进一页），则直接在页尾硬切，避免浪费整页。
 */
export function paginate(breakpoints: number[], total: number, pageHeight: number, minFill = 0.25): Slice[] {
  if (total <= 0) return [[0, 0]]
  const sorted = [...new Set(breakpoints)].sort((a, b) => a - b)
  const slices: Slice[] = []
  let start = 0
  while (total - start > pageHeight) {
    const limit = start + pageHeight
    let cut = -1
    for (const b of sorted) {
      if (b > limit) break
      if (b > start + pageHeight * minFill) cut = b
    }
    if (cut < 0) cut = limit
    slices.push([start, cut])
    start = cut
  }
  slices.push([start, total])
  return slices
}
