import { keyframes, type Theme } from '@mui/material/styles'
import type { SystemStyleObject } from '@mui/system'
import { useCallback, useEffect, useRef, useState } from 'react'

export type Flash = 'ok' | 'err' | null

const flashOk = (theme: Theme) =>
  keyframes`from { background-color: ${theme.alpha((theme.vars ?? theme).palette.success.main, 0.22)}; } to { background-color: transparent; }`
const flashErr = (theme: Theme) =>
  keyframes`from { background-color: ${theme.alpha((theme.vars ?? theme).palette.error.main, 0.22)}; } to { background-color: transparent; }`

/** 提交成功淡绿闪一下，失败淡红 */
export function useFlash() {
  const [flash, setFlash] = useState<Flash>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])
  const trigger = useCallback((f: Exclude<Flash, null>) => {
    clearTimeout(timer.current)
    setFlash(null)
    requestAnimationFrame(() => setFlash(f))
    timer.current = setTimeout(() => setFlash(null), 800)
  }, [])
  return { flash, trigger }
}

export function flashSx(theme: Theme, flash: Flash): SystemStyleObject<Theme> {
  if (!flash) return {}
  return { animation: `${flash === 'ok' ? flashOk(theme) : flashErr(theme)} 800ms ease-out` }
}

/** 「看起来是文字、聚焦才像输入框」 */
export function cellControlSx(theme: Theme): SystemStyleObject<Theme> {
  const palette = (theme.vars ?? theme).palette
  return {
    width: '100%',
    height: 34,
    px: 1,
    borderRadius: '8px',
    fontSize: 14,
    color: 'text.primary',
    transition: theme.transitions.create(['background-color', 'box-shadow'], { duration: 150 }),
    '&:hover': { bgcolor: 'action.hover' },
    '&.Mui-focused, &:focus-visible': {
      bgcolor: 'background.paper',
      boxShadow: `0 0 0 2px ${theme.alpha(palette.primary.main, 0.45)}`,
    },
    '& input': { textOverflow: 'ellipsis', padding: 0 },
    '& input::placeholder': { color: 'text.disabled', opacity: 1 },
  }
}
