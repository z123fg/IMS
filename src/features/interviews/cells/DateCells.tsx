import Box from '@mui/material/Box'
import type { Theme } from '@mui/material/styles'
import ButtonBase from '@mui/material/ButtonBase'
import { useForkRef } from '@mui/material/utils'
import { DatePicker, type DatePickerFieldProps } from '@mui/x-date-pickers/DatePicker'
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker'
import { usePickerContext } from '@mui/x-date-pickers/hooks'
import dayjs, { type Dayjs } from 'dayjs'
import { useRef, useState } from 'react'
import { formatInterviewAt, formatReceived } from '../format'
import { relativeHint, type RelativeTone } from '../relativeDate'
import { useLang, useT } from '@/i18n'
import { cellControlSx, flashSx, useFlash, type Flash } from './cellStyles'

/** 单元格里显示为文字，点击打开日历弹层（不透传字段属性，全部从 picker 上下文读取） */
function ButtonField({ id }: DatePickerFieldProps) {
  const picker = usePickerContext()
  const lang = useLang()
  const m = useT()
  const ref = useForkRef(picker.triggerRef, picker.rootRef)
  const value = picker.value as Dayjs | null
  const withTime = picker.views.includes('hours')
  const text = value?.isValid()
    ? withTime
      ? formatInterviewAt(value.toISOString(), lang)
      : formatReceived(value.format('YYYY-MM-DD'), lang)
    : ''
  const hint = value?.isValid() ? relativeHint(value, dayjs(), lang) : null
  const past = withTime && value ? value.isBefore(dayjs()) : false

  return (
    <ButtonBase
      id={id}
      ref={ref}
      className={picker.rootClassName}
      aria-label={picker.label ? String(picker.label) : undefined}
      onClick={() => picker.setOpen((o) => !o)}
      sx={(theme) => ({
        ...cellControlSx(theme),
        justifyContent: 'flex-start',
        gap: 1,
        whiteSpace: 'nowrap',
        color: text ? (past ? 'text.secondary' : 'text.primary') : 'text.disabled',
        ...(picker.open && {
          bgcolor: 'background.paper',
          boxShadow: `0 0 0 2px ${theme.alpha((theme.vars ?? theme).palette.primary.main, 0.45)}`,
        }),
      })}
    >
      <Box component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {text || (withTime ? m.cells.setTime : m.cells.setDate)}
      </Box>
      {hint && (
        <Box component="span" sx={(theme) => hintSx(theme, hint.tone)}>
          {hint.label}
        </Box>
      )}
    </ButtonBase>
  )
}

/** 相对日期标签：明天（紧急）/ 今天 / 未来 / 过去 各有样式 */
function hintSx(theme: Theme, tone: RelativeTone) {
  const palette = (theme.vars ?? theme).palette
  const base = { px: 0.75, borderRadius: 999, fontSize: 11, fontWeight: 700, lineHeight: 1.7, flex: 'none' }
  switch (tone) {
    case 'urgent':
      return { ...base, color: 'warning.contrastText', bgcolor: palette.warning.main }
    case 'today':
      return { ...base, color: 'primary.contrastText', bgcolor: palette.primary.main }
    case 'future':
      return { ...base, color: 'primary.main', bgcolor: theme.alpha(palette.primary.main, 0.12) }
    case 'past':
      return { ...base, color: 'text.secondary', bgcolor: 'action.hover', fontWeight: 600 }
  }
}

type CellProps = { value: string | null; label: string; onCommit: (value: string | null) => Promise<unknown> }

/**
 * 弹层内的选择先存为草稿（onChange），确认（onAccept）才提交；
 * 未确认就关闭时恢复为已保存的值。外部值变化时同步草稿。
 */
function usePickerDraft(value: string | null, serialize: (d: Dayjs) => string, onCommit: CellProps['onCommit']) {
  const { flash, trigger } = useFlash()
  const toDraft = (v: string | null) => (v ? dayjs(v) : null)
  const [draft, setDraft] = useState<Dayjs | null>(() => toDraft(value))
  const [prev, setPrev] = useState(value)
  const accepted = useRef(false)
  if (value !== prev) {
    setPrev(value)
    setDraft(toDraft(value))
  }

  return {
    flash,
    pickerProps: {
      value: draft,
      onChange: (v: Dayjs | null) => setDraft(v),
      onOpen: () => (accepted.current = false),
      onClose: () => {
        if (!accepted.current) setDraft(toDraft(value))
      },
      onAccept: async (v: Dayjs | null) => {
        accepted.current = true
        const next = v?.isValid() ? serialize(v) : null
        const current = value ? serialize(dayjs(value)) : null
        if (next === current) return
        try {
          await onCommit(next)
          trigger('ok')
        } catch {
          setDraft(toDraft(value))
          trigger('err')
        }
      },
    },
  }
}

const cellBoxSx = (flash: Flash) => (theme: Theme) => ({ width: '100%', borderRadius: '8px', ...flashSx(theme, flash) })

/** 收到面试日期：仅日期（YYYY-MM-DD） */
export function DateCell({ value, label, onCommit }: CellProps) {
  const { flash, pickerProps } = usePickerDraft(value, (d) => d.format('YYYY-MM-DD'), onCommit)
  return (
    <Box sx={cellBoxSx(flash)}>
      <DatePicker
        label={label}
        {...pickerProps}
        slots={{ field: ButtonField }}
        slotProps={{ actionBar: { actions: ['clear', 'today'] } }}
      />
    </Box>
  )
}

/** 面试日期：日期 + 时间，按本地时区显示，存 ISO 时间戳 */
export function DateTimeCell({ value, label, onCommit }: CellProps) {
  const { flash, pickerProps } = usePickerDraft(value, (d) => d.toISOString(), onCommit)
  return (
    <Box sx={cellBoxSx(flash)}>
      <DateTimePicker
        label={label}
        {...pickerProps}
        ampm={false}
        minutesStep={5}
        slots={{ field: ButtonField }}
        slotProps={{ actionBar: { actions: ['clear', 'today', 'accept'] } }}
      />
    </Box>
  )
}
