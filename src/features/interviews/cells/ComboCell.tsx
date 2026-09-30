import Autocomplete from '@mui/material/Autocomplete'
import Box from '@mui/material/Box'
import InputBase from '@mui/material/InputBase'
import { useEffect, useRef, useState } from 'react'
import { cellControlSx, flashSx, useFlash } from './cellStyles'

type Props = {
  value: string
  options: string[]
  label: string
  placeholder: string
  autoFocus?: boolean
  bold?: boolean
  onCommit: (value: string) => Promise<unknown>
}

/**
 * 可自由输入、也可从已有值中选择的单元格（Client / Vendor / 面试者 / 面试类型）。
 * 失焦或回车提交，Esc 撤销。
 */
export function ComboCell({ value, options, label, placeholder, autoFocus, bold, onCommit }: Props) {
  const [input, setInput] = useState(value)
  const lastCommitted = useRef(value)
  const focused = useRef(false)
  const cancelled = useRef(false)
  // 只有用户真的输入过或选了选项才提交，避免组件内部的状态同步（如 Autocomplete 的 clear / reset）误写入
  const dirty = useRef(false)
  const { flash, trigger } = useFlash()

  // 外部值变化（他人修改 / 回滚）时同步，但不打断正在输入的内容
  useEffect(() => {
    lastCommitted.current = value
    if (!focused.current) setInput(value)
  }, [value])

  async function commit(raw: string | null) {
    if (!dirty.current) return
    dirty.current = false
    const next = (raw ?? '').trim()
    setInput(next)
    if (next === lastCommitted.current) return
    lastCommitted.current = next
    try {
      await onCommit(next)
      trigger('ok')
    } catch {
      lastCommitted.current = value
      setInput(value)
      trigger('err')
    }
  }

  return (
    <Autocomplete
      freeSolo
      size="small"
      options={options.filter((o) => o !== value)}
      value={value || null}
      inputValue={input}
      onInputChange={(event, v, reason) => {
        if (reason === 'reset') return
        setInput(v)
        // 只有来自键盘输入的变化才算用户编辑
        if (reason === 'input' && event?.type === 'change') dirty.current = true
      }}
      onChange={(_, v, reason) => {
        if (reason !== 'selectOption' && reason !== 'createOption') return
        dirty.current = true
        void commit(v)
      }}
      openOnFocus
      handleHomeEndKeys
      fullWidth
      slotProps={{ paper: { elevation: 8 }, listbox: { sx: { fontSize: 14, maxHeight: 280 } } }}
      renderOption={({ key, ...props }, option) => (
        <Box component="li" key={key} {...props}>
          {option}
        </Box>
      )}
      renderInput={(params) => (
        <InputBase
          ref={params.slotProps.input.ref}
          className={params.slotProps.input.className}
          inputProps={{ ...params.slotProps.htmlInput, 'aria-label': label }}
          placeholder={placeholder}
          autoFocus={autoFocus}
          onFocus={() => (focused.current = true)}
          onKeyDown={(e) => {
            if (e.key !== 'Escape') return
            cancelled.current = true
            dirty.current = false
            setInput(value)
            ;(e.target as HTMLInputElement).blur()
          }}
          onBlur={() => {
            focused.current = false
            if (cancelled.current) {
              cancelled.current = false
              setInput(value)
              return
            }
            void commit(input)
          }}
          sx={(theme) => ({ ...cellControlSx(theme), ...flashSx(theme, flash), ...(bold && { fontWeight: 500 }) })}
        />
      )}
    />
  )
}
