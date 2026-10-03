import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Theme } from '@astryxdesign/core/theme'
import { InternationalizationProvider } from '@astryxdesign/core/i18n'
import viVN from '@astryxdesign/core/locales/vi-VN.generated.js'
import { neutralTheme } from '@astryxdesign/theme-neutral/built'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <InternationalizationProvider locale="vi-VN" messages={{ 'vi-VN': viVN }}>
      <Theme theme={neutralTheme} mode="light">
        <App />
      </Theme>
    </InternationalizationProvider>
  </StrictMode>,
)
