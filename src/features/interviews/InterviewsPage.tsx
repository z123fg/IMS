import Add from '@mui/icons-material/Add'
import EventNoteOutlined from '@mui/icons-material/EventNoteOutlined'
import FilterAltOffOutlined from '@mui/icons-material/FilterAltOffOutlined'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Collapse from '@mui/material/Collapse'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import Fade from '@mui/material/Fade'
import Skeleton from '@mui/material/Skeleton'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Zoom from '@mui/material/Zoom'
import { getRouteApi } from '@tanstack/react-router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { TransitionGroup } from 'react-transition-group'
import { buildSearchIndex } from '@/features/search/searchIndex'
import { applyFilters, typeOptions as buildTypeOptions, valueOptions, type SortKey } from './filter'
import { GridHeader } from './GridHeader'
import { InterviewRow, type CellOptions } from './InterviewRow'
import { gridColumns, gridRootSx, HEADER_H, ROW_H, VIEWPORT_W_VAR } from './layout'
import { ListToolbar } from './ListToolbar'
import { errorMessage, useCreateInterview, useDeleteInterview, useInterviews } from './queries'
import { listSearchDefaults, type ListSearch } from './search'
import { useLang, useT } from '@/i18n'
import { rowTitle, type DocField, type Interview } from './types'

const route = getRouteApi('/_authed/')

// 日期列默认从新到旧，文本列默认从 A 到 Z
const DEFAULT_DIR: Record<SortKey, 'asc' | 'desc'> = {
  client: 'asc',
  vendor: 'asc',
  interviewee: 'asc',
  interviewer: 'asc',
  interview_type: 'asc',
  received_at: 'desc',
  interview_at: 'desc',
}

