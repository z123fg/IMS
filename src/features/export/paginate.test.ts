import { describe, expect, it } from 'vitest'
import { paginate } from './paginate'

describe('paginate', () => {
  it('内容不足一页时只有一页', () => {
    expect(paginate([0, 50, 90], 300, 1000)).toEqual([[0, 300]])
  })

  it('在不超过页尾的最大断点处分页，不切断块', () => {
    // 每 120px 一行
    const lines = Array.from({ length: 20 }, (_, i) => i * 120)
    const slices = paginate(lines, 2400, 1000)
    expect(slices).toEqual([
      [0, 960],
      [960, 1920],
      [1920, 2400],
    ])
    for (const [, end] of slices.slice(0, -1)) expect(lines).toContain(end)
  })

  it('页与页首尾相接，覆盖全部高度', () => {
    const slices = paginate([0, 333, 777, 1234, 1900, 2500, 3100], 3500, 1000)
    expect(slices[0][0]).toBe(0)
    expect(slices.at(-1)![1]).toBe(3500)
    for (let i = 1; i < slices.length; i++) expect(slices[i][0]).toBe(slices[i - 1][1])
    for (const [a, b] of slices) expect(b - a).toBeLessThanOrEqual(1000)
  })

  it('超高单块（没有断点）在页尾硬切', () => {
    expect(paginate([0], 2500, 1000)).toEqual([
      [0, 1000],
      [1000, 2000],
      [2000, 2500],
    ])
  })

  it('断点离页首太近时硬切，避免几乎空白的页', () => {
    // 100 处有断点，之后是一个 3000px 的大图
    expect(paginate([0, 100, 3100], 3200, 1000)).toEqual([
      [0, 1000],
      [1000, 2000],
      [2000, 3000],
      [3000, 3200],
    ])
  })

  it('空内容返回一页空白', () => {
    expect(paginate([], 0, 1000)).toEqual([[0, 0]])
  })
})
