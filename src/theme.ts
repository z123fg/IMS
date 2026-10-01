import { enUS as coreEnUS, zhCN as coreZhCN } from '@mui/material/locale'
import { createTheme, type ThemeOptions } from '@mui/material/styles'
import { enUS as pickersEnUS, zhCN as pickersZhCN } from '@mui/x-date-pickers/locales'
import type { Lang } from '@/i18n'

export const FONT_STACK = [
  '-apple-system',
  'BlinkMacSystemFont',
  '"Segoe UI"',
  '"PingFang SC"',
  '"Hiragino Sans GB"',
  '"Microsoft YaHei"',
  '"Noto Sans SC"',
  'Roboto',
  'sans-serif',
].join(',')

const base: ThemeOptions = {
  cssVariables: { colorSchemeSelector: 'class' },
  colorSchemes: {
    light: {
      palette: {
        primary: { main: '#4f5bd5' },
        secondary: { main: '#0ea5a4' },
        success: { main: '#16a34a' },
        background: { default: '#f5f6fa', paper: '#ffffff' },
        divider: 'rgba(15, 23, 42, 0.08)',
        text: { primary: '#1f2433', secondary: '#667085' },
      },
    },
    dark: {
      palette: {
        primary: { main: '#8b93ff' },
        secondary: { main: '#2dd4bf' },
        success: { main: '#4ade80' },
        background: { default: '#0f1117', paper: '#171a23' },
        divider: 'rgba(255, 255, 255, 0.08)',
      },
    },
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: FONT_STACK,
    fontSize: 14,
    button: { textTransform: 'none', fontWeight: 600 },
    h5: { fontWeight: 700, letterSpacing: '-0.01em' },
    h6: { fontWeight: 700, letterSpacing: '-0.01em' },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { borderRadius: 8 } },
    },
    MuiIconButton: {
      styleOverrides: { root: { borderRadius: 8 } },
    },
    MuiPaper: {
      styleOverrides: { root: { backgroundImage: 'none' } },
    },
    MuiTooltip: {
      defaultProps: { arrow: true, enterDelay: 400 },
    },
    MuiDialog: {
      styleOverrides: { paper: { borderRadius: 16 } },
    },
    MuiMenu: {
      styleOverrides: { paper: { borderRadius: 10 } },
    },
    MuiToggleButton: {
      styleOverrides: { root: { textTransform: 'none', fontWeight: 600, paddingInline: 12 } },
    },
  },
}

// 每种语言一份主题，只有组件内置文案（分页、日期选择器按钮等）不同
export const themes: Record<Lang, ReturnType<typeof createTheme>> = {
  zh: createTheme(base, coreZhCN, pickersZhCN),
  en: createTheme(base, coreEnUS, pickersEnUS),
}
