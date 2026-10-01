import Box from '@mui/material/Box'
import Collapse from '@mui/material/Collapse'
import LinearProgress from '@mui/material/LinearProgress'
import { lazy, memo, Suspense, useLayoutEffect, useRef, useState, type RefObject } from 'react'
import { PANEL_COLLAPSE_CLASS } from '@/features/editor/panelLayout'
import { useT } from '@/i18n'
import { DateCell, DateTimeCell } from './cells/DateCells'
import { DocCell } from './cells/DocCell'
import { RowActions } from './cells/RowActions'
import { ComboCell } from './cells/ComboCell'
import { gridColumns, HEADER_H, ROW_H } from './layout'
import { useUpdateInterview } from './queries'
import type { SearchField, SearchHit } from '@/features/search/searchIndex'
import { SearchSnippet } from './SearchSnippet'
import { DOC_FIELDS, type DocField, type FieldPatch, type Interview } from './types'

// 编辑器与导出较重，首次展开面板时才加载
const DocPanel = lazy(() => import('./DocPanel').then((m) => ({ default: m.DocPanel })))

export type CellOptions = Record<'client' | 'vendor' | 'interviewee' | 'interviewer' | 'interview_type', string[]>

type Props = {
  row: Interview
  openDoc: DocField | null
  options: CellOptions
  /** 当前搜索在这一行的命中情况 */
  hit?: SearchHit
  autoFocus: boolean
  scrollRef: RefObject<HTMLDivElement | null>
  onToggleDoc: (id: string, field: DocField) => void
  onCloseDoc: () => void
  onDelete: (row: Interview) => void
}

function Cell({ children, center, matched }: { children: React.ReactNode; center?: boolean; matched?: boolean }) {
  return (
    <Box
      role="cell"
      data-matched={matched || undefined}
      sx={(theme) => ({
        px: 0.75,
        minWidth: 0,
        height: '100%',
        // 兜底：内容再长也不压到相邻列（焦点环在内边距内，不会被裁掉）
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: center ? 'center' : 'flex-start',
        // 搜索命中的单元格底部淡淡标出
        ...(matched && {
          boxShadow: `inset 0 -2px 0 ${theme.alpha((theme.vars ?? theme).palette.warning.main, 0.55)}`,
          bgcolor: theme.alpha((theme.vars ?? theme).palette.warning.main, 0.06),
        }),
      })}
    >
      {children}
    </Box>
  )
}

