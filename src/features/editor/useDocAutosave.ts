import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { saveDoc, type SavedDoc } from '@/features/interviews/api'
import { applySavedDoc, errorMessage } from '@/features/interviews/queries'
import { DOC_LABEL, rowTitle, type DocField, type Interview } from '@/features/interviews/types'
import { notify } from '@/lib/notify'
import { DocSaver, type SaveStatus } from './DocSaver'

export const docKey = (id: string, field: DocField) => `${id}:${field}`

export function useDocAutosave(opts: {
  row: Interview
  field: DocField
  initialRev: number
  onConflict: () => void
}) {
  const qc = useQueryClient()
  const [status, setStatus] = useState<SaveStatus>('saved')
  const mounted = useRef(false)
  const onConflict = useRef(opts.onConflict)
  useLayoutEffect(() => {
    onConflict.current = opts.onConflict
  })

  const [saver] = useState(() => {
    const { row, field } = opts
    const what = `「${rowTitle(row)}」的${DOC_LABEL[field]}`
    return new DocSaver<SavedDoc>(docKey(row.id, field), {
      rev: opts.initialRev,
      save: (doc, rev) => saveDoc(row.id, field, doc, rev),
      onStatus: setStatus,
      onSaved: (doc, result) => applySavedDoc(qc, row.id, field, doc, result),
      // 面板已收起时（卸载后才完成的保存）用全局提示告知结果
      onConflict: () =>
        mounted.current ? onConflict.current() : notify(`${what}未保存：他人已修改了这份文档`, 'error'),
      onError: (err) => notify(`${what}保存失败：${errorMessage(err)}`, 'error'),
    })
  })

  // 收起 / 切换文档 / 卸载时立即保存
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      void saver.flush()
    }
  }, [saver])

  // 关闭或刷新页面前还有未保存内容时提示
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!saver.hasUnsavedChanges) return
      void saver.flush()
      e.preventDefault()
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [saver])

  return { saver, status }
}
