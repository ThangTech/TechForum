import { createTheme } from '@mui/material/styles'
import type { ColorTokens, ThemeMode } from './palettes'

// Theme MUI theo DESIGN.md: màu xanh làm màu chính, bo góc nhỏ, không đổ bóng và không hiệu ứng gợn sóng.
// Màu lấy từ bảng màu của chế độ đang dùng nên MUI và các file CSS luôn khớp nhau.
export const createAppTheme = (mode: ThemeMode, colors: ColorTokens) => createTheme({
  palette: {
    mode,
    primary: { main: colors.primary, dark: colors.primaryDark, light: colors.primarySoft, contrastText: colors.onPrimary },
    error: { main: colors.danger, light: colors.dangerSoft },
    success: { main: colors.solved, light: colors.solvedSoft },
    warning: { main: colors.question, light: colors.questionSoft },
    text: { primary: colors.text, secondary: colors.muted },
    background: { default: colors.page, paper: colors.surface },
    divider: colors.border,
  },
  shape: { borderRadius: 6 },
  typography: {
    fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
    fontSize: 14,
    h1: { fontFamily: '"Be Vietnam Pro", Inter, sans-serif', fontWeight: 700 },
    h2: { fontFamily: '"Be Vietnam Pro", Inter, sans-serif', fontWeight: 700 },
    h3: { fontFamily: '"Be Vietnam Pro", Inter, sans-serif', fontWeight: 700 },
    h4: { fontFamily: '"Be Vietnam Pro", Inter, sans-serif', fontWeight: 700 },
    h5: { fontFamily: '"Be Vietnam Pro", Inter, sans-serif', fontWeight: 600 },
    h6: { fontFamily: '"Be Vietnam Pro", Inter, sans-serif', fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiButtonBase: { defaultProps: { disableRipple: true } },
    // MUI tô thêm lớp sáng lên Paper ở chế độ tối; bỏ đi để màu nền đúng như bảng màu.
    MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { minHeight: 36, whiteSpace: 'nowrap' },
        outlined: { borderColor: colors.borderStrong, color: colors.text, '&:hover': { borderColor: colors.quiet, backgroundColor: colors.subtle } },
        text: { color: colors.text, '&:hover': { backgroundColor: colors.hover } },
      },
    },
    MuiTextField: { defaultProps: { size: 'small', fullWidth: true } },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          color: colors.muted,
          borderColor: colors.borderStrong,
          '&.Mui-selected': { backgroundColor: colors.primarySoft, color: colors.primaryDark, '&:hover': { backgroundColor: colors.primarySoft } },
        },
      },
    },
    MuiPaginationItem: { styleOverrides: { root: { fontWeight: 600 } } },
    MuiOutlinedInput: {
      styleOverrides: {
        notchedOutline: { borderColor: colors.borderStrong },
        root: { backgroundColor: colors.surface },
      },
    },
    MuiCheckbox: { defaultProps: { disableRipple: true } },
    MuiDialog: { styleOverrides: { paper: { borderRadius: 8, boxShadow: '0 12px 40px rgba(16, 24, 40, 0.18)' } } },
    MuiMenu: { styleOverrides: { paper: { borderRadius: 8, border: `1px solid ${colors.border}`, boxShadow: '0 8px 24px rgba(16, 24, 40, 0.12)' } } },
    MuiMenuItem: { styleOverrides: { root: { fontSize: '0.9rem', minHeight: 36 } } },
  },
})
