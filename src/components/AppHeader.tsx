import DarkModeOutlined from '@mui/icons-material/DarkModeOutlined'
import LightModeOutlined from '@mui/icons-material/LightModeOutlined'
import Logout from '@mui/icons-material/Logout'
import SettingsBrightnessOutlined from '@mui/icons-material/SettingsBrightnessOutlined'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import { useColorScheme } from '@mui/material/styles'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { useSession } from '@/features/auth/session'
import { queryClient } from '@/lib/queryClient'
import { supabase } from '@/lib/supabase'
import { LogoMark } from './LogoMark'

const MODES = ['system', 'light', 'dark'] as const
const MODE_LABEL = { system: '跟随系统', light: '浅色', dark: '深色' }
const MODE_ICON = {
  system: <SettingsBrightnessOutlined fontSize="small" />,
  light: <LightModeOutlined fontSize="small" />,
  dark: <DarkModeOutlined fontSize="small" />,
}

export function AppHeader() {
  const session = useSession()
  const { mode, setMode } = useColorScheme()
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const email = session?.user.email ?? ''
  const current = mode ?? 'system'
  const next = MODES[(MODES.indexOf(current) + 1) % MODES.length]

  async function signOut() {
    setAnchor(null)
    await supabase.auth.signOut()
    queryClient.clear()
  }

  return (
    <Box
      component="header"
      sx={{
        height: 56,
        px: 2.5,
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        borderBottom: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
        flex: 'none',
      }}
    >
      <LogoMark size={30} />
      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
        面试管理
      </Typography>
      <Box sx={{ flex: 1 }} />
      <Tooltip title={`主题：${MODE_LABEL[current]}（点击切换为${MODE_LABEL[next]}）`}>
        <IconButton size="small" onClick={() => setMode(next)} aria-label="切换主题">
          {MODE_ICON[current]}
        </IconButton>
      </Tooltip>
      <Tooltip title={email}>
        <IconButton size="small" onClick={(e) => setAnchor(e.currentTarget)} aria-label="账号菜单">
          <Avatar sx={{ width: 30, height: 30, fontSize: 14, bgcolor: 'primary.main' }}>
            {email.slice(0, 1).toUpperCase() || '?'}
          </Avatar>
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchor}
        open={anchor !== null}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="caption" color="text.secondary">
            已登录
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {email}
          </Typography>
        </Box>
        <MenuItem onClick={signOut}>
          <ListItemIcon>
            <Logout fontSize="small" />
          </ListItemIcon>
          退出登录
        </MenuItem>
      </Menu>
    </Box>
  )
}
