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
import { SavedTopicsPage } from './pages/SavedTopicsPage'
import { appRoutes } from './appRoutes'
import { LegacyRouteRedirect } from './components/LegacyRouteRedirect'

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
              path="articles"
              element={<HomePage fixedType="Article" title="Bài viết công nghệ" description="Kiến thức và kinh nghiệm thực tế được chia sẻ bởi cộng đồng." />}
            />
            <Route
              path="questions"
              element={<HomePage fixedType="Question" title="Hỏi đáp công nghệ" description="Tìm câu hỏi đang cần sự đóng góp từ cộng đồng TechForum." />}
            />
            <Route path="topics/:id" element={<TopicDetailPage />} />
            <Route path="members/:userId" element={<PublicProfilePage />} />
            <Route
              path="write"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<div className="route-status">Đang tải trình soạn thảo…</div>}>
                    <WriteTopicPage />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="topics/:id/edit"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<div className="route-status">Đang tải trình chỉnh sửa…</div>}>
                    <WriteTopicPage />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="my-topics"
              element={
                <ProtectedRoute>
                  <MyTopicsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="saved"
              element={<ProtectedRoute><SavedTopicsPage /></ProtectedRoute>}
            />
            <Route
              path="account"
              element={
                <ProtectedRoute>
                  <AccountPage />
                </ProtectedRoute>
              }
            />
            <Route path="bai-viet" element={<LegacyRouteRedirect to={appRoutes.articles} />} />
            <Route path="hoi-dap" element={<LegacyRouteRedirect to={appRoutes.questions} />} />
            <Route path="noi-dung/:id" element={<LegacyRouteRedirect to={(params) => appRoutes.topic(params.id ?? '')} />} />
            <Route path="thanh-vien/:userId" element={<LegacyRouteRedirect to={(params) => appRoutes.member(params.userId ?? '')} />} />
            <Route path="viet-bai" element={<LegacyRouteRedirect to={appRoutes.write} />} />
            <Route path="chinh-sua/:id" element={<LegacyRouteRedirect to={(params) => appRoutes.editTopic(params.id ?? '')} />} />
            <Route path="noi-dung-cua-toi" element={<LegacyRouteRedirect to={appRoutes.myTopics} />} />
            <Route path="tai-khoan" element={<LegacyRouteRedirect to={appRoutes.account} />} />
            <Route path="*" element={<Navigate to={appRoutes.home} replace />} />
          </Route>
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="dang-nhap" element={<LegacyRouteRedirect to={appRoutes.login} />} />
          <Route path="dang-ky" element={<LegacyRouteRedirect to={appRoutes.register} />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
