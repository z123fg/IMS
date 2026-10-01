import type { Lang } from '@/i18n'

// 表格与吸顶层的尺寸；sticky 偏移都相对滚动容器计算
export const HEADER_H = 40
export const ROW_H = 52

// 列：client | vendor | 面试者 | 面试官 | 面试类型 | 收到日期 | 面试日期 | JD | 材料 | 面试题 | 操作
// 英文的日期标签（"1 year ago"、"In 2 months"）与文档名（Questions）更长，列宽分别设置
// 宽度按实测所需（含「● 有内容」标记与跨年日期格式）再留约 8px 余量
const GRID = {
  zh: {
    columns:
      'minmax(150px, 1.3fr) minmax(130px, 1.1fr) minmax(110px, 1fr) minmax(110px, 1fr) 140px 186px 232px 112px 120px 132px 48px',
    minWidth: 1490,
  },
  en: {
    columns:
      'minmax(150px, 1.3fr) minmax(130px, 1.1fr) minmax(110px, 1fr) minmax(110px, 1fr) 130px 208px 250px 112px 128px 156px 48px',
    minWidth: 1560,
  },
} satisfies Record<Lang, { columns: string; minWidth: number }>

/** 表格可视区域宽度（滚动容器宽度），展开面板据此在横向上固定 */
export const VIEWPORT_W_VAR = '--ims-viewport-width'

/** 列模板通过 CSS 变量下发，表头、各行、骨架屏共用 */
export const GRID_VAR = '--ims-grid-columns'
export const gridColumns = `var(${GRID_VAR})`

export function gridRootSx(lang: Lang) {
  return { [GRID_VAR]: GRID[lang].columns, minWidth: GRID[lang].minWidth }
}