export const InterviewRow = memo(function InterviewRow({
  row,
  openDoc,
  options,
  hit,
  autoFocus,
  scrollRef,
  onToggleDoc,
  onCloseDoc,
  onDelete,
}: Props) {
  const expanded = openDoc !== null
  const sectionRef = useRef<HTMLElement>(null)
  const update = useUpdateInterview()
  const m = useT()
  // 收起动画期间继续渲染最后打开的文档，避免内容先消失
  const [shownDoc, setShownDoc] = useState(openDoc)
  if (openDoc && openDoc !== shownDoc) setShownDoc(openDoc)

  const commit = (patch: FieldPatch) => update.mutateAsync({ id: row.id, patch })
  const matched = (f: SearchField) => hit?.fields.includes(f) ?? false

  const sectionTop = () => {
    const sc = scrollRef.current
    const el = sectionRef.current
    if (!sc || !el) return null
    return sc.scrollTop + el.getBoundingClientRect().top - sc.getBoundingClientRect().top
  }

  // 收起时若该行正吸顶，先把滚动位置还原到它的自然位置，面板在它下方收拢
  const wasExpanded = useRef(expanded)
  useLayoutEffect(() => {
    const sc = scrollRef.current
    const top = sectionTop()
    if (wasExpanded.current && !expanded && sc && top !== null && top < sc.scrollTop + HEADER_H) {
      sc.scrollTop = top - HEADER_H
    }
    wasExpanded.current = expanded
  })

  // 展开时把该行平滑滚到吸顶位
  function alignToTop() {
    const sc = scrollRef.current
    const top = sectionTop()
    if (sc && top !== null) sc.scrollTo({ top: top - HEADER_H, behavior: 'smooth' })
  }

  return (
    <Box
      component="section"
      ref={sectionRef}
      data-row-id={row.id}
      sx={(theme) => ({
        position: 'relative',
        borderBottom: 1,
        borderColor: 'divider',
        transition: theme.transitions.create('box-shadow'),
        ...(expanded && {
          boxShadow: `inset 3px 0 0 ${(theme.vars ?? theme).palette.primary.main}`,
        }),
      })}
    >
      <Box
        role="row"
        sx={(theme) => {
          const palette = (theme.vars ?? theme).palette
          return {
            display: 'grid',
            gridTemplateColumns: gridColumns,
            height: ROW_H,
            alignItems: 'center',
            px: 1,
            bgcolor: 'background.paper',
            transition: theme.transitions.create(['background-color', 'box-shadow'], { duration: 150 }),
            '&:hover': { bgcolor: theme.alpha(palette.primary.main, 0.025) },
            ...(expanded && {
              position: 'sticky',
              top: HEADER_H,
              zIndex: 3,
              bgcolor: `color-mix(in srgb, ${palette.primary.main} 6%, ${palette.background.paper})`,
              boxShadow: `inset 3px 0 0 ${palette.primary.main}`,
              '&:hover': { bgcolor: `color-mix(in srgb, ${palette.primary.main} 8%, ${palette.background.paper})` },
            }),
          }
        }}
      >
        <Cell matched={matched('client')}>
          <ComboCell
            value={row.client}
            options={options.client}
            label={m.columns.client}
            placeholder={m.cells.clientPlaceholder}
            bold
            autoFocus={autoFocus}
            onCommit={(v) => commit({ client: v })}
          />
        </Cell>
        <Cell matched={matched('vendor')}>
          <ComboCell value={row.vendor} options={options.vendor} label={m.columns.vendor} placeholder={m.cells.vendorPlaceholder} onCommit={(v) => commit({ vendor: v })} />
        </Cell>
        <Cell matched={matched('interviewee')}>
          <ComboCell
            value={row.interviewee}
            options={options.interviewee}
            label={m.columns.interviewee}
            placeholder={m.cells.intervieweePlaceholder}
            onCommit={(v) => commit({ interviewee: v })}
          />
        </Cell>
        <Cell matched={matched('interviewer')}>
          <ComboCell
            value={row.interviewer}
            options={options.interviewer}
            label={m.columns.interviewer}
            placeholder={m.cells.interviewerPlaceholder}
            onCommit={(v) => commit({ interviewer: v })}
          />
        </Cell>
        <Cell matched={matched('interview_type')}>
          <ComboCell
            value={row.interview_type}
            options={options.interview_type}
            label={m.columns.interviewType}
            placeholder={m.cells.typePlaceholder}
            onCommit={(v) => commit({ interview_type: v })}
          />
        </Cell>
        <Cell>
          <DateCell value={row.received_at} label={m.columns.receivedAt} onCommit={(v) => commit({ received_at: v })} />
        </Cell>
        <Cell>
          <DateTimeCell value={row.interview_at} label={m.columns.interviewAt} onCommit={(v) => commit({ interview_at: v })} />
        </Cell>
        {DOC_FIELDS.map((f) => (
          <Cell key={f} matched={matched(f)}>
            <DocCell field={f} hasContent={row[f] !== null} active={openDoc === f} onClick={() => onToggleDoc(row.id, f)} />
          </Cell>
        ))}
        <Cell center>
          <RowActions onDelete={() => onDelete(row)} />
        </Cell>
      </Box>

      <Collapse in={!expanded && hit?.snippet != null} timeout={200} unmountOnExit>
        {hit?.snippet && <SearchSnippet snippet={hit.snippet} onOpen={(f) => onToggleDoc(row.id, f)} />}
      </Collapse>

      <Collapse
        in={expanded}
        timeout={260}
        unmountOnExit
        className={PANEL_COLLAPSE_CLASS}
        onEnter={alignToTop}
        onExited={() => setShownDoc(null)}
      >
        {shownDoc && (
          <Suspense fallback={<LinearProgress sx={{ height: 2 }} />}>
            <DocPanel
              key={shownDoc}
              row={row}
              field={shownDoc}
              onSwitch={(f) => onToggleDoc(row.id, f)}
              onClose={onCloseDoc}
              highlight={hit?.terms}
            />
          </Suspense>
        )}
      </Collapse>
    </Box>
  )
})
