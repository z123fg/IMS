import type { Extensions } from '@tiptap/core'
import Highlight from '@tiptap/extension-highlight'
import { TaskItem, TaskList } from '@tiptap/extension-list'
import { TableCell, TableHeader, TableRow } from '@tiptap/extension-table'
import TextAlign from '@tiptap/extension-text-align'
import { Color, FontSize, TextStyle } from '@tiptap/extension-text-style'
import { Placeholder } from '@tiptap/extensions'
import StarterKit from '@tiptap/starter-kit'
import { LinkBubbleMenuHandler, ResizableImage, TableImproved } from 'mui-tiptap'

/** 图片节点额外记录 Storage 路径；src 只是临时签名链接 */
export const StoredImage = ResizableImage.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      storagePath: {
        default: null,
        parseHTML: (el: HTMLElement) => el.getAttribute('data-storage-path'),
        renderHTML: (attrs: Record<string, unknown>) =>
          attrs.storagePath ? { 'data-storage-path': attrs.storagePath } : {},
      },
    }
  },
})

/**
 * 编辑器与导出共用同一套扩展，保证 schema 一致。
 * placeholder 可传函数：每次渲染时取值，切换界面语言后无需重建编辑器。
 */
export function buildExtensions(placeholder: string | (() => string) = ''): Extensions {
  return [
    // 表格插件优先级最低，放最前（见 mui-tiptap 文档）
    TableImproved.configure({ resizable: true }),
    TableRow,
    TableHeader,
    TableCell,
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
      link: { openOnClick: false, autolink: true, defaultProtocol: 'https' },
    }),
    LinkBubbleMenuHandler,
    TextStyle,
    Color,
    FontSize,
    Highlight.configure({ multicolor: true }),
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    TaskList,
    TaskItem.configure({ nested: true }),
    StoredImage.configure({ allowBase64: false }),
    Placeholder.configure({ placeholder: typeof placeholder === 'function' ? () => placeholder() : placeholder }),
  ]
}
