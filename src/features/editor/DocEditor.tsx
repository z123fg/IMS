import CloudDoneOutlined from '@mui/icons-material/CloudDoneOutlined'
import DescriptionOutlined from '@mui/icons-material/DescriptionOutlined'
import AutoStoriesOutlined from '@mui/icons-material/AutoStoriesOutlined'
import EditOutlined from '@mui/icons-material/EditOutlined'
import ErrorOutline from '@mui/icons-material/ErrorOutlineOutlined'
import ExpandLess from '@mui/icons-material/ExpandLess'
import PictureAsPdfOutlined from '@mui/icons-material/PictureAsPdfOutlined'
import QuizOutlined from '@mui/icons-material/QuizOutlined'
import TextSnippetOutlined from '@mui/icons-material/TextSnippetOutlined'
import WarningAmberOutlined from '@mui/icons-material/WarningAmberOutlined'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import Divider from '@mui/material/Divider'
import Fade from '@mui/material/Fade'
import IconButton from '@mui/material/IconButton'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Tooltip from '@mui/material/Tooltip'
import type { Editor, JSONContent } from '@tiptap/core'
import { useEditor } from '@tiptap/react'
import {
  LinkBubbleMenu,
  RichTextContent,
  RichTextEditorProvider,
  TableBubbleMenu,
  type ImageNodeAttributes,
} from 'mui-tiptap'
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { exportDocument } from '@/features/export/exportDoc'
import type { ExportTarget } from '@/features/export/renderHtml'
import { fetchDoc } from '@/features/interviews/api'
import { errorMessage } from '@/features/interviews/queries'
import type { DocField, Interview } from '@/features/interviews/types'
import { t, useLang, useT } from '@/i18n'
import { notify } from '@/lib/notify'
import { serializeDoc } from './doc'
import type { SaveStatus } from './DocSaver'
import { EditorControls } from './EditorControls'
import { buildExtensions } from './extensions'
import { SEARCH_HIT_CLASS, scrollToFirstHit, SearchHighlight, setSearchTerms } from './searchHighlight'
import { isImageFile, uploadImages, type UploadedImage } from './images'
import { stickyPanelHeaderSx } from './panelLayout'
import { useDocAutosave } from './useDocAutosave'


type PanelBarProps = {
  field: DocField
  onSwitch: (field: DocField) => void
  onClose: () => void
  children?: ReactNode
}

/** 面板顶栏：JD / 材料切换 + 右侧操作；加载中也会显示 */
export function PanelBar({ field, onSwitch, onClose, children }: PanelBarProps) {
  const m = useT()
  return (
    <Stack direction="row" sx={{ alignItems: 'center', gap: 1, px: 1.5, height: 46 }}>
      <Tabs
        value={field}
        onChange={(_, v: DocField) => onSwitch(v)}
        sx={{
          minHeight: 36,
          '& .MuiTab-root': { minHeight: 36, py: 0, px: 1.5, fontWeight: 600, fontSize: 14 },
          '& .MuiTabs-indicator': { height: 3, borderRadius: 3 },
        }}
      >
        <Tab value="jd" label={m.docs.jd} icon={<DescriptionOutlined sx={{ fontSize: 18 }} />} iconPosition="start" />
        <Tab value="materials" label={m.docs.materials} icon={<AutoStoriesOutlined sx={{ fontSize: 18 }} />} iconPosition="start" />
        <Tab value="questions" label={m.docs.questions} icon={<QuizOutlined sx={{ fontSize: 18 }} />} iconPosition="start" />
      </Tabs>
      {children}
      <Tooltip title={m.editor.collapse}>
        <IconButton size="small" onClick={onClose} aria-label={m.editor.collapsePanel}>
          <ExpandLess />
        </IconButton>
      </Tooltip>
    </Stack>
  )
}


const STATUS: Record<SaveStatus, { icon: ReactNode; color: string }> = {
  saved: { icon: <CloudDoneOutlined sx={{ fontSize: 16 }} />, color: 'text.secondary' },
  dirty: { icon: <EditOutlined sx={{ fontSize: 16 }} />, color: 'text.secondary' },
  saving: { icon: <CircularProgress size={12} thickness={5} />, color: 'text.secondary' },
  error: { icon: <ErrorOutline sx={{ fontSize: 16 }} />, color: 'error.main' },
  conflict: { icon: <WarningAmberOutlined sx={{ fontSize: 16 }} />, color: 'warning.main' },
}

type IndicatorProps = { status: SaveStatus; uploading: number; onRetry: () => void; onResolve: () => void }

