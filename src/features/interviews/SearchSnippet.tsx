import AutoStoriesOutlined from '@mui/icons-material/AutoStoriesOutlined'
import DescriptionOutlined from '@mui/icons-material/DescriptionOutlined'
import QuizOutlined from '@mui/icons-material/QuizOutlined'
import Box from '@mui/material/Box'
import ButtonBase from '@mui/material/ButtonBase'
import { FIELD_LABEL, type Snippet } from '@/features/search/searchIndex'
import type { DocField } from './types'

const ICON: Record<DocField, typeof DescriptionOutlined> = {
  jd: DescriptionOutlined,
  materials: AutoStoriesOutlined,
  questions: QuizOutlined,
}

/** 搜索命中文档正文时，在行下方显示一行片段；点击打开该文档并定位到命中处 */
export function SearchSnippet({ snippet, onOpen }: { snippet: Snippet; onOpen: (field: DocField) => void }) {
  const Icon = ICON[snippet.field]
  return (
    <ButtonBase
      onClick={() => onOpen(snippet.field)}
      aria-label={`打开${FIELD_LABEL[snippet.field]}中的搜索结果`}
      sx={(theme) => {
        const palette = (theme.vars ?? theme).palette
        return {
          width: '100%',
          justifyContent: 'flex-start',
          gap: 1,
          pl: 2.75,
          pr: 2,
          py: 0.75,
          fontSize: 13,
          textAlign: 'left',
          color: 'text.secondary',
          bgcolor: theme.alpha(palette.warning.main, 0.05),
          borderTop: `1px dashed ${theme.alpha(palette.warning.main, 0.25)}`,
          transition: theme.transitions.create('background-color', { duration: 150 }),
          '&:hover': { bgcolor: theme.alpha(palette.warning.main, 0.1), '& .open-hint': { opacity: 1 } },
          '& mark': {
            bgcolor: theme.alpha(palette.warning.main, 0.3),
            color: 'text.primary',
            borderRadius: '3px',
            px: '1px',
          },
        }
      }}
    >
      <Box
        component="span"
        sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, fontWeight: 700, color: 'text.primary', flex: 'none' }}
      >
        <Icon sx={{ fontSize: 16 }} />
        {FIELD_LABEL[snippet.field]}
      </Box>
      <Box component="span" sx={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {snippet.parts.map((p, i) => (p.hit ? <mark key={i}>{p.text}</mark> : <span key={i}>{p.text}</span>))}
      </Box>
      {snippet.count > 1 && (
        <Box component="span" sx={{ flex: 'none', fontSize: 12 }}>
          共 {snippet.count} 处
        </Box>
      )}
      <Box
        component="span"
        className="open-hint"
        sx={{ flex: 'none', fontSize: 12, fontWeight: 600, color: 'primary.main', opacity: 0.6, transition: 'opacity 150ms' }}
      >
        打开 →
      </Box>
    </ButtonBase>
  )
}
