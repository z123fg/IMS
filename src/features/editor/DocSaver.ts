import type { JSONContent } from '@tiptap/core'

export type SaveStatus = 'saved' | 'dirty' | 'saving' | 'error' | 'conflict'

export type SaveResult = { rev: number }

type Options<R extends SaveResult> = {
  rev: number
  /** 以 expectedRev 为前提写入；返回 null 表示冲突 */
  save: (doc: JSONContent | null, expectedRev: number) => Promise<R | null>
  onStatus?: (s: SaveStatus) => void
  onSaved?: (doc: JSONContent | null, result: R) => void
  onConflict?: () => void
  onError?: (err: unknown) => void
  delay?: number
}

// 模块级：同一文档还在保存时，重新打开要先等它结束，否则会读到旧版本号而误判冲突
const pending = new Map<string, Promise<void>>()

export function waitForPendingSave(key: string): Promise<void> {
  return pending.get(key) ?? Promise.resolve()
}

/**
 * 防抖自动保存 + 乐观并发控制。
 * - change()：记录最新内容，停止输入 delay 毫秒后保存
 * - flush()：立即保存（收起 / 切换 / 卸载时调用）
 * - 同一时间只有一个请求在途；在途期间的新修改会在其结束后再保存
 */
export class DocSaver<R extends SaveResult = SaveResult> {
  private rev: number
  private latest: JSONContent | null = null
  private dirty = false
  private timer: ReturnType<typeof setTimeout> | undefined
  private inflight: Promise<void> | null = null
  private _status: SaveStatus = 'saved'
  private readonly key: string
  private readonly opts: Options<R>

  constructor(key: string, opts: Options<R>) {
    this.key = key
    this.opts = opts
    this.rev = opts.rev
  }

  get status() {
    return this._status
  }

  get hasUnsavedChanges() {
    return this.dirty || this.inflight !== null
  }

  private setStatus(s: SaveStatus) {
    if (this._status === s) return
    this._status = s
    this.opts.onStatus?.(s)
  }

  change(doc: JSONContent | null) {
    this.latest = doc
    this.dirty = true
    if (this._status !== 'conflict') this.setStatus(this.inflight ? 'saving' : 'dirty')
    clearTimeout(this.timer)
    this.timer = setTimeout(() => void this.flush(), this.opts.delay ?? 1500)
  }

  flush(): Promise<void> {
    clearTimeout(this.timer)
    // 冲突状态下等待用户选择（重新加载 / 覆盖），不自动写入
    if (this._status === 'conflict') return Promise.resolve()
    if (this.inflight) return this.inflight.then(() => this.flush())
    if (!this.dirty) return Promise.resolve()

    const doc = this.latest
    this.dirty = false
    this.setStatus('saving')
    const run = this.opts
      .save(doc, this.rev)
      .then(
        (result) => {
          if (result === null) {
            this.dirty = true
            this.setStatus('conflict')
            this.opts.onConflict?.()
            return
          }
          this.rev = result.rev
          this.opts.onSaved?.(doc, result)
          this.setStatus(this.dirty ? 'dirty' : 'saved')
        },
        (err: unknown) => {
          this.dirty = true
          this.setStatus('error')
          this.opts.onError?.(err)
        },
      )
      .finally(() => {
        this.inflight = null
        if (pending.get(this.key) === run) pending.delete(this.key)
      })
    this.inflight = run
    pending.set(this.key, run)
    return run
  }

  /** 冲突后选择「覆盖保存」：以库中当前版本号为前提重新写入 */
  overwrite(currentRev: number): Promise<void> {
    this.rev = currentRev
    this.dirty = true
    this.setStatus('dirty')
    return this.flush()
  }

  dispose() {
    clearTimeout(this.timer)
  }
}
