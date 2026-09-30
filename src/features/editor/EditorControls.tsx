import FormatAlignCenter from '@mui/icons-material/FormatAlignCenter'
import FormatAlignJustify from '@mui/icons-material/FormatAlignJustify'
import FormatAlignLeft from '@mui/icons-material/FormatAlignLeft'
import FormatAlignRight from '@mui/icons-material/FormatAlignRight'
import {
  MenuButtonAddTable,
  MenuButtonBlockquote,
  MenuButtonBold,
  MenuButtonBulletedList,
  MenuButtonCode,
  MenuButtonCodeBlock,
  MenuButtonEditLink,
  MenuButtonHighlightColor,
  MenuButtonHorizontalRule,
  MenuButtonImageUpload,
  MenuButtonIndent,
  MenuButtonItalic,
  MenuButtonOrderedList,
  MenuButtonRedo,
  MenuButtonRemoveFormatting,
  MenuButtonStrikethrough,
  MenuButtonTaskList,
  MenuButtonTextColor,
  MenuButtonUnderline,
  MenuButtonUndo,
  MenuButtonUnindent,
  MenuControlsContainer,
  MenuDivider,
  MenuSelectFontSize,
  MenuSelectHeading,
  MenuSelectTextAlign,
  type ImageNodeAttributes,
} from 'mui-tiptap'

const TEXT_COLORS = ['#1f2433', '#667085', '#dc2626', '#ea580c', '#ca8a04', '#16a34a', '#0891b2', '#2563eb', '#7c3aed', '#db2777']
const HIGHLIGHTS = ['#fef08a', '#bbf7d0', '#bae6fd', '#fbcfe8', '#fed7aa', '#e9d5ff']
const COLOR_LABELS = {
  cancelButton: '取消',
  removeColorButton: '清除',
  removeColorButtonTooltipTitle: '移除颜色',
  saveButton: '确定',
  textFieldPlaceholder: '例如 #7cb5ec',
}

type Props = {
  onUploadFiles: (files: File[]) => Promise<ImageNodeAttributes[]>
  insertImages: (args: { images: ImageNodeAttributes[] }) => void
}

export function EditorControls({ onUploadFiles, insertImages }: Props) {
  return (
    <MenuControlsContainer>
      <MenuButtonUndo tooltipLabel="撤销" />
      <MenuButtonRedo tooltipLabel="重做" />
      <MenuDivider />
      <MenuSelectHeading
        tooltipTitle="段落样式"
        aria-label="段落样式"
        labels={{ empty: '样式', paragraph: '正文', heading1: '标题 1', heading2: '标题 2', heading3: '标题 3' }}
      />
      <MenuSelectFontSize
        tooltipTitle="字号"
        aria-label="字号"
        unsetOptionLabel="默认"
        options={['12px', '14px', '16px', '18px', '20px', '24px', '30px', '36px']}
      />
      <MenuDivider />
      <MenuButtonBold tooltipLabel="加粗" />
      <MenuButtonItalic tooltipLabel="斜体" />
      <MenuButtonUnderline tooltipLabel="下划线" />
      <MenuButtonStrikethrough tooltipLabel="删除线" />
      <MenuButtonTextColor tooltipLabel="文字颜色" swatchColors={TEXT_COLORS.map((value) => ({ value }))} labels={COLOR_LABELS} />
      <MenuButtonHighlightColor tooltipLabel="高亮" swatchColors={HIGHLIGHTS.map((value) => ({ value }))} labels={COLOR_LABELS} />
      <MenuDivider />
      <MenuSelectTextAlign
        tooltipTitle="对齐"
        aria-label="对齐方式"
        options={[
          { value: 'left', label: '左对齐', shortcutKeys: ['mod', 'Shift', 'L'], IconComponent: FormatAlignLeft },
          { value: 'center', label: '居中', shortcutKeys: ['mod', 'Shift', 'E'], IconComponent: FormatAlignCenter },
          { value: 'right', label: '右对齐', shortcutKeys: ['mod', 'Shift', 'R'], IconComponent: FormatAlignRight },
          { value: 'justify', label: '两端对齐', shortcutKeys: ['mod', 'Shift', 'J'], IconComponent: FormatAlignJustify },
        ]}
      />
      <MenuDivider />
      <MenuButtonBulletedList tooltipLabel="无序列表" />
      <MenuButtonOrderedList tooltipLabel="有序列表" />
      <MenuButtonTaskList tooltipLabel="任务列表" />
      <MenuButtonIndent tooltipLabel="增加缩进" />
      <MenuButtonUnindent tooltipLabel="减少缩进" />
      <MenuDivider />
      <MenuButtonEditLink tooltipLabel="链接" />
      <MenuButtonAddTable tooltipLabel="插入表格" />
      <MenuButtonImageUpload
        tooltipLabel="插入图片"
        onUploadFiles={onUploadFiles}
        insertImages={({ images }) => insertImages({ images })}
      />
      <MenuButtonBlockquote tooltipLabel="引用" />
      <MenuButtonCode tooltipLabel="行内代码" />
      <MenuButtonCodeBlock tooltipLabel="代码块" />
      <MenuButtonHorizontalRule tooltipLabel="分割线" />
      <MenuDivider />
      <MenuButtonRemoveFormatting tooltipLabel="清除格式" />
    </MenuControlsContainer>
  )
}

export const LINK_MENU_LABELS = {
  viewLinkEditButtonLabel: '编辑',
  viewLinkRemoveButtonLabel: '移除',
  editLinkAddTitle: '添加链接',
  editLinkEditTitle: '编辑链接',
  editLinkCancelButtonLabel: '取消',
  editLinkTextInputLabel: '文字',
  editLinkHrefInputLabel: '链接地址',
  editLinkSaveButtonLabel: '保存',
}

export const TABLE_MENU_LABELS = {
  insertColumnBefore: '左侧插入列',
  insertColumnAfter: '右侧插入列',
  deleteColumn: '删除列',
  insertRowAbove: '上方插入行',
  insertRowBelow: '下方插入行',
  deleteRow: '删除行',
  mergeCells: '合并单元格',
  splitCell: '拆分单元格',
  toggleHeaderRow: '切换标题行',
  toggleHeaderColumn: '切换标题列',
  toggleHeaderCell: '切换标题单元格',
  deleteTable: '删除表格',
}
