import { createTheme } from '@mui/material/styles'

// Theme MUI theo DESIGN.md: nền sáng, màu xanh làm màu chính, bo góc nhỏ, không đổ bóng và không hiệu ứng gợn sóng.
export const theme = createTheme({
  palette: {
    primary: { main: '#1463d6', dark: '#0f4fac', light: '#eaf2ff', contrastText: '#ffffff' },
    error: { main: '#b42318', light: '#fff1f0' },
    success: { main: '#15803d', light: '#dcfce7' },
    warning: { main: '#b45309', light: '#fef3c7' },
    text: { primary: '#263044', secondary: '#5b6578' },
    background: { default: '#f6f8fb', paper: '#ffffff' },
    divider: '#e4e8ef',
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
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { minHeight: 36, whiteSpace: 'nowrap' },
        outlined: { borderColor: '#cfd6e2', color: '#263044', '&:hover': { borderColor: '#b5bfd0', backgroundColor: '#f8fafc' } },
        text: { color: '#263044', '&:hover': { backgroundColor: '#f1f5f9' } },
      },
    },
    MuiTextField: { defaultProps: { size: 'small', fullWidth: true } },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          color: '#5b6578',
          borderColor: '#cfd6e2',
          '&.Mui-selected': { backgroundColor: '#eaf2ff', color: '#0f4fac', '&:hover': { backgroundColor: '#dce9ff' } },
        },
      },
    },
    MuiPaginationItem: { styleOverrides: { root: { fontWeight: 600 } } },
    MuiOutlinedInput: {
      styleOverrides: {
        notchedOutline: { borderColor: '#cfd6e2' },
        root: { backgroundColor: '#ffffff' },
      },
    },
    MuiCheckbox: { defaultProps: { disableRipple: true } },
    MuiDialog: { styleOverrides: { paper: { borderRadius: 8, boxShadow: '0 12px 40px rgba(16, 24, 40, 0.18)' } } },
    MuiMenu: { styleOverrides: { paper: { borderRadius: 8, border: '1px solid #e4e8ef', boxShadow: '0 8px 24px rgba(16, 24, 40, 0.12)' } } },
    MuiMenuItem: { styleOverrides: { root: { fontSize: '0.9rem', minHeight: 36 } } },
  },
})