export function InterviewsPage() {
  const search = route.useSearch()
  const m = useT()
  const lang = useLang()
  const navigate = route.useNavigate()
  const { data, isPending, isError, error, refetch } = useInterviews()
  const create = useCreateInterview()
  const remove = useDeleteInterview()
  const scrollRef = useRef<HTMLDivElement>(null)
  const viewport = useElementSize(scrollRef)

  // 新建的行固定在顶部（即使不符合当前筛选/排序），直到筛选条件变化
  const [deleting, setDeleting] = useState<Interview | null>(null)
  const { q, types, when, sort, dir } = search
  const viewKey = JSON.stringify([q, types, when, sort, dir])
  const [pin, setPin] = useState<{ id: string; viewKey: string } | null>(null)
  const pinnedId = pin?.viewKey === viewKey ? pin.id : null

  const setSearch = useCallback(
    (patch: Partial<ListSearch>) =>
      void navigate({
        search: (current) => {
          const prev = current as ListSearch
          const next = { ...prev, ...patch }
          // 开始搜索时自动按相关度排序；清空搜索后恢复默认排序
          if (patch.q !== undefined) {
            if (patch.q.trim() && !prev.q.trim() && prev.sort === listSearchDefaults.sort) next.sort = 'relevance'
            if (!patch.q.trim() && prev.sort === 'relevance') next.sort = listSearchDefaults.sort
          }
          return next
        },
        replace: true,
      }),
    [navigate],
  )

  // 搜索索引随数据变化重建；数据量小，全部在浏览器内完成
  const index = useMemo(() => buildSearchIndex(data ?? []), [data])
  const hits = useMemo(() => (q.trim() ? index.search(q) : null), [index, q])

  const rows = useMemo(() => {
    const all = data ?? []
    const rank = hits ? new Map([...hits].map(([id, h]) => [id, h.score])) : undefined
    const list = applyFilters(all, { types, when, sort: sort === 'relevance' && !rank ? listSearchDefaults.sort : sort, dir, rank })
    const pinned = pinnedId ? all.find((r) => r.id === pinnedId) : undefined
    return pinned ? [pinned, ...list.filter((r) => r.id !== pinnedId)] : list
  }, [data, hits, types, when, sort, dir, pinnedId])

  const typeOptions = useMemo(() => buildTypeOptions(data ?? []), [data])
  const cellOptions = useMemo<CellOptions>(
    () => ({
      client: valueOptions(data ?? [], 'client'),
      vendor: valueOptions(data ?? [], 'vendor'),
      interviewee: valueOptions(data ?? [], 'interviewee'),
      interviewer: valueOptions(data ?? [], 'interviewer'),
      interview_type: typeOptions,
    }),
    [data, typeOptions],
  )
  const filtered = q !== '' || types.length > 0 || when !== 'all'

  const onToggleDoc = useCallback(
    (id: string, field: DocField) =>
      setSearch(search.open === id && search.doc === field ? { open: undefined, doc: undefined } : { open: id, doc: field }),
    [search.open, search.doc, setSearch],
  )
  const onCloseDoc = useCallback(() => setSearch({ open: undefined, doc: undefined }), [setSearch])
  const onDelete = useCallback((row: Interview) => setDeleting(row), [])

  async function onCreate() {
    const row = await create.mutateAsync().catch(() => null)
    if (!row) return
    setPin({ id: row.id, viewKey })
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function confirmDelete() {
    if (!deleting) return
    const id = deleting.id
    await remove.mutateAsync(id).catch(() => undefined)
    if (search.open === id) onCloseDoc()
    setDeleting(null)
  }

  return (
    <>
      <ListToolbar
        q={q}
        types={types}
        when={when}
        typeOptions={typeOptions}
        shown={rows.length}
        total={data?.length ?? 0}
        creating={create.isPending}
        byRelevance={sort === 'relevance'}
        onChange={setSearch}
        onCreate={onCreate}
      />

      <Box
        ref={scrollRef}
        sx={{
          flex: 1,
          minHeight: 0,
          overflow: 'auto',
          mx: 2.5,
          mb: 2.5,
          borderRadius: 3,
          border: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
          boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
        }}
      >
        <Box
          role="table"
          aria-label={m.list.ariaLabel}
          sx={{ ...gridRootSx(lang), [VIEWPORT_W_VAR]: `${viewport.width}px` }}
        >
          <GridHeader
            sort={sort}
            dir={dir}
            onSort={(key) => setSearch(key === sort ? { dir: dir === 'asc' ? 'desc' : 'asc' } : { sort: key, dir: DEFAULT_DIR[key] })}
          />

          {isPending ? (
            <LoadingRows />
          ) : isError ? (
            <Box sx={{ p: 3 }}>
              <Alert
                severity="error"
                action={
                  <Button color="inherit" size="small" onClick={() => void refetch()}>
                    {m.common.retry}
                  </Button>
                }
              >
                {m.common.loadFailed(errorMessage(error))}
              </Alert>
            </Box>
          ) : rows.length === 0 ? (
            <EmptyState filtered={filtered} onCreate={onCreate} onClear={() => setSearch({ q: '', types: [], when: 'all' })} />
          ) : (
            <TransitionGroup component={null}>
              {rows.map((row) => (
                <Collapse key={row.id} timeout={240}>
                  <InterviewRow
                    row={row}
                    openDoc={search.open === row.id ? (search.doc ?? 'jd') : null}
                    options={cellOptions}
                    hit={hits?.get(row.id)}
                    autoFocus={row.id === pinnedId}
                    scrollRef={scrollRef}
                    onToggleDoc={onToggleDoc}
                    onCloseDoc={onCloseDoc}
                    onDelete={onDelete}
                  />
                </Collapse>
              ))}
            </TransitionGroup>
          )}
          {/* 有行展开时在末尾留白，保证该行（即使在列表末尾、文档很短）也能滚到吸顶位 */}
          {search.open && rows.some((r) => r.id === search.open) && (
            <Box aria-hidden sx={{ height: Math.max(0, viewport.height - HEADER_H - ROW_H) }} />
          )}
        </Box>
      </Box>

      <Dialog open={deleting !== null} onClose={() => !remove.isPending && setDeleting(null)} slots={{ transition: Zoom }}>
        <DialogTitle>{m.list.deleteTitle}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {m.list.deleteBody(deleting ? rowTitle(deleting) : '')}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button color="inherit" onClick={() => setDeleting(null)} disabled={remove.isPending}>
            {m.common.cancel}
          </Button>
          <Button color="error" variant="contained" onClick={confirmDelete} loading={remove.isPending}>
            {m.common.delete}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

/** 元素的可视尺寸（不含滚动条），随窗口尺寸变化更新 */
function useElementSize(ref: React.RefObject<HTMLElement | null>) {
  const [size, setSize] = useState({ width: 0, height: 0 })
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(() => setSize({ width: el.clientWidth, height: el.clientHeight }))
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref])
  return size
}

function LoadingRows() {
  return (
    <Box aria-busy>
      {Array.from({ length: 6 }, (_, i) => (
        <Box
          key={i}
          sx={{
            display: 'grid',
            gridTemplateColumns: gridColumns,
            height: ROW_H,
            alignItems: 'center',
            px: 2.5,
            gap: 1.5,
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          {[70, 60, 50, 55, 65, 40, 40].map((w, j) => (
            <Skeleton key={j} width={`${w}%`} height={20} />
          ))}
        </Box>
      ))}
    </Box>
  )
}

function EmptyState({ filtered, onCreate, onClear }: { filtered: boolean; onCreate: () => void; onClear: () => void }) {
  const m = useT()
  return (
    <Fade in timeout={400}>
      <Stack sx={{ alignItems: 'center', py: 10, px: 3, gap: 1.5, textAlign: 'center' }}>
        <Box
          sx={(theme) => ({
            width: 64,
            height: 64,
            borderRadius: '50%',
            display: 'grid',
            placeItems: 'center',
            color: 'primary.main',
            bgcolor: theme.alpha((theme.vars ?? theme).palette.primary.main, 0.1),
          })}
        >
          {filtered ? <FilterAltOffOutlined /> : <EventNoteOutlined />}
        </Box>
        <Typography variant="h6">{filtered ? m.list.emptyFiltered : m.list.empty}</Typography>
        <Typography variant="body2" color="text.secondary">
          {filtered ? m.list.emptyFilteredHint : m.list.emptyHint}
        </Typography>
        {filtered ? (
          <Button onClick={onClear} sx={{ mt: 1 }}>
            {m.list.clearFilters}
          </Button>
        ) : (
          <Button variant="contained" startIcon={<Add />} onClick={onCreate} sx={{ mt: 1 }}>
            {m.toolbar.create}
          </Button>
        )}
      </Stack>
    </Fade>
  )
}
