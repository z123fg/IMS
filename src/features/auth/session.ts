import type { Session } from '@supabase/supabase-js'
import { useSyncExternalStore } from 'react'
import { supabase } from '@/lib/supabase'

let current: Session | null = null
const listeners = new Set<() => void>()

supabase.auth.onAuthStateChange((_event, session) => {
  current = session
  for (const l of listeners) l()
})

export async function getSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession()
  current = data.session
  return data.session
}

export function useSession(): Session | null {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => current,
  )
}

/** 只允许站内相对路径，防止 ?redirect= 被用作开放重定向 */
export function safeRedirect(target: string | undefined): string {
  return target && target.startsWith('/') && !target.startsWith('//') ? target : '/'
}
