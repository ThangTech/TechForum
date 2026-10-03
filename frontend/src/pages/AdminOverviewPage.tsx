import { Button } from '@astryxdesign/core/Button'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getAdminAuditLogs, getAdminStatistics, type AdminAuditPage, type AdminStatistics } from '../api/adminOverview'
import { ApiError } from '../api/client'
import { AdminStatisticsGrid } from '../components/admin/AdminStatisticsGrid'
import { AuditLogList } from '../components/admin/AuditLogList'
import { AsyncStatePanel } from '../components/feedback/AsyncStatePanel'

const readPage = (value: string | null) => { const page = Number(value); return Number.isInteger(page) && page > 0 ? page : 1 }

export const AdminOverviewPage = () => {
  const [params, setParams] = useSearchParams()
  const page = readPage(params.get('page'))
  const [statistics, setStatistics] = useState<AdminStatistics | null>(null)
  const [audit, setAudit] = useState<AdminAuditPage | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    const load = async () => {
      setIsLoading(true); setError(null)
      try {
        const [stats, logs] = await Promise.all([
          getAdminStatistics(controller.signal),
          getAdminAuditLogs(page, 15, controller.signal),
        ])
        setStatistics(stats); setAudit(logs)
      } catch (requestError) {
        if (requestError instanceof DOMException && requestError.name === 'AbortError') return
        setError(requestError instanceof ApiError ? requestError.message : 'Không thể tải tổng quan quản trị.')
      } finally { if (!controller.signal.aborted) setIsLoading(false) }
    }
    void load(); return () => controller.abort()
  }, [page, retry])

  const changePage = (nextPage: number) => {
    const next = new URLSearchParams()
    if (nextPage > 1) next.set('page', String(nextPage))
    setParams(next)
  }

  return (
    <main className="main-area" id="main-content"><div className="page-content py-10 sm:py-14">
      <p className="eyebrow">Quản trị TechForum</p><h1 className="mt-2 text-3xl font-extrabold text-slate-950">Tổng quan</h1>
      <p className="mt-2 text-slate-600">Số liệu được tính trực tiếp từ CSDL và nhật ký các thao tác kiểm duyệt.</p>
      <div className="mt-7"><AsyncStatePanel error={error} isLoading={isLoading} loadingText="Đang tải tổng quan…" onRetry={() => setRetry((value) => value + 1)} /></div>
      {!isLoading && !error && statistics && audit && <>
        <div className="mt-7"><AdminStatisticsGrid statistics={statistics} /></div>
        <section className="mt-10" aria-labelledby="audit-title"><h2 className="text-2xl font-extrabold text-slate-950" id="audit-title">Nhật ký kiểm duyệt</h2>
          {audit.items.length === 0 ? <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-600">Chưa có thao tác kiểm duyệt nào.</div> : <div className="mt-5"><AuditLogList items={audit.items} /></div>}
          {audit.totalPages > 1 && <nav className="mt-6 flex items-center justify-between"><Button isDisabled={page <= 1} label="Trang trước" onClick={() => changePage(page - 1)} variant="secondary" /><span className="text-sm text-slate-600">Trang {page}/{audit.totalPages}</span><Button isDisabled={page >= audit.totalPages} label="Trang sau" onClick={() => changePage(page + 1)} variant="secondary" /></nav>}
        </section>
      </>}
    </div></main>
  )
}
