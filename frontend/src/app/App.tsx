import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from '../features/auth/components/ProtectedRoute'
import { AuthRequiredDialogHost } from '../features/auth/components/AuthRequiredDialogHost'
import { ScrollManager } from '../shared/layout/ScrollManager'
import { SiteLayout } from '../shared/layout/SiteLayout'
import { AccountPage } from '../features/members/pages/AccountPage'
import { HomePage } from '../features/home/pages/HomePage'
import { LoginPage } from '../features/auth/pages/LoginPage'
import { RegisterPage } from '../features/auth/pages/RegisterPage'
import { TopicDetailPage } from '../features/topics/pages/TopicDetailPage'
import { PublicProfilePage } from '../features/members/pages/PublicProfilePage'
import { MyTopicsPage } from '../features/topics/pages/MyTopicsPage'
import { SavedTopicsPage } from '../features/interactions/pages/SavedTopicsPage'
import { StarredTopicsPage } from '../features/interactions/pages/StarredTopicsPage'
import { appRoutes } from './appRoutes'
import { LegacyRouteRedirect } from '../shared/layout/LegacyRouteRedirect'
import { NotificationsPage } from '../features/notifications/pages/NotificationsPage'
import { ActivityPage } from '../features/members/pages/ActivityPage'
import { SkillCommunityPage } from '../features/members/pages/SkillCommunityPage'
import { CommunitiesPage } from '../features/members/pages/CommunitiesPage'
import { FollowMembersPage } from '../features/members/pages/FollowMembersPage'
import { MyReportsPage } from '../features/reports/pages/MyReportsPage'
import { ForgotPasswordPage } from '../features/auth/pages/ForgotPasswordPage'
import { ResetPasswordPage } from '../features/auth/pages/ResetPasswordPage'

const WriteTopicPage = lazy(() => import('../features/topics/pages/WriteTopicPage').then((module) => ({
  default: module.WriteTopicPage,
})))

// The admin area is only downloaded when an administrator opens it, so visitors do not pay for its pages and charts.
const AdminLayout = lazy(() => import('../features/admin/components/AdminLayout').then((module) => ({ default: module.AdminLayout })))
const AdminAccountsPage = lazy(() => import('../features/admin/pages/AdminAccountsPage').then((module) => ({ default: module.AdminAccountsPage })))
const AdminAuditPage = lazy(() => import('../features/admin/pages/AdminAuditPage').then((module) => ({ default: module.AdminAuditPage })))
const AdminBannedWordsPage = lazy(() => import('../features/admin/pages/AdminBannedWordsPage').then((module) => ({ default: module.AdminBannedWordsPage })))
const AdminBannersPage = lazy(() => import('../features/admin/pages/AdminBannersPage').then((module) => ({ default: module.AdminBannersPage })))
const AdminCategoriesPage = lazy(() => import('../features/admin/pages/AdminCategoriesPage').then((module) => ({ default: module.AdminCategoriesPage })))
const AdminOverviewPage = lazy(() => import('../features/admin/pages/AdminOverviewPage').then((module) => ({ default: module.AdminOverviewPage })))
const AdminReportsPage = lazy(() => import('../features/admin/pages/AdminReportsPage').then((module) => ({ default: module.AdminReportsPage })))
const AdminTagsPage = lazy(() => import('../features/admin/pages/AdminTagsPage').then((module) => ({ default: module.AdminTagsPage })))
const AdminTopicsPage = lazy(() => import('../features/admin/pages/AdminTopicsPage').then((module) => ({ default: module.AdminTopicsPage })))

const App = () => {
  return (
    <BrowserRouter>
      <ScrollManager />
      <Routes>
        <Route element={<SiteLayout />}>
          <Route index element={<HomePage fixedType="Article" showHighlights showTour title="Bài viết công nghệ" description="Kiến thức và kinh nghiệm thực tế được chia sẻ bởi cộng đồng TechForum." />} />
          <Route
            path="search"
            element={<HomePage title="Tìm kiếm nội dung" description="Tìm bài viết và câu hỏi công khai trong cộng đồng TechForum." />}
          />
          <Route
            path="articles"
            element={<HomePage fixedType="Article" title="Bài viết công nghệ" description="Kiến thức và kinh nghiệm thực tế được chia sẻ bởi cộng đồng." />}
          />
          <Route
            path="questions"
            element={<HomePage fixedType="Question" title="Hỏi đáp công nghệ" description="Tìm câu hỏi đang cần sự đóng góp từ cộng đồng TechForum." />}
          />
          <Route
            path="discussions"
            element={<HomePage sort="discussion" title="Thảo luận đang diễn ra" description="Các bài viết và câu hỏi đã có phản hồi, sắp xếp theo hoạt động thảo luận mới nhất." />}
          />
          <Route path="topics/:id" element={<TopicDetailPage />} />
          <Route path="members/:userId" element={<PublicProfilePage />} />
          <Route path="members/:userId/followers" element={<FollowMembersPage kind="followers" />} />
          <Route path="members/:userId/following" element={<FollowMembersPage kind="following" />} />
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
            path="starred"
            element={<ProtectedRoute><StarredTopicsPage /></ProtectedRoute>}
          />
          <Route
            path="account"
            element={
              <ProtectedRoute>
                <AccountPage />
              </ProtectedRoute>
            }
          />
          <Route path="notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
          <Route path="activity" element={<ProtectedRoute><ActivityPage /></ProtectedRoute>} />
          <Route path="reports" element={<ProtectedRoute><MyReportsPage /></ProtectedRoute>} />
          <Route path="communities" element={<CommunitiesPage />} />
          <Route path="skills/:tagId" element={<SkillCommunityPage />} />
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
        <Route
          path="admin"
          element={
            <ProtectedRoute requiredRole="Administrator">
              <Suspense fallback={<div className="route-status">Đang tải khu quản trị…</div>}>
                <AdminLayout />
              </Suspense>
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminOverviewPage />} />
          <Route path="topics" element={<AdminTopicsPage />} />
          <Route path="reports" element={<AdminReportsPage />} />
          <Route path="categories" element={<AdminCategoriesPage />} />
          <Route path="tags" element={<AdminTagsPage />} />
          <Route path="banners" element={<AdminBannersPage />} />
          <Route path="banned-words" element={<AdminBannedWordsPage />} />
          <Route path="accounts" element={<AdminAccountsPage />} />
          <Route path="audit-logs" element={<AdminAuditPage />} />
        </Route>
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route path="reset-password" element={<ResetPasswordPage />} />
        <Route path="dang-nhap" element={<LegacyRouteRedirect to={appRoutes.login} />} />
        <Route path="dang-ky" element={<LegacyRouteRedirect to={appRoutes.register} />} />
      </Routes>
      <AuthRequiredDialogHost />
    </BrowserRouter>
  )
}

export default App
