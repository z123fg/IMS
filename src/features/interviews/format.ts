import dayjs from 'dayjs'

export function formatReceived(date: string | null): string {
  if (!date) return ''
  const d = dayjs(date)
  return d.format(d.isSame(dayjs(), 'year') ? 'M月D日' : 'YYYY年M月D日')
}

export function formatInterviewAt(iso: string | null): string {
  if (!iso) return ''
  const d = dayjs(iso)
  return d.format(d.isSame(dayjs(), 'year') ? 'M月D日 HH:mm' : 'YYYY年M月D日 HH:mm')
}
