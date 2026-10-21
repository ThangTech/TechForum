import { Button } from '@astryxdesign/core/Button'
import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getMyReports, type MyReportPage, type ReportReason, type ReportStatus } from '../api/reports'
import { AsyncStatePanel } from '../components/feedback/AsyncStatePanel'

const statusLabels: Record<ReportStatus, string> = {
  pending: 'Chờ xử lý',
  accepted: 'Được chấp nhận',
  rejected: 'Không chấp nhận',
}
const statusStyles: Record<ReportStatus, string> = {
  pending: 'border-amber-200 bg-amber-50 text-amber-800',
  accepted: 'border-green-200 bg-green-50 text-green-800',
  rejected: 'border-slate-200 bg-slate-50 text-slate-600',
}
const reasonLabels: Record<ReportReason, string> = {
  spam: 'Spam / quảng cáo',
  harassment: 'Quấy rối / xúc phạm',
  misinformation: 'Thông tin sai lệch',
  copyright: 'Vi phạm bản quyền',
  other: 'Lý do khác',
}
const formatDate = (value: string) =>
  new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))

export const MyReportsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const requestedStatus = searchParams.get('status')
  const status: ReportStatus | '' =
    requestedStatus === 'pending' || requestedStatus === 'accepted' || requestedStatus === 'rejected'
      ? requestedStatus
      : ''
  const pageValue = Number(searchParams.get('page'))
  const page = Number.isInteger(pageValue) && pageValue > 0 ? pageValue : 1
  const [data, setData] = useState<MyReportPage | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    const load = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const result = await getMyReports(status, page, 10, controller.signal)
        if (!controller.signal.aborted) setData(result)
      } catch (requestError) {
        if (!controller.signal.aborted)
          setError(requestError instanceof Error ? requestError.message : 'Không thể tải báo cáo.')
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }
    void load()
    return () => controller.abort()
  }, [status, page, retry])

  const changePage = (nextPage: number) => {
    const next = new URLSearchParams(searchParams)
    if (nextPage <= 1) next.delete('page')
    else next.set('page', String(nextPage))
    setSearchParams(next)
  }

  return (
    <main className="main-area" id="main-content">
      <div className="page-content py-10">
        <p className="eyebrow">Tài khoản cá nhân</p>
        <h1 className="mt-1 text-2xl font-extrabold text-slate-950">Báo cáo của tôi</h1>
        <p className="mt-2 text-sm text-slate-600">
          Theo dõi báo cáo bạn đã gửi và lý do xử lý từ quản trị viên.
        </p>
        <div className="my-6 flex flex-wrap items-center justify-between gap-4">
          <label className="flex items-center gap-3 text-sm font-semibold text-slate-700">
            Trạng thái
            <select
              className="border border-slate-300 bg-white px-3 py-2 font-normal"
              value={status}
              onChange={(event) => setSearchParams(event.target.value ? { status: event.target.value } : {})}
            >
              <option value="">Tất cả</option>
              <option value="pending">Chờ xử lý</option>
              <option value="accepted">Được chấp nhận</option>
              <option value="rejected">Không chấp nhận</option>
            </select>
          </label>
          <Link className="text-sm font-semibold text-blue-700 hover:underline" to="/notifications">
            Xem thông báo
          </Link>
        </div>
        <AsyncStatePanel
          error={error}
          isLoading={isLoading}
          loadingText="Đang tải báo cáo…"
          onRetry={() => setRetry((value) => value + 1)}
        />
        {!isLoading && !error && data && (
          <>
            <p className="mb-3 text-sm text-slate-500">{data.totalItems} báo cáo</p>
            {data.items.length === 0 ? (
              <div className="border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600">
                Chưa có báo cáo phù hợp với bộ lọc.
              </div>
            ) : (
              <ul className="divide-y divide-slate-200 border border-slate-200 bg-white">
                {data.items.map((item) => (
                  <li className="p-5 sm:p-6" key={item.id}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h2 className="font-bold text-slate-900">
                        Báo cáo #{item.id} · {item.targetType === 'topic' ? 'Chủ đề' : 'Câu trả lời'}
                      </h2>
                      <span className={`border px-2 py-1 text-xs font-semibold ${statusStyles[item.status]}`}>
                        {statusLabels[item.status]}
                      </span>
                    </div>
                    {item.topicId && item.targetTitle ? (
                      <Link
                        className="mt-3 inline-block text-sm font-semibold text-blue-700 hover:underline"
                        to={`/topics/${item.topicId}${item.targetType === 'answer' ? `#answer-${item.targetId}` : ''}`}
                      >
                        {item.targetTitle}
                      </Link>
                    ) : (
                      <p className="mt-3 text-sm text-slate-500">Nội dung không còn công khai.</p>
                    )}
                    <p className="mt-3 text-sm text-slate-700">
                      <strong>Lý do báo cáo:</strong> {reasonLabels[item.reason]}
                    </p>
                    {item.details && (
                      <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">
                        {item.details}
                      </p>
                    )}
                    <p className="mt-3 text-xs text-slate-500">Gửi lúc {formatDate(item.createdAtUtc)}</p>
                    {item.resolutionNote && (
                      <div className="mt-4 border-l-2 border-blue-600 bg-slate-50 p-4">
                        <h3 className="text-sm font-bold text-slate-900">Kết quả xử lý</h3>
                        <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
                          {item.resolutionNote}
                        </p>
                        {item.resolvedAtUtc && (
                          <p className="mt-2 text-xs text-slate-500">
                            Xử lý lúc {formatDate(item.resolvedAtUtc)}
                          </p>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {page > Math.max(1, data.totalPages) && <div className="mt-5"><Button label="Về trang có dữ liệu" onClick={() => changePage(Math.max(1, data.totalPages))} variant="secondary" /></div>}
            {data.totalPages > 1 && page <= data.totalPages && (
              <nav aria-label="Phân trang báo cáo" className="mt-5 flex items-center justify-between gap-3">
                <Button
                  isDisabled={page <= 1}
                  label="Trang trước"
                  onClick={() => changePage(page - 1)}
                  variant="secondary"
                />
                <span className="text-sm text-slate-600">
                  Trang {page}/{data.totalPages}
                </span>
                <Button
                  isDisabled={page >= data.totalPages}
                  label="Trang sau"
                  onClick={() => changePage(page + 1)}
                  variant="secondary"
                />
              </nav>
            )}
          </>
        )}
      </div>
    </main>
  )
}
