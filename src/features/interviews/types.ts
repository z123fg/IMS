import type { JSONContent } from '@tiptap/core'
import { t } from '@/i18n'
import type { Database } from '@/lib/database.types'

type Row = Database['public']['Tables']['interviews']['Row']

export const DOC_FIELDS = ['jd', 'materials', 'questions'] as const
export type DocField = (typeof DOC_FIELDS)[number]

export type Interview = Omit<Row, DocField> & Record<DocField, JSONContent | null>

export type FieldPatch = Partial<
  Pick<Interview, 'client' | 'vendor' | 'interviewee' | 'interviewer' | 'interview_type' | 'received_at' | 'interview_at'>
>

export type RevField = `${DocField}_rev`
export const revField = (field: DocField): RevField => `${field}_rev`

export const PRESET_TYPES = ['Screening', 'Technical', 'Managerial', 'HR', 'Final']

export function rowTitle(row: Pick<Interview, 'client' | 'vendor'>) {
  return [row.client, row.vendor].filter(Boolean).join(' · ') || t().common.untitled
}
