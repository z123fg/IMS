import Alert, { type AlertColor } from '@mui/material/Alert'
import Slide, { type SlideProps } from '@mui/material/Slide'
import Snackbar from '@mui/material/Snackbar'
import { useSyncExternalStore } from 'react'

// 全局提示：组件卸载后（例如收起面板时的自动保存）也能弹出结果
type Notice = { id: number; message: string; severity: AlertColor }

let current: Notice | null = null
let seq = 0
const listeners = new Set<() => void>()

function emit() {
  for (const l of listeners) l()
}

export function notify(message: string, severity: AlertColor = 'info') {
  current = { id: ++seq, message, severity }
  emit()
}

function dismiss(id: number) {
  if (current?.id === id) {
    current = null
    emit()
  }
}

function subscribe(l: () => void) {
  listeners.add(l)
  return () => listeners.delete(l)
}

function SlideUp(props: SlideProps) {
  return <Slide {...props} direction="up" />
}

export function Notifier() {
  const notice = useSyncExternalStore(subscribe, () => current)
  return (
    <Snackbar
      key={notice?.id}
      open={notice !== null}
      autoHideDuration={notice?.severity === 'error' ? 6000 : 3000}
      onClose={(_, reason) => reason !== 'clickaway' && notice && dismiss(notice.id)}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      slots={{ transition: SlideUp }}
    >
      <Alert
        variant="filled"
        severity={notice?.severity ?? 'info'}
        onClose={() => notice && dismiss(notice.id)}
        sx={{ boxShadow: 6, minWidth: 280 }}
      >
        {notice?.message}
      </Alert>
    </Snackbar>
  )
}
