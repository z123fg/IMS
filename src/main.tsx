import CssBaseline from '@mui/material/CssBaseline'
import GlobalStyles from '@mui/material/GlobalStyles'
import { ThemeProvider } from '@mui/material/styles'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { useLang } from '@/i18n'
import { Notifier } from '@/lib/notify'
import { queryClient } from '@/lib/queryClient'
import { router } from '@/router'
import { themes } from '@/theme'

function App() {
  // 切换语言时换用对应语言的 MUI 主题与日期选择器区域设置
  const lang = useLang()
  return (
    <ThemeProvider theme={themes[lang]} defaultMode="system">
      <CssBaseline enableColorScheme />
      <GlobalStyles
        styles={{
          // 系统要求减少动效时关闭过渡与动画
          '@media (prefers-reduced-motion: reduce)': {
            '*, *::before, *::after': {
              animationDuration: '0.01ms !important',
              transitionDuration: '0.01ms !important',
              scrollBehavior: 'auto !important',
            },
          },
        }}
      />
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={lang === 'zh' ? 'zh-cn' : 'en'}>
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
          <Notifier />
        </QueryClientProvider>
      </LocalizationProvider>
    </ThemeProvider>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
