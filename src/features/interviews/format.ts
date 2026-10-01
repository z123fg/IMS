import dayjs from 'dayjs'
import type { Lang } from '@/i18n'

const FORMATS = {
  zh: { date: 'M月D日', dateYear: 'YYYY年M月D日', time: 'M月D日 HH:mm', timeYear: 'YYYY年M月D日 HH:mm' },
  en: { date: 'MMM D', dateYear: 'MMM D, YYYY', time: 'MMM D HH:mm', timeYear: 'MMM D, YYYY HH:mm' },
}

export function formatReceived(date: string | null, lang: Lang): string {
  if (!date) return ''
  const d = dayjs(date)
  const f = FORMATS[lang]
  return d.format(d.isSame(dayjs(), 'year') ? f.date : f.dateYear)
}

export function formatInterviewAt(iso: string | null, lang: Lang): string {
  if (!iso) return ''
  const d = dayjs(iso)
  const f = FORMATS[lang]
  return d.format(d.isSame(dayjs(), 'year') ? f.time : f.timeYear)
}
