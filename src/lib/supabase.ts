import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

if (!url || !key) {
  throw new Error('缺少 VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY，请参考 .env.example 创建 .env.local')
}

export const supabase = createClient<Database>(url, key)

export const IMAGE_BUCKET = 'ims-images'
