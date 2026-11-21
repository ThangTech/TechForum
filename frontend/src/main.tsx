import { QueryClientProvider } from '@tanstack/react-query'
import { createRoot } from 'react-dom/client'
import { StyledEngineProvider } from '@mui/material/styles'
import GlobalStyles from '@mui/material/GlobalStyles'
import 'intro.js/introjs.css'
import 'froala-editor/css/froala_style.min.css'
import './app/index.css'
import './app/intro-overrides.css'
import App from './app/App.tsx'
import { initializeSession } from './features/auth/api/session.ts'
import { AppErrorBoundary } from './shared/components/AppErrorBoundary.tsx'
import { ToastProvider } from './shared/feedback/ToastProvider.tsx'
import { queryClient } from './shared/query/queryClient.ts'
import { ThemeModeProvider } from './shared/theme/ThemeModeProvider.tsx'

// Connects the API client to the login session and restores it from the refresh cookie.
initializeSession()

createRoot(document.getElementById('root')!).render(
  // enableCssLayer đặt CSS của MUI vào layer "mui": thấp hơn App.css (layer components) nên các class trong App.css vẫn ghi đè được.
  <StyledEngineProvider enableCssLayer>
    <GlobalStyles styles="@layer base, mui, components;" />
    <ThemeModeProvider>
      <AppErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <ToastProvider>
            <App />
          </ToastProvider>
        </QueryClientProvider>
      </AppErrorBoundary>
    </ThemeModeProvider>
  </StyledEngineProvider>,
)
