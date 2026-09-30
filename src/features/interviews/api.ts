import type { JSONContent } from '@tiptap/core'
import dayjs from 'dayjs'
import type { Database, Json } from '@/lib/database.types'
import { IMAGE_BUCKET, supabase } from '@/lib/supabase'
import { revField, type DocField, type FieldPatch, type Interview } from './types'

type Update = Database['public']['Tables']['interviews']['Update']

export async function fetchInterviews(): Promise<Interview[]> {
  const { data, error } = await supabase
    .from('interviews')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as unknown as Interview[]
}

export async function createInterview(): Promise<Interview> {
  // 用浏览器本地日期，避免数据库 UTC 时区导致「收到日期」差一天
  const { data, error } = await supabase
    .from('interviews')
    .insert({ received_at: dayjs().format('YYYY-MM-DD') })
    .select()
    .single()
  if (error) throw error
  return data as unknown as Interview
}

export async function updateInterview(id: string, patch: FieldPatch): Promise<Interview> {
  const { data, error } = await supabase
    .from('interviews')
    .update(patch)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as unknown as Interview
}

export async function deleteInterview(id: string): Promise<void> {
  const { error } = await supabase.from('interviews').delete().eq('id', id)
  if (error) throw error
  // 先删行再清理图片：图片清理失败只会留下孤儿文件，不影响数据
  const bucket = supabase.storage.from(IMAGE_BUCKET)
  const { data: files } = await bucket.list(id, { limit: 1000 })
  if (files?.length) await bucket.remove(files.map((f) => `${id}/${f.name}`))
}

export async function fetchDoc(
  id: string,
  field: DocField,
): Promise<{ doc: JSONContent | null; rev: number }> {
  const { data, error } = await supabase.from('interviews').select('*').eq('id', id).single()
  if (error) throw error
  return { doc: data[field] as JSONContent | null, rev: data[revField(field)] }
}

export type SavedDoc = { rev: number; updated_at: string }

/** 仅当库中版本号仍等于 expectedRev 时才写入；返回 null 表示冲突（他人已修改或行已删除） */
export async function saveDoc(
  id: string,
  field: DocField,
  doc: JSONContent | null,
  expectedRev: number,
): Promise<SavedDoc | null> {
  const next = expectedRev + 1
  const patch: Update = { [field]: doc as Json, [revField(field)]: next }
  const { data, error } = await supabase
    .from('interviews')
    .update(patch)
    .eq('id', id)
    .eq(revField(field), expectedRev)
    .select('updated_at')
  if (error) throw error
  if (data.length === 0) return null
  return { rev: next, updated_at: data[0].updated_at }
}
