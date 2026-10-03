import { Button } from '@astryxdesign/core/Button'
import { useNavigate } from 'react-router-dom'
import { appRoutes } from '../appRoutes'

export const SettingsPage = () => {
  const navigate = useNavigate()

  return (
    <main className="main-area" id="main-content">
      <div className="page-content py-10">
        <section className="mx-auto max-w-2xl rounded-xl border border-slate-200 bg-white p-6 sm:p-8">
          <p className="eyebrow">Tùy chỉnh</p>
          <h1 className="mt-1 text-2xl font-extrabold text-slate-950">Trải nghiệm TechForum</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Xem lại hướng dẫn ngắn về tìm kiếm, duyệt nội dung, viết bài và quản lý tài khoản.
          </p>
          <div className="mt-6">
            <Button label="Chạy lại hướng dẫn" onClick={() => navigate(`${appRoutes.home}?tour=1`)} variant="primary" />
          </div>
        </section>
      </div>
    </main>
  )
}
