import type { JSONContent } from '@tiptap/core'
import { queryOptions, useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { t } from '@/i18n'
import { notify } from '@/lib/notify'
import { createInterview, deleteInterview, fetchInterviews, updateInterview, type SavedDoc } from './api'
import { revField, type DocField, type FieldPatch, type Interview } from './types'

export const interviewsKey = ['interviews'] as const

export const interviewsQuery = queryOptions({
  queryKey: interviewsKey,
  queryFn: fetchInterviews,
})

export function useInterviews() {
  return useQuery(interviewsQuery)
}

function patchRow(qc: QueryClient, id: string, patch: Partial<Interview>) {
  qc.setQueryData<Interview[]>(interviewsKey, (rows) =>
    rows?.map((r) => (r.id === id ? { ...r, ...patch } : r)),
  )
}

export function errorMessage(err: unknown) {
  if (err && typeof err === 'object' && 'message' in err) return String(err.message)
  return String(err)
}

export function useUpdateInterview() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: FieldPatch }) => updateInterview(id, patch),
    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: interviewsKey })
      const prevRow = qc.getQueryData<Interview[]>(interviewsKey)?.find((r) => r.id === id)
      patchRow(qc, id, patch)
      // 只回滚本次改动的字段，避免覆盖同时进行的其他修改
      const rollback = prevRow
        ? (Object.fromEntries(Object.keys(patch).map((k) => [k, prevRow[k as keyof FieldPatch]])) as FieldPatch)
        : null
      return { rollback }
    },
    onError: (err, { id }, ctx) => {
      if (ctx?.rollback) patchRow(qc, id, ctx.rollback)
      notify(t().notify.saveFailed(errorMessage(err)), 'error')
    },
    onSuccess: (row) => patchRow(qc, row.id, row),
  })
}

export function useCreateInterview() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createInterview,
    onSuccess: (row) => {
      qc.setQueryData<Interview[]>(interviewsKey, (rows) => [row, ...(rows ?? [])])
    },
    onError: (err) => notify(t().notify.createFailed(errorMessage(err)), 'error'),
  })
}

export function useDeleteInterview() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteInterview(id),
    onSuccess: (_, id) => {
      qc.setQueryData<Interview[]>(interviewsKey, (rows) => rows?.filter((r) => r.id !== id))
      notify(t().notify.deleted, 'success')
    },
    onError: (err) => notify(t().notify.deleteFailed(errorMessage(err)), 'error'),
  })
}

/** 文档保存成功后同步列表缓存（单元格上的「有内容」标记依赖它） */
export function applySavedDoc(
  qc: QueryClient,
  id: string,
  field: DocField,
  doc: JSONContent | null,
  saved: SavedDoc,
) {
  patchRow(qc, id, { [field]: doc, [revField(field)]: saved.rev, updated_at: saved.updated_at })
}
