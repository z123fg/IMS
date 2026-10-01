import AutoStoriesOutlined from '@mui/icons-material/AutoStoriesOutlined'
import DescriptionOutlined from '@mui/icons-material/DescriptionOutlined'
import ExpandMore from '@mui/icons-material/ExpandMore'
import QuizOutlined from '@mui/icons-material/QuizOutlined'
import Box from '@mui/material/Box'
import ButtonBase from '@mui/material/ButtonBase'
import { useT } from '@/i18n'
import type { DocField } from '../types'

type Props = {
  field: DocField
  hasContent: boolean
  active: boolean
  onClick: () => void
}

const ICON: Record<DocField, typeof DescriptionOutlined> = {
  jd: DescriptionOutlined,
  materials: AutoStoriesOutlined,
  questions: QuizOutlined,
}

export function DocCell({ field, hasContent, active, onClick }: Props) {
  const Icon = ICON[field]
  const m = useT()
  const label = m.docs[field]
  return (
    <ButtonBase
      onClick={onClick}
      aria-expanded={active}
      aria-label={active ? m.cells.collapse(label) : m.cells.expand(label)}
      sx={(theme) => {
        const palette = (theme.vars ?? theme).palette
        return {
          height: 32,
          pl: 1.1,
          whiteSpace: 'nowrap',
          pr: 0.6,
          gap: 0.6,
          borderRadius: 999,
          border: 1,
          fontSize: 13,
          fontWeight: 600,
          borderColor: active ? 'primary.main' : hasContent ? 'divider' : 'transparent',
          borderStyle: hasContent || active ? 'solid' : 'dashed',
          color: active ? 'primary.main' : hasContent ? 'text.primary' : 'text.secondary',
          bgcolor: active ? theme.alpha(palette.primary.main, 0.1) : 'transparent',
          transition: theme.transitions.create(['background-color', 'border-color', 'color', 'box-shadow'], {
            duration: 180,
          }),
          '&:hover': {
            bgcolor: theme.alpha(palette.primary.main, active ? 0.16 : 0.06),
            borderColor: 'primary.main',
            color: 'primary.main',
          },
          '&:focus-visible': { boxShadow: `0 0 0 3px ${theme.alpha(palette.primary.main, 0.35)}` },
        }
      }}
    >
      <Icon sx={{ fontSize: 17 }} />
      {hasContent ? label : `+ ${label}`}
      {hasContent && !active && (
        <Box
          component="span"
          aria-hidden
          sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'success.main', ml: 0.25 }}
        />
      )}
      <ExpandMore
        sx={{
          fontSize: 18,
          transition: 'transform 220ms ease',
          transform: active ? 'rotate(180deg)' : 'none',
          opacity: active ? 1 : 0.55,
        }}
      />
    </ButtonBase>
  )
}