function SaveIndicator({ status, uploading, onRetry, onResolve }: IndicatorProps) {
  const s = STATUS[status]
  const m = useT()
  return (
    <Stack direction="row" sx={{ alignItems: 'center', gap: 1, ml: 1, minWidth: 0 }} aria-live="polite">
      <Fade in key={status} timeout={250}>
        <Stack direction="row" sx={{ alignItems: 'center', gap: 0.5, color: s.color, fontSize: 13, whiteSpace: 'nowrap' }}>
          {s.icon}
          {m.editor.status[status]}
          {status === 'error' && (
            <Button size="small" color="error" onClick={onRetry} sx={{ ml: 0.5, minWidth: 0, py: 0 }}>
              {m.common.retry}
            </Button>
          )}
          {status === 'conflict' && (
            <Button size="small" color="warning" onClick={onResolve} sx={{ ml: 0.5, minWidth: 0, py: 0 }}>
              {m.editor.resolve}
            </Button>
          )}
        </Stack>
      </Fade>
      {uploading > 0 && (
        <Stack direction="row" sx={{ alignItems: 'center', gap: 0.5, color: 'primary.main', fontSize: 13, whiteSpace: 'nowrap' }}>
          <CircularProgress size={12} thickness={5} />
          {m.editor.uploading}
        </Stack>
      )}
    </Stack>
  )
}

function insertImageNodes(editor: Editor | null, images: (ImageNodeAttributes | UploadedImage)[], pos?: number) {
  if (!editor || images.length === 0) return
  const { from, to } = editor.state.selection
  editor
    .chain()
    .focus()
    .insertContentAt(pos ?? { from, to }, images.map((attrs) => ({ type: 'image', attrs })))
    .run()
}

const imageFiles = (dt: DataTransfer | null) => Array.from(dt?.files ?? []).filter(isImageFile)

type Props = {
  row: Interview
  field: DocField
  initialDoc: JSONContent | null
  initialRev: number
  onSwitch: (field: DocField) => void
  onClose: () => void
  onReload: () => void
  /** 搜索命中词：在文档中高亮，并在打开时滚到第一处 */
  highlight?: string[]
}

