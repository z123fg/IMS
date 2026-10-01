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
import { useT } from '@/i18n'

const TEXT_COLORS = ['#1f2433', '#667085', '#dc2626', '#ea580c', '#ca8a04', '#16a34a', '#0891b2', '#2563eb', '#7c3aed', '#db2777']
const HIGHLIGHTS = ['#fef08a', '#bbf7d0', '#bae6fd', '#fbcfe8', '#fed7aa', '#e9d5ff']

type Props = {
  onUploadFiles: (files: File[]) => Promise<ImageNodeAttributes[]>
  insertImages: (args: { images: ImageNodeAttributes[] }) => void
}

export function EditorControls({ onUploadFiles, insertImages }: Props) {
  const c = useT().editor.controls
  return (
    <MenuControlsContainer>
      <MenuButtonUndo tooltipLabel={c.undo} />
      <MenuButtonRedo tooltipLabel={c.redo} />
      <MenuDivider />
      <MenuSelectHeading
        tooltipTitle={c.blockStyle}
        aria-label={c.blockStyle}
        labels={c.heading}
      />
      <MenuSelectFontSize
        tooltipTitle={c.fontSize}
        aria-label={c.fontSize}
        unsetOptionLabel={c.fontSizeDefault}
        options={['12px', '14px', '16px', '18px', '20px', '24px', '30px', '36px']}
      />
      <MenuDivider />
      <MenuButtonBold tooltipLabel={c.bold} />
      <MenuButtonItalic tooltipLabel={c.italic} />
      <MenuButtonUnderline tooltipLabel={c.underline} />
      <MenuButtonStrikethrough tooltipLabel={c.strike} />
      <MenuButtonTextColor tooltipLabel={c.textColor} swatchColors={TEXT_COLORS.map((value) => ({ value }))} labels={c.color} />
      <MenuButtonHighlightColor tooltipLabel={c.highlight} swatchColors={HIGHLIGHTS.map((value) => ({ value }))} labels={c.color} />
      <MenuDivider />
      <MenuSelectTextAlign
        tooltipTitle={c.align}
        aria-label={c.align}
        options={[
          { value: 'left', label: c.alignLeft, shortcutKeys: ['mod', 'Shift', 'L'], IconComponent: FormatAlignLeft },
          { value: 'center', label: c.alignCenter, shortcutKeys: ['mod', 'Shift', 'E'], IconComponent: FormatAlignCenter },
          { value: 'right', label: c.alignRight, shortcutKeys: ['mod', 'Shift', 'R'], IconComponent: FormatAlignRight },
          { value: 'justify', label: c.alignJustify, shortcutKeys: ['mod', 'Shift', 'J'], IconComponent: FormatAlignJustify },
        ]}
      />
      <MenuDivider />
      <MenuButtonBulletedList tooltipLabel={c.bulletList} />
      <MenuButtonOrderedList tooltipLabel={c.orderedList} />
      <MenuButtonTaskList tooltipLabel={c.taskList} />
      <MenuButtonIndent tooltipLabel={c.indent} />
      <MenuButtonUnindent tooltipLabel={c.unindent} />
      <MenuDivider />
      <MenuButtonEditLink tooltipLabel={c.link} />
      <MenuButtonAddTable tooltipLabel={c.table} />
      <MenuButtonImageUpload
        tooltipLabel={c.image}
        onUploadFiles={onUploadFiles}
        insertImages={({ images }) => insertImages({ images })}
      />
      <MenuButtonBlockquote tooltipLabel={c.blockquote} />
      <MenuButtonCode tooltipLabel={c.code} />
      <MenuButtonCodeBlock tooltipLabel={c.codeBlock} />
      <MenuButtonHorizontalRule tooltipLabel={c.horizontalRule} />
      <MenuDivider />
      <MenuButtonRemoveFormatting tooltipLabel={c.clearFormat} />
    </MenuControlsContainer>
  )
}
