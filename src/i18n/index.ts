import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import { useSyncExternalStore } from 'react'
import { en } from './en'
import { zh, type Messages } from './zh'

// 界面语言：组件内用 useT() / useLang()（切换时自动重渲染），组件外用 t()（取调用时的语言）

export type Lang = 'zh' | 'en'
export type { Messages }

const STORAGE_KEY = 'ims.lang'
const MESSAGES: Record<Lang, Messages> = { zh, en }

/**
 * 语言切换入口暂时关闭：界面固定为英文（翻译与切换逻辑保留，改为 true 即可恢复）。
 * 关闭期间忽略浏览器里保存过的选择，否则之前选过中文的人会切不回来。
 */
export const LANG_SWITCH_ENABLED = false

/** 关闭切换时使用的固定语言；端到端测试通过 VITE_UI_LANG=zh 使用中文界面 */
const FIXED_LANG: Lang = import.meta.env.VITE_UI_LANG === 'zh' ? 'zh' : 'en'

function detect(): Lang {
  if (!LANG_SWITCH_ENABLED) return FIXED_LANG
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'zh' || saved === 'en') return saved
  } catch {
    // 隐私模式等场景下 localStorage 不可用，按浏览器语言
  }
  return typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('zh') ? 'zh' : 'en'
}

let current: Lang = detect()
const listeners = new Set<() => void>()

function apply() {
  dayjs.locale(current === 'zh' ? 'zh-cn' : 'en')
  if (typeof document !== 'undefined') {
    document.documentElement.lang = current === 'zh' ? 'zh-CN' : 'en'
    document.title = MESSAGES[current].app.docTitle
  }
}
apply()

export const getLang = () => current

export function setLang(lang: Lang) {
  if (lang === current) return
  current = lang
  try {
    localStorage.setItem(STORAGE_KEY, lang)
  } catch {
    // 忽略：只影响下次打开时的默认语言
  }
  apply()
  for (const l of listeners) l()
}

/** 组件外使用（提示消息、导出文件名等） */
export const t = (): Messages => MESSAGES[current]

function subscribe(l: () => void) {
  listeners.add(l)
  return () => listeners.delete(l)
}

export function useLang(): Lang {
  return useSyncExternalStore(subscribe, getLang)
}

export function useT(): Messages {
  return MESSAGES[useLang()]
}
