import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import { setLang, useLang, useT, type Lang } from '@/i18n'

export function LanguageSwitch() {
  const lang = useLang()
  const m = useT()
  return (
    <ToggleButtonGroup
      size="small"
      exclusive
      value={lang}
      onChange={(_, v: Lang | null) => v && setLang(v)}
      aria-label={m.lang.label}
      sx={{ '& .MuiToggleButton-root': { py: 0.25, px: 1, fontSize: 12, lineHeight: 1.6 } }}
    >
      <ToggleButton value="zh" lang="zh-CN">
        中文
      </ToggleButton>
      <ToggleButton value="en" lang="en">
        EN
      </ToggleButton>
    </ToggleButtonGroup>
  )
}
