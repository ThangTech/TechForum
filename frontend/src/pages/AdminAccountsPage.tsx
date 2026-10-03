import { Button } from '@astryxdesign/core/Button'
import { useEffect, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getAdminAccounts, setAccountLocked, type AdminAccount, type AdminAccountPage } from '../api/adminAccounts'
import { ApiError } from '../api/client'
import { AccountAdminCard } from '../components/admin/AccountAdminCard'
import { AsyncStatePanel } from '../components/feedback/AsyncStatePanel'
import { ConfirmDialog } from '../components/feedback/ConfirmDialog'

const PAGE_SIZE = 15
const readPage = (value: string | null) => {
  const page = Number(value)
  return Number.isInteger(page) && page > 0 ? page : 1
}

export const AdminAccountsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const keyword = searchParams.get('keyword')?.trim() ?? ''
  const page = readPage(searchParams.get('page'))
  const [searchText, setSearchText] = useState(keyword)
  const [data, setData] = useState<AdminAccountPage | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [selected, setSelected] = useState<AdminAccount | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    const load = async () => {
      setIsLoading(true)
      setError(null)
      try {
        setData(await getAdminAccounts(keyword, page, PAGE_SIZE, controller.signal))
      } catch (requestError) {
        if (requestError instanceof DOMException && requestError.name === 'AbortError') return
        setError(requestError instanceof ApiError ? requestError.message : 'Không thể tải danh sách tài khoản.')
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }
    void load()
    return () => controller.abort()
  }, [keyword, page, retry])

  const search = (event: FormEvent) => {
    event.preventDefault()
    const next = new URLSearchParams()
    if (searchText.trim()) next.set('keyword', searchText.trim())
    setSearchParams(next)
  }

  const changePage = (nextPage: number) => {
    const next = new URLSearchParams(searchParams)
    if (nextPage <= 1) next.delete('page')
    else next.set('page', String(nextPage))
    setSearchParams(next)
  }

  const toggleLock = async () => {
    if (!selected || busyId) return
    setBusyId(selected.id)
    setActionError(null)
    setSuccessMessage(null)
    try {
      const updated = await setAccountLocked(selected.id, !selected.isLocked)
      setData((current) => current ? {
        ...current,
        items: current.items.map((item) => item.id === updated.id ? updated : item),
      } : current)
      setSuccessMessage(updated.isLocked ? 'Đã khóa tài khoản.' : 'Đã mở khóa tài khoản.')
      setSelected(null)
    } catch (requestError) {
      setActionError(requestError instanceof ApiError ? requestError.message : 'Không thể cập nhật tài khoản.')
      setSelected(null)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <main className="main-area" id="main-content">
      <div className="page-content py-10 sm:py-14">
        <p className="eyebrow">Quản trị thành viên</p>
        <h1 className="mt-2 text-3xl font-extrabold text-slate-950">Tài khoản</h1>
        <p className="mt-2 text-slate-600">Tìm theo tên hoặc email và quản lý trạng thái truy cập của thành viên.</p>

        <form className="mt-6 flex max-w-2xl gap-3" onSubmit={search} role="search">
          <label className="sr-only" htmlFor="account-search">Tìm tài khoản</label>
          <input className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2.5 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200" id="account-search" maxLength={100} onChange={(event) => setSearchText(event.target.value)} placeholder="Tên hoặc email" value={searchText} />
          <Button label="Tìm kiếm" type="submit" variant="primary" />
        </form>

        {actionError && <p className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">{actionError}</p>}
        {successMessage && <p className="mt-5 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800" role="status">{successMessage}</p>}

        <div className="mt-6">
          <AsyncStatePanel error={error} isLoading={isLoading} loadingText="Đang tải tài khoản…" onRetry={() => setRetry((value) => value + 1)} />
          {!isLoading && !error && data?.items.length === 0 && <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-600">Không tìm thấy tài khoản phù hợp.</div>}
          {!isLoading && !error && data && data.items.length > 0 && (
            <>
              <div className="grid gap-4">
                {data.items.map((account) => <AccountAdminCard account={account} busyId={busyId} key={account.id} onToggleLock={setSelected} />)}
              </div>
              {data.totalPages > 1 && (
                <nav className="mt-6 flex items-center justify-between" aria-label="Phân trang tài khoản">
                  <Button isDisabled={page <= 1} label="Trang trước" onClick={() => changePage(page - 1)} variant="secondary" />
                  <span className="text-sm text-slate-600">Trang {page}/{data.totalPages}</span>
                  <Button isDisabled={page >= data.totalPages} label="Trang sau" onClick={() => changePage(page + 1)} variant="secondary" />
                </nav>
              )}
            </>
          )}
        </div>
      </div>

      <ConfirmDialog
        confirmLabel={selected?.isLocked ? 'Mở khóa' : 'Khóa tài khoản'}
        description={selected?.isLocked
          ? `Mở lại quyền truy cập cho ${selected.displayName}?`
          : `Khóa ${selected?.displayName ?? 'tài khoản này'}? Phiên đăng nhập hiện tại của thành viên sẽ mất hiệu lực ở request tiếp theo.`}
        isBusy={busyId !== null}
        isOpen={selected !== null}
        onCancel={() => setSelected(null)}
        onConfirm={() => void toggleLock()}
        title={selected?.isLocked ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
      />
    </main>
  )
}
