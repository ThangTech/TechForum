import './App.css'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { ProtectedRoute } from './auth/ProtectedRoute'
import { SiteLayout } from './components/SiteLayout'
import { AccountPage } from './pages/AccountPage'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<SiteLayout />}>
            <Route index element={<HomePage />} />
            <Route
              path="tai-khoan"
              element={
                <ProtectedRoute>
                  <AccountPage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
          <Route path="dang-nhap" element={<LoginPage />} />
          <Route path="dang-ky" element={<RegisterPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
