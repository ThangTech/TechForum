import Button from '@mui/material/Button'
import { useEffect, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  getAdminAccounts,
  setAccountLocked,
  type AdminAccount,
  type AdminAccountPage,
} from '../api/adminAccounts'
import { ApiError } from '../api/client'
import { AccountAdminCard } from '../components/admin/AccountAdminCard'
import { AccountLockDialog } from '../components/admin/AccountLockDialog'
import { AdminPagination } from '../components/admin/AdminPagination'
import { AsyncStatePanel } from '../components/feedback/AsyncStatePanel'
import TextField from '@mui/material/TextField'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'

export const AdminAccountsPage = () => {
  const [params, setParams] = useSearchParams()
  const keyword = params.get('keyword')?.trim() ?? ''
  const status = ['locked', 'unlocked'].includes(params.get('status') ?? '')
    ? (params.get('status') ?? '')
    : ''
  const role = ['administrator', 'member'].includes(params.get('role') ?? '')
    ? (params.get('role') ?? '')
    : ''
  const pageValue = Number(params.get('page'))
  const page = Number.isInteger(pageValue) && pageValue > 0 ? pageValue : 1
  const [data, setData] = useState<AdminAccountPage | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [selected, setSelected] = useState<AdminAccount | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    const load = async () => {
      setIsLoading(true)
      setError(null)
      try {
        setData(await getAdminAccounts(keyword, page, 15, controller.signal, status, role))
      } catch (requestError) {
        if (!controller.signal.aborted)
          setError(
            requestError instanceof ApiError ? requestError.message : 'Không thể tải danh sách tài khoản.',
          )
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }
    void load()
    return () => controller.abort()
  }, [keyword, status, role, page, retry])
  const filter = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const fields = new FormData(event.currentTarget)
    const next = new URLSearchParams()
    for (const key of ['keyword', 'status', 'role']) {
      const value = String(fields.get(key) ?? '').trim()
      if (value) next.set(key, value)
    }
    setParams(next)
  }
  const changePage = (nextPage: number) => {
    const next = new URLSearchParams(params)
    if (nextPage > 1) next.set('page', String(nextPage))
    else next.delete('page')
    setParams(next)
  }
  const toggleLock = async (reason: string | null, lockoutEndUtc: string | null) => {
    if (!selected || busyId) return
    setBusyId(selected.id)
    setActionError(null)
    setSuccess(null)
    try {
      const updated = await setAccountLocked(selected.id, !selected.isLocked, reason, lockoutEndUtc)
      setSuccess(updated.isLocked ? 'Đã khóa tài khoản và lưu lý do xử lý.' : 'Đã mở khóa tài khoản.')
      setSelected(null)
      setRetry((value) => value + 1)
    } catch (requestError) {
      setActionError(
        requestError instanceof ApiError ? requestError.message : 'Không thể cập nhật tài khoản.',
      )
    } finally {
      setBusyId(null)
    }
  }
  return (
    <section className="admin-page">
      <p className="eyebrow">Quản trị thành viên</p>
      <h1 className="font-extrabold">Tài khoản</h1>
      <p className="admin-page-description">
        Tra cứu thành viên, vai trò và trạng thái truy cập. Tài khoản quản trị được bảo vệ khỏi thao tác khóa.
      </p>
      <form className="admin-toolbar" key={`${keyword}-${status}-${role}`} onSubmit={filter} role="search">
        <TextField size="small" label="Tìm tài khoản" defaultValue={keyword} name="keyword" placeholder="Tên hoặc email thành viên" slotProps={{ htmlInput: { maxLength: 100 } }} sx={{ flex: 1, minWidth: 180, maxWidth: 430 }} />
        <TextField size="small" label="Trạng thái" defaultValue={status} name="status" select slotProps={{ select: { native: true }, inputLabel: { shrink: true } }} sx={{ minWidth: 150 }}>
            <option value="">Tất cả trạng thái</option>
            <option value="unlocked">Đang hoạt động</option>
            <option value="locked">Đang bị khóa</option>
          </TextField>
        <TextField size="small" label="Vai trò" defaultValue={role} name="role" select slotProps={{ select: { native: true }, inputLabel: { shrink: true } }} sx={{ minWidth: 150 }}>
            <option value="">Tất cả vai trò</option>
            <option value="member">Thành viên</option>
            <option value="administrator">Quản trị viên</option>
          </TextField>
        <Button type="submit" variant="contained">Tìm kiếm</Button>
        <Button onClick={() => setParams({})} variant="text">Xóa lọc</Button>
      </form>
      {actionError && !selected && (
        <p className="admin-message admin-message-error" role="alert">
          {actionError}
        </p>
      )}
      {success && (
        <p className="admin-message admin-message-success" role="status">
          {success}
        </p>
      )}
      <AsyncStatePanel
        error={error}
        isLoading={isLoading}
        loadingText="Đang tải tài khoản…"
        onRetry={() => setRetry((value) => value + 1)}
      />
      {!isLoading && !error && data && (
        <>
          {data.items.length ? (
            <div className="admin-table-scroll">
              <Table className="admin-table" size="small">
                <caption className="sr-only">Danh sách tài khoản TechForum</caption>
                <TableHead>
                  <TableRow>
                    <TableCell>Thành viên</TableCell>
                    <TableCell>Vai trò</TableCell>
                    <TableCell>Trạng thái</TableCell>
                    <TableCell>Ngày tham gia</TableCell>
                    <TableCell>Thao tác</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.items.map((account) => (
                    <AccountAdminCard
                      account={account}
                      busyId={busyId}
                      key={account.id}
                      onToggleLock={(item) => {
                        setActionError(null)
                        setSelected(item)
                      }}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="admin-empty">Không tìm thấy tài khoản phù hợp.</p>
          )}
          <AdminPagination {...data} onChange={changePage} />
        </>
      )}
      {selected && (
        <AccountLockDialog
          account={selected}
          isBusy={busyId !== null}
          key={selected.id}
          onClose={() => {
            setActionError(null)
            setSelected(null)
          }}
          onConfirm={(reason, until) => void toggleLock(reason, until)}
          requestError={actionError}
        />
      )}
    </section>
  )
}
