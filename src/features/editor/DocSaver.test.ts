import type { JSONContent } from '@tiptap/core'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DocSaver, waitForPendingSave, type SaveStatus } from './DocSaver'

const d = (text: string): JSONContent => ({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text }] }] })

function deferred<T>() {
  let resolve!: (v: T) => void
  let reject!: (e: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

describe('DocSaver', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  function setup(save: (doc: JSONContent | null, rev: number) => Promise<{ rev: number } | null>) {
    const statuses: SaveStatus[] = []
    const onConflict = vi.fn()
    const onError = vi.fn()
    const onSaved = vi.fn()
    const saver = new DocSaver('k', { rev: 3, save, delay: 1000, onStatus: (s) => statuses.push(s), onConflict, onError, onSaved })
    return { saver, statuses, onConflict, onError, onSaved }
  }

  it('停止输入后防抖保存最新内容，并带上版本号', async () => {
    const save = vi.fn(async (_doc: JSONContent | null, rev: number) => ({ rev: rev + 1 }))
    const { saver, statuses } = setup(save)
    saver.change(d('a'))
    saver.change(d('ab'))
    await vi.advanceTimersByTimeAsync(999)
    expect(save).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(1)
    expect(save).toHaveBeenCalledTimes(1)
    expect(save).toHaveBeenCalledWith(d('ab'), 3)
    expect(statuses).toEqual(['dirty', 'saving', 'saved'])

    saver.change(d('abc'))
    await saver.flush()
    expect(save).toHaveBeenLastCalledWith(d('abc'), 4)
  })

  it('没有修改时 flush 不发请求', async () => {
    const save = vi.fn(async () => ({ rev: 1 }))
    const { saver } = setup(save)
    await saver.flush()
    expect(save).not.toHaveBeenCalled()
  })

  it('保存在途时的新修改会在其结束后再保存，且同一时间只有一个请求', async () => {
    const first = deferred<{ rev: number }>()
    const save = vi.fn((_doc: JSONContent | null, rev: number) =>
      rev === 3 ? first.promise : Promise.resolve({ rev: rev + 1 }),
    )
    const { saver } = setup(save)
    saver.change(d('a'))
    const p1 = saver.flush()
    saver.change(d('ab'))
    const p2 = saver.flush()
    expect(save).toHaveBeenCalledTimes(1)
    expect(saver.hasUnsavedChanges).toBe(true)
    first.resolve({ rev: 4 })
    await p1
    await p2
    expect(save).toHaveBeenCalledTimes(2)
    expect(save).toHaveBeenLastCalledWith(d('ab'), 4)
    expect(saver.status).toBe('saved')
    expect(saver.hasUnsavedChanges).toBe(false)
  })

  it('冲突时停止自动保存，覆盖保存使用新的版本号', async () => {
    const save = vi.fn(async (_doc: JSONContent | null, rev: number) => (rev === 3 ? null : { rev: rev + 1 }))
    const { saver, onConflict } = setup(save)
    saver.change(d('mine'))
    await saver.flush()
    expect(saver.status).toBe('conflict')
    expect(onConflict).toHaveBeenCalledTimes(1)

    saver.change(d('mine 2'))
    await vi.advanceTimersByTimeAsync(2000)
    expect(save).toHaveBeenCalledTimes(1)

    await saver.overwrite(7)
    expect(save).toHaveBeenLastCalledWith(d('mine 2'), 7)
    expect(saver.status).toBe('saved')
  })

  it('失败后保持未保存，可重试', async () => {
    let fail = true
    const save = vi.fn(async (_doc: JSONContent | null, rev: number) => {
      if (fail) throw new Error('network')
      return { rev: rev + 1 }
    })
    const { saver, onError } = setup(save)
    saver.change(d('a'))
    await saver.flush()
    expect(saver.status).toBe('error')
    expect(onError).toHaveBeenCalled()
    expect(saver.hasUnsavedChanges).toBe(true)
    fail = false
    await saver.flush()
    expect(saver.status).toBe('saved')
    expect(save).toHaveBeenLastCalledWith(d('a'), 3)
  })

  it('waitForPendingSave 等待同一文档的在途保存', async () => {
    const gate = deferred<{ rev: number }>()
    const { saver } = setup(() => gate.promise)
    saver.change(d('a'))
    void saver.flush()
    let done = false
    const waiting = waitForPendingSave('k').then(() => (done = true))
    await Promise.resolve()
    expect(done).toBe(false)
    gate.resolve({ rev: 4 })
    await waiting
    expect(done).toBe(true)
  })
})
