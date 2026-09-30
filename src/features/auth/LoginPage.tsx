import LockOutlined from '@mui/icons-material/LockOutlined'
import EmailOutlined from '@mui/icons-material/EmailOutlined'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Collapse from '@mui/material/Collapse'
import Grow from '@mui/material/Grow'
import InputAdornment from '@mui/material/InputAdornment'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useRouter } from '@tanstack/react-router'
import { useState, type FormEvent } from 'react'
import { LogoMark } from '@/components/LogoMark'
import { supabase } from '@/lib/supabase'
import { safeRedirect } from './session'

export function LoginPage({ redirect }: { redirect?: string }) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (error) {
      setLoading(false)
      setError(error.message === 'Invalid login credentials' ? '邮箱或密码错误' : `登录失败：${error.message}`)
      return
    }
    router.history.push(safeRedirect(redirect))
  }

  return (
    <Box
      sx={(theme) => ({
        minHeight: '100dvh',
        display: 'grid',
        placeItems: 'center',
        px: 2,
        bgcolor: 'background.default',
        backgroundImage: [
          `radial-gradient(900px 500px at 10% -10%, ${theme.alpha((theme.vars ?? theme).palette.primary.main, 0.18)}, transparent 60%)`,
          `radial-gradient(700px 480px at 110% 110%, ${theme.alpha((theme.vars ?? theme).palette.secondary.main, 0.16)}, transparent 60%)`,
        ].join(','),
      })}
    >
      <Grow in timeout={450}>
        <Paper
          component="form"
          onSubmit={onSubmit}
          elevation={0}
          sx={{
            width: '100%',
            maxWidth: 400,
            p: { xs: 3, sm: 4.5 },
            borderRadius: 4,
            border: 1,
            borderColor: 'divider',
            boxShadow: '0 24px 60px -24px rgba(15, 23, 42, 0.25)',
          }}
        >
          <Stack spacing={3}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
              <LogoMark size={44} />
              <Box>
                <Typography variant="h6" component="h1">
                  登录 IMS
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  面试管理系统 · 内部使用
                </Typography>
              </Box>
            </Stack>

            <Collapse in={error !== null} unmountOnExit>
              <Alert severity="error" variant="outlined">
                {error}
              </Alert>
            </Collapse>

            <TextField
              label="邮箱"
              type="email"
              autoComplete="email"
              autoFocus
              required
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailOutlined fontSize="small" />
                    </InputAdornment>
                  ),
                },
              }}
            />
            <TextField
              label="密码"
              type="password"
              autoComplete="current-password"
              required
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlined fontSize="small" />
                    </InputAdornment>
                  ),
                },
              }}
            />
            <Button type="submit" variant="contained" size="large" loading={loading} fullWidth>
              登录
            </Button>
            <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
              账号由管理员创建，如需开通请联系管理员
            </Typography>
          </Stack>
        </Paper>
      </Grow>
    </Box>
  )
}
