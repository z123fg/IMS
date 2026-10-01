import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Skeleton from '@mui/material/Skeleton'
import { useQuery } from '@tanstack/react-query'
import { collectImagePaths, hydrateDoc } from '@/features/editor/doc'
import { DocEditor, PanelBar } from '@/features/editor/DocEditor'
import { stickyPanelHeaderSx } from '@/features/editor/panelLayout'
import { waitForPendingSave } from '@/features/editor/DocSaver'
import { signImagePaths } from '@/features/editor/images'
import { docKey } from '@/features/editor/useDocAutosave'
import { useT } from '@/i18n'
import { fetchDoc } from './api'
import { errorMessage } from './queries'
import type { DocField, Interview } from './types'

async function loadDoc(id: string, field: DocField) {
  // 上一次打开的保存可能还在途：等它结束再读，拿到最新版本号
  await waitForPendingSave(docKey(id, field))
  const { doc, rev } = await fetchDoc(id, field)
  const urls = await signImagePaths(collectImagePaths(doc))
  return { doc: doc ? hydrateDoc(doc, urls) : null, rev }
}

type Props = {
  row: Interview
  field: DocField
  onSwitch: (field: DocField) => void
  onClose: () => void
  highlight?: string[]
}

export function DocPanel({ row, field, onSwitch, onClose, highlight }: Props) {
  const m = useT()
  const q = useQuery({
    queryKey: ['doc', row.id, field],
    queryFn: () => loadDoc(row.id, field),
    staleTime: Infinity,
    gcTime: 0,
    refetchOnWindowFocus: false,
  })

  return (
    <Box
      sx={(theme) => ({
        bgcolor: theme.alpha((theme.vars ?? theme).palette.primary.main, 0.035),
        borderTop: 1,
        borderColor: 'divider',
      })}
    >
      {q.isSuccess ? (
        <DocEditor
          key={q.dataUpdatedAt}
          row={row}
          field={field}
          initialDoc={q.data.doc}
          initialRev={q.data.rev}
          onSwitch={onSwitch}
          onClose={onClose}
          onReload={() => void q.refetch()}
          highlight={highlight}
        />
      ) : (
        <>
          <Box sx={stickyPanelHeaderSx}>
            <PanelBar field={field} onSwitch={onSwitch} onClose={onClose} />
          </Box>
          <Box sx={{ px: 3, py: 4 }}>
            {q.isError ? (
              <Alert
                severity="error"
                sx={{ maxWidth: 860, mx: 'auto' }}
                action={
                  <Button color="inherit" size="small" onClick={() => void q.refetch()}>
                    {m.common.retry}
                  </Button>
                }
              >
                {m.common.loadFailed(errorMessage(q.error))}
              </Alert>
            ) : (
              <Paper
                elevation={0}
                sx={{ maxWidth: 860, mx: 'auto', minHeight: '40vh', px: 8, py: 6, border: 1, borderColor: 'divider' }}
              >
                <Skeleton width="45%" height={36} />
                <Skeleton width="92%" />
                <Skeleton width="86%" />
                <Skeleton width="70%" />
                <Skeleton width="80%" sx={{ mt: 3 }} />
                <Skeleton width="60%" />
              </Paper>
            )}
          </Box>
        </>
      )}
    </Box>
  )
}
