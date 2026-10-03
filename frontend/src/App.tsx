import './App.css'
import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { ProtectedRoute } from './auth/ProtectedRoute'
import { SiteLayout } from './components/SiteLayout'
import { AccountPage } from './pages/AccountPage'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { TopicDetailPage } from './pages/TopicDetailPage'
import { PublicProfilePage } from './pages/PublicProfilePage'
import { MyTopicsPage } from './pages/MyTopicsPage'

const WriteTopicPage = lazy(() => import('./pages/WriteTopicPage').then((module) => ({
  default: module.WriteTopicPage,
})))

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<SiteLayout />}>
            <Route index element={<HomePage />} />
            <Route
              path="bai-viet"
              element={<HomePage fixedType="Article" title="Bài viết công nghệ" description="Kiến thức và kinh nghiệm thực tế được chia sẻ bởi cộng đồng." />}
            />
            <Route
              path="hoi-dap"
              element={<HomePage fixedType="Question" title="Hỏi đáp công nghệ" description="Tìm câu hỏi đang cần sự đóng góp từ cộng đồng TechForum." />}
            />
            <Route path="noi-dung/:id" element={<TopicDetailPage />} />
            <Route path="thanh-vien/:userId" element={<PublicProfilePage />} />
            <Route
              path="viet-bai"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<div className="route-status">Đang tải trình soạn thảo…</div>}>
                    <WriteTopicPage />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="noi-dung-cua-toi"
              element={
                <ProtectedRoute>
                  <MyTopicsPage />
                </ProtectedRoute>
              }
            />
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
