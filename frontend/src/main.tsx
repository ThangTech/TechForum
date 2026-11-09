import { QueryClientProvider } from '@tanstack/react-query'
import { createRoot } from 'react-dom/client'
import { StyledEngineProvider } from '@mui/material/styles'
import GlobalStyles from '@mui/material/GlobalStyles'
import 'intro.js/introjs.css'
import 'froala-editor/css/froala_style.min.css'
import './index.css'
import './intro-overrides.css'
import App from './App.tsx'
import { initializeSession } from './auth/session.ts'
import { AppErrorBoundary } from './components/common/AppErrorBoundary.tsx'
import { queryClient } from './queries/queryClient.ts'
import { ThemeModeProvider } from './theme/ThemeModeProvider.tsx'

// Connects the API client to the login session and restores it from the refresh cookie.
initializeSession()

createRoot(document.getElementById('root')!).render(
  // enableCssLayer đặt CSS của MUI vào layer "mui": thấp hơn App.css (layer components) nên các class trong App.css vẫn ghi đè được.
  <StyledEngineProvider enableCssLayer>
    <GlobalStyles styles="@layer base, mui, components;" />
    <ThemeModeProvider>
      <AppErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </AppErrorBoundary>
    </ThemeModeProvider>
  </StyledEngineProvider>,
)
