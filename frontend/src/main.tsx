import { createRoot } from 'react-dom/client'
import { StyledEngineProvider, ThemeProvider } from '@mui/material/styles'
import GlobalStyles from '@mui/material/GlobalStyles'
import 'intro.js/introjs.css'
import 'froala-editor/css/froala_style.min.css'
import './index.css'
import './intro-overrides.css'
import App from './App.tsx'
import { AppErrorBoundary } from './components/common/AppErrorBoundary.tsx'
import { theme } from './theme.ts'

createRoot(document.getElementById('root')!).render(
  // enableCssLayer đặt CSS của MUI vào layer "mui": thấp hơn App.css và Tailwind utilities nên các class Tailwind vẫn ghi đè được.
  <StyledEngineProvider enableCssLayer>
    <GlobalStyles styles="@layer reset, theme, base, mui, components, utilities;" />
    <ThemeProvider theme={theme}>
      <AppErrorBoundary>
        <App />
      </AppErrorBoundary>
    </ThemeProvider>
  </StyledEngineProvider>,
)
