import Add from '@mui/icons-material/Add'
import Close from '@mui/icons-material/Close'
import Search from '@mui/icons-material/Search'
import SortOutlined from '@mui/icons-material/SortOutlined'
import Autocomplete from '@mui/material/Autocomplete'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import TextField from '@mui/material/TextField'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Typography from '@mui/material/Typography'
import { useEffect, useRef, useState } from 'react'
import { useT } from '@/i18n'
import type { When } from './filter'

type Props = {
  q: string
  types: string[]
  when: When
  typeOptions: string[]
  shown: number
  total: number
  creating: boolean
  /** 有搜索词时：当前是否按相关度排序 */
  byRelevance: boolean
  onChange: (patch: { q?: string; types?: string[]; when?: When; sort?: 'relevance' }) => void
  onCreate: () => void
}

export function ListToolbar({ q, types, when, typeOptions, shown, total, creating, byRelevance, onChange, onCreate }: Props) {
  const m = useT()
  // 输入框本地受控，URL 更新交给 onChange（避免输入法组字时被打断）
  const [search, setSearch] = useState(q)
  const [prevQ, setPrevQ] = useState(q)
  if (q !== prevQ) {
    setPrevQ(q)
    setSearch(q)
  }

  // 「/」或 ⌘K / Ctrl+K 聚焦搜索框（正在输入时不拦截「/」）
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      const typing = t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName)
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !typing)) {
        e.preventDefault()
        inputRef.current?.focus()
        inputRef.current?.select()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  const searching = q.trim() !== ''
  const isMac = typeof navigator !== 'undefined' && /Mac/.test(navigator.platform)

  return (
    <Box
      sx={{
        px: 2.5,
        py: 1.5,
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        flexWrap: 'wrap',
        flex: 'none',
      }}
    >
      <TextField
        size="small"
        placeholder={m.toolbar.searchPlaceholder}
        value={search}
        inputRef={inputRef}
        onChange={(e) => {
          setSearch(e.target.value)
          onChange({ q: e.target.value })
        }}
        onKeyDown={(e) => {
          if (e.key !== 'Escape') return
          if (search) {
            setSearch('')
            onChange({ q: '' })
          } else (e.target as HTMLInputElement).blur()
        }}
        sx={{ width: 340, '& .MuiOutlinedInput-root': { bgcolor: 'background.paper' } }}
        slotProps={{
          htmlInput: { 'aria-label': m.toolbar.search },
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <Search fontSize="small" />
              </InputAdornment>
            ),
            endAdornment: search ? (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  edge="end"
                  aria-label={m.toolbar.clearSearch}
                  onClick={() => {
                    setSearch('')
                    onChange({ q: '' })
                    inputRef.current?.focus()
                  }}
                >
                  <Close fontSize="small" />
                </IconButton>
              </InputAdornment>
            ) : (
              <InputAdornment position="end">
                <Box
                  component="kbd"
                  sx={{
                    fontFamily: 'inherit',
                    fontSize: 11,
                    fontWeight: 600,
                    color: 'text.secondary',
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 1,
                    px: 0.75,
                    lineHeight: 1.6,
                  }}
                >
                  {isMac ? '⌘K' : 'Ctrl K'}
                </Box>
              </InputAdornment>
            ),
          },
        }}
      />
      <Autocomplete
        multiple
        size="small"
        options={typeOptions}
        value={types}
        onChange={(_, v) => onChange({ types: v })}
        limitTags={2}
        disableCloseOnSelect
        sx={{ width: 280, '& .MuiOutlinedInput-root': { bgcolor: 'background.paper' } }}
        renderValue={(value, getItemProps) =>
          value.map((option, index) => {
            const { key, ...itemProps } = getItemProps({ index })
            return <Chip key={key} size="small" label={option} {...itemProps} />
          })
        }
        renderInput={(params) => <TextField {...params} placeholder={types.length ? '' : m.toolbar.typeFilter} />}
      />
      <ToggleButtonGroup
        size="small"
        exclusive
        value={when}
        onChange={(_, v: When | null) => v && onChange({ when: v })}
        sx={{ bgcolor: 'background.paper' }}
      >
        <ToggleButton value="all">{m.toolbar.when.all}</ToggleButton>
        <ToggleButton value="upcoming">{m.toolbar.when.upcoming}</ToggleButton>
        <ToggleButton value="past">{m.toolbar.when.past}</ToggleButton>
      </ToggleButtonGroup>
      <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
        {searching ? m.toolbar.found(shown) : shown === total ? m.toolbar.total(total) : m.toolbar.partial(shown, total)}
      </Typography>
      {searching && (
        <Chip
          size="small"
          icon={<SortOutlined />}
          label={m.toolbar.byRelevance}
          color={byRelevance ? 'primary' : 'default'}
          variant={byRelevance ? 'filled' : 'outlined'}
          onClick={byRelevance ? undefined : () => onChange({ sort: 'relevance' })}
          sx={{ fontWeight: 600 }}
        />
      )}
      <Box sx={{ flex: 1 }} />
      <Button variant="contained" startIcon={<Add />} onClick={onCreate} loading={creating}>
        {m.toolbar.create}
      </Button>
    </Box>
  )
}
