import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import MenuItem from '@mui/material/MenuItem'
import MuiLink from '@mui/material/Link'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { Link, useSearchParams } from 'react-router-dom'
import type { ReportReason, ReportStatus } from '../api/reports'
import { StatusBadge, type BadgeTone } from '../components/admin/StatusBadge'
import { EmptyPanel } from '../components/common/EmptyPanel'
import { PageHeading } from '../components/common/PageHeading'
import { PageShell } from '../components/common/PageShell'
import { Pager } from '../components/common/Pager'
import { Panel } from '../components/common/Panel'
import { PanelList } from '../components/common/PanelList'
import { AsyncStatePanel } from '../components/feedback/AsyncStatePanel'
import { getErrorMessage } from '../queries/errorMessage'
import { useMyReports } from '../queries/reports'
import { isInitialLoading } from '../queries/status'

const statusLabels: Record<ReportStatus, string> = {
  pending: 'Chờ xử lý',
  accepted: 'Được chấp nhận',
  rejected: 'Không chấp nhận',
}
const statusTones: Record<ReportStatus, BadgeTone> = {
  pending: 'amber',
  accepted: 'green',
  rejected: 'neutral',
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

// Long texts typed by members keep their line breaks and wrap instead of overflowing.
const longTextSx = { lineHeight: '1.5rem', whiteSpace: 'pre-wrap', overflowWrap: 'break-word' } as const

export const MyReportsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const requestedStatus = searchParams.get('status')
  const status: ReportStatus | '' =
    requestedStatus === 'pending' || requestedStatus === 'accepted' || requestedStatus === 'rejected'
      ? requestedStatus
      : ''
  const pageValue = Number(searchParams.get('page'))
  const page = Number.isInteger(pageValue) && pageValue > 0 ? pageValue : 1
  const reportsQuery = useMyReports(status, page, 10)
  const data = reportsQuery.data ?? null
  const isLoading = isInitialLoading(reportsQuery)
  const error = getErrorMessage(reportsQuery.error, 'Không thể tải báo cáo.')

  const changePage = (nextPage: number) => {
    const next = new URLSearchParams(searchParams)
    if (nextPage <= 1) next.delete('page')
    else next.set('page', String(nextPage))
    setSearchParams(next)
  }

  return (
    <PageShell compact maxWidth={1240}>
      <PageHeading
        description="Theo dõi báo cáo bạn đã gửi và lý do xử lý từ quản trị viên."
        eyebrow="Tài khoản cá nhân"
        size="medium"
        title="Báo cáo của tôi"
      />
      <Stack direction="row" sx={{ my: 3, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
        <TextField
          fullWidth={false}
          label="Trạng thái"
          onChange={(event) => setSearchParams(event.target.value ? { status: event.target.value } : {})}
          select
          size="small"
          slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
          sx={{ minWidth: 200 }}
          value={status}
        >
          <MenuItem value="">Tất cả</MenuItem>
          <MenuItem value="pending">Chờ xử lý</MenuItem>
          <MenuItem value="accepted">Được chấp nhận</MenuItem>
          <MenuItem value="rejected">Không chấp nhận</MenuItem>
        </TextField>
        <MuiLink component={Link} sx={{ fontSize: '0.875rem', fontWeight: 600 }} to="/notifications" underline="hover">
          Xem thông báo
        </MuiLink>
      </Stack>
      <AsyncStatePanel
        error={error}
        isLoading={isLoading}
        loadingText="Đang tải báo cáo…"
        onRetry={() => void reportsQuery.refetch()}
      />
      {!isLoading && !error && data && (
        <>
          <Typography color="text.secondary" sx={{ mb: 1.5 }} variant="body2">{data.totalItems} báo cáo</Typography>
          {data.items.length === 0 ? (
            <EmptyPanel>Chưa có báo cáo phù hợp với bộ lọc.</EmptyPanel>
          ) : (
            <Panel>
              <PanelList>
                {data.items.map((item) => (
                  <Box component="li" key={item.id} sx={{ p: { xs: 2.5, sm: 3 } }}>
                    <Stack direction="row" sx={{ flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 1.5 }}>
                      <Typography component="h2" sx={{ color: 'text.primary', fontWeight: 700 }}>
                        Báo cáo #{item.id} · {item.targetType === 'topic' ? 'Chủ đề' : 'Câu trả lời'}
                      </Typography>
                      <StatusBadge tone={statusTones[item.status]}>{statusLabels[item.status]}</StatusBadge>
                    </Stack>
                    {item.topicId && item.targetTitle ? (
                      <MuiLink
                        component={Link}
                        sx={{ display: 'inline-block', mt: 1.5, fontSize: '0.875rem', fontWeight: 600 }}
                        to={`/topics/${item.topicId}${item.targetType === 'answer' ? `#answer-${item.targetId}` : ''}`}
                        underline="hover"
                      >
                        {item.targetTitle}
                      </MuiLink>
                    ) : (
                      <Typography color="text.secondary" sx={{ mt: 1.5 }} variant="body2">Nội dung không còn công khai.</Typography>
                    )}
                    <Typography sx={{ mt: 1.5, color: 'text.primary' }} variant="body2">
                      <strong>Lý do báo cáo:</strong> {reasonLabels[item.reason]}
                    </Typography>
                    {item.details && (
                      <Typography color="text.secondary" sx={{ ...longTextSx, mt: 0.5 }} variant="body2">{item.details}</Typography>
                    )}
                    <Typography color="text.secondary" sx={{ mt: 1.5, fontSize: '0.75rem' }}>Gửi lúc {formatDate(item.createdAtUtc)}</Typography>
                    {item.resolutionNote && (
                      <Box sx={{ mt: 2, p: 2, borderLeft: 2, borderColor: 'primary.main', bgcolor: 'var(--color-subtle)' }}>
                        <Typography component="h3" sx={{ color: 'text.primary', fontSize: '0.875rem', fontWeight: 700 }}>Kết quả xử lý</Typography>
                        <Typography sx={{ ...longTextSx, mt: 0.5, color: 'text.primary' }} variant="body2">{item.resolutionNote}</Typography>
                        {item.resolvedAtUtc && (
                          <Typography color="text.secondary" sx={{ mt: 1, fontSize: '0.75rem' }}>Xử lý lúc {formatDate(item.resolvedAtUtc)}</Typography>
                        )}
                      </Box>
                    )}
                  </Box>
                ))}
              </PanelList>
            </Panel>
          )}
          {page > Math.max(1, data.totalPages) && (
            <Box sx={{ mt: 2.5 }}>
              <Button onClick={() => changePage(Math.max(1, data.totalPages))} variant="outlined">Về trang có dữ liệu</Button>
            </Box>
          )}
          {page <= data.totalPages && (
            <Pager label="Phân trang báo cáo" onChange={changePage} page={page} totalPages={data.totalPages} />
          )}
        </>
      )}
    </PageShell>
  )
}
