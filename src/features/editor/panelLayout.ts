import { HEADER_H, ROW_H } from '@/features/interviews/layout'

// 面板工具栏吸顶在「列头 + 展开行」下方
export const PANEL_TOP = HEADER_H + ROW_H

export const PANEL_COLLAPSE_CLASS = 'ims-panel-collapse'

export const stickyPanelHeaderSx = {
  position: 'sticky',
  top: PANEL_TOP,
  zIndex: 2,
  bgcolor: 'background.paper',
  borderBottom: 1,
  borderColor: 'divider',
  boxShadow: '0 8px 16px -14px rgba(15, 23, 42, 0.45)',
  // 展开/收起动画期间 Collapse 带 overflow: hidden，sticky 会以它为参照而被推下 PANEL_TOP；
  // 动画期间改为随内容排列（紧贴行下方），展开完成后再吸顶，两者位置重合不会跳动
  [`.${PANEL_COLLAPSE_CLASS}:not(.MuiCollapse-entered) &`]: { position: 'relative', top: 'auto' },
} as const