export function DocEditor({ row, field, initialDoc, initialRev, onSwitch, onClose, onReload, highlight }: Props) {
  const m = useT()
  const lang = useLang()
  const docLabel = m.docs[field]
  const [conflictOpen, setConflictOpen] = useState(false)
  const [uploading, setUploading] = useState(0)
  const [exporting, setExporting] = useState<ExportTarget | null>(null)
  const { saver, status } = useDocAutosave({ row, field, initialRev, onConflict: () => setConflictOpen(true) })
  const editorRef = useRef<Editor | null>(null)

  async function upload(files: File[]): Promise<UploadedImage[]> {
    setUploading((n) => n + 1)
    try {
      return await uploadImages(row.id, files)
    } catch (err) {
      notify(t().notify.uploadFailed(errorMessage(err)), 'error')
      return []
    } finally {
      setUploading((n) => n - 1)
    }
  }
  const uploadRef = useRef(upload)
  useLayoutEffect(() => {
    uploadRef.current = upload
  })

  // 占位文字按调用时的语言取值
  const extensions = useMemo(() => [...buildExtensions(() => t().editor.placeholder[field]), SearchHighlight], [field])
  const editor = useEditor({
    extensions,
    content: initialDoc ?? '',
    immediatelyRender: true,
    // mui-tiptap 的控件依赖重渲染来刷新激活状态（Tiptap v3 需开启）
    shouldRerenderOnTransaction: true,
    editorProps: {
      handlePaste: (_view, event) => {
        const files = imageFiles(event.clipboardData)
        if (files.length === 0) return false
        event.preventDefault()
        void uploadRef.current(files).then((imgs) => insertImageNodes(editorRef.current, imgs))
        return true
      },
      handleDrop: (view, event, _slice, moved) => {
        if (moved) return false
        const files = imageFiles(event.dataTransfer)
        if (files.length === 0) return false
        event.preventDefault()
        const pos = view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos
        void uploadRef.current(files).then((imgs) => insertImageNodes(editorRef.current, imgs, pos))
        return true
      },
    },
    onUpdate: ({ editor }) => saver.change(editor.isEmpty ? null : serializeDoc(editor.getJSON())),
  })
  useLayoutEffect(() => {
    editorRef.current = editor
  }, [editor])

  // 搜索词变化时更新高亮；首次打开且有命中时，等展开动画结束后滚到第一处
  const highlightKey = (highlight ?? []).join('\u0000')
  const scrolledToHit = useRef(false)
  useEffect(() => {
    if (!editor) return
    const terms = highlightKey ? highlightKey.split('\u0000') : []
    setSearchTerms(editor, terms)
    if (terms.length === 0 || scrolledToHit.current) return
    scrolledToHit.current = true
    const timer = setTimeout(() => scrollToFirstHit(editor), 450)
    return () => clearTimeout(timer)
  }, [editor, highlightKey])

  // 切换语言后刷新占位文字（Placeholder 装饰只在事务时重算）
  useEffect(() => {
    if (editor && !editor.isDestroyed) editor.view.dispatch(editor.state.tr)
  }, [editor, lang])

  async function onExport(kind: ExportTarget) {
    if (!editor) return
    setExporting(kind)
    try {
      await exportDocument(kind, editor.getJSON(), row, field)
    } catch (err) {
      notify(t().notify.exportFailed(errorMessage(err)), 'error')
    } finally {
      setExporting(null)
    }
  }

  async function overwrite() {
    setConflictOpen(false)
    try {
      const { rev } = await fetchDoc(row.id, field)
      await saver.overwrite(rev)
    } catch (err) {
      notify(t().notify.overwriteFailed(errorMessage(err)), 'error')
    }
  }

  return (
    <RichTextEditorProvider editor={editor}>
      <Box sx={stickyPanelHeaderSx}>
        <PanelBar field={field} onSwitch={onSwitch} onClose={onClose}>
          <SaveIndicator
            status={status}
            uploading={uploading}
            onRetry={() => void saver.flush()}
            onResolve={() => setConflictOpen(true)}
          />
          <Box sx={{ flex: 1 }} />
          <Tooltip title={m.editor.exportPdf(docLabel)}>
            <Button
              size="small"
              color="inherit"
              startIcon={<PictureAsPdfOutlined />}
              loading={exporting === 'pdf'}
              disabled={exporting !== null}
              onClick={() => onExport('pdf')}
            >
              PDF
            </Button>
          </Tooltip>
          <Tooltip title={m.editor.exportWord(docLabel)}>
            <Button
              size="small"
              color="inherit"
              startIcon={<TextSnippetOutlined />}
              loading={exporting === 'docx'}
              disabled={exporting !== null}
              onClick={() => onExport('docx')}
            >
              Word
            </Button>
          </Tooltip>
          <Divider orientation="vertical" flexItem sx={{ my: 1.25, mx: 0.5 }} />
        </PanelBar>
        <Divider />
        <Box sx={{ px: 1.5, py: 0.5 }}>
          <EditorControls
            onUploadFiles={(files) => upload(files)}
            insertImages={({ images }) => insertImageNodes(editor, images)}
          />
        </Box>
      </Box>

      <Box sx={{ px: { xs: 1.5, md: 3 }, py: 4 }}>
        <Fade in timeout={300}>
          <Paper
            elevation={0}
            onMouseDown={(e) => {
              // 点击纸张空白处也能聚焦到文末
              if (e.target === e.currentTarget) {
                e.preventDefault()
                editor?.commands.focus('end')
              }
            }}
            sx={{
              maxWidth: 860,
              mx: 'auto',
              minHeight: '60vh',
              px: { xs: 3, md: 8 },
              py: 6,
              borderRadius: 2,
              border: 1,
              borderColor: 'divider',
              boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04), 0 12px 32px -18px rgba(15, 23, 42, 0.25)',
              cursor: 'text',
            }}
          >
            <RichTextContent
              sx={{
                [`& .${SEARCH_HIT_CLASS}`]: {
                  bgcolor: 'rgba(var(--mui-palette-warning-mainChannel) / 0.35)',
                  borderRadius: '3px',
                  boxShadow: '0 0 0 1px rgba(var(--mui-palette-warning-mainChannel) / 0.35)',
                },
                '& .ProseMirror': {
                  minHeight: '48vh',
                  fontSize: 15,
                  lineHeight: 1.7,
                  outline: 'none',
                  '& p.is-editor-empty:first-of-type::before': {
                    content: 'attr(data-placeholder)',
                    float: 'left',
                    height: 0,
                    pointerEvents: 'none',
                    color: 'text.disabled',
                  },
                },
              }}
            />
          </Paper>
        </Fade>
      </Box>

      <LinkBubbleMenu labels={m.editor.linkMenu} />
      <TableBubbleMenu labels={m.editor.tableMenu} />

      <Dialog open={conflictOpen} onClose={() => setConflictOpen(false)}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningAmberOutlined color="warning" /> {m.editor.conflictTitle(docLabel)}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {m.editor.conflictBody1}
            <br />
            {m.editor.conflictBody2}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setConflictOpen(false)} color="inherit">
            {m.editor.later}
          </Button>
          <Button onClick={onReload}>{m.editor.reload}</Button>
          <Button onClick={overwrite} variant="contained" color="warning">
            {m.editor.overwrite}
          </Button>
        </DialogActions>
      </Dialog>
    </RichTextEditorProvider>
  )
}
