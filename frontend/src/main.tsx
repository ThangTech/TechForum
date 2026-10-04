import { createRoot } from 'react-dom/client'
import { Theme } from '@astryxdesign/core/theme'
import { InternationalizationProvider } from '@astryxdesign/core/i18n'
import viVN from '@astryxdesign/core/locales/vi-VN.generated.js'
import { neutralTheme } from '@astryxdesign/theme-neutral/built'
import 'intro.js/introjs.css'
import 'froala-editor/css/froala_style.min.css'
import './index.css'
import './intro-overrides.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <InternationalizationProvider locale="vi-VN" messages={{ 'vi-VN': viVN }}>
    <Theme theme={neutralTheme} mode="light">
      <App />
    </Theme>
  </InternationalizationProvider>,
)
