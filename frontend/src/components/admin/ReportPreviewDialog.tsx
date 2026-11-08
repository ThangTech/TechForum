import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import MuiLink from '@mui/material/Link'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { Link } from 'react-router-dom'
import type { AdminReport } from '../../api/reports'
import { appRoutes } from '../../appRoutes'
import { AdminDialog } from './AdminDialog'
import { reportReasonLabels, reportStatusLabels } from './reportLabels'
import { StatusBadge } from './StatusBadge'

const noteBoxSx = { mt: 2.5, p: 2, border: 1, borderColor: 'divider', fontSize: '0.875rem' } as const
const smallTextSx = { color: 'text.secondary', fontSize: '0.75rem' } as const
const linkSx = { fontSize: '0.75rem', fontWeight: 700 } as const

export const ReportPreviewDialog = ({
  report,
  onClose,
  onResolve,
}: {
  report: AdminReport
  onClose: () => void
  onResolve: (report: AdminReport, decision: 'accepted' | 'rejected') => void
}) => (
  <AdminDialog
    actions={
      <>
        <Button onClick={onClose} variant="outlined">Đóng</Button>
        {report.status === 'pending' && (
          <>
            <Button onClick={() => onResolve(report, 'rejected')} variant="outlined">Bác bỏ báo cáo</Button>
            <Button onClick={() => onResolve(report, 'accepted')} variant="contained">Chấp nhận báo cáo</Button>
          </>
        )}
      </>
    }
    headerExtra={<StatusBadge tone="blue">{reportStatusLabels[report.status]}</StatusBadge>}
    onClose={onClose}
    title={`Chi tiết báo cáo #${report.id}`}
    width={850}
  >
    <Typography component="h3" sx={{ fontSize: '1.125rem', fontWeight: 700 }}>{report.targetTitle}</Typography>
    <Typography sx={{ ...smallTextSx, mt: 1 }}>
      {report.targetType === 'topic' ? 'Chủ đề' : 'Câu trả lời'} của {report.targetAuthor.displayName} ·{' '}
      {report.isTargetDeleted ? 'Tác giả đã xóa' : report.isTargetHidden ? 'Đang bị ẩn' : 'Đang hiển thị'}
    </Typography>
    <Box sx={{ ...noteBoxSx, bgcolor: 'var(--color-subtle)' }}>
      <strong>{reportReasonLabels[report.reason]}</strong>
      <Typography sx={{ mt: 1, lineHeight: '1.5rem', fontSize: 'inherit' }}>{report.details || 'Người báo cáo không cung cấp mô tả thêm.'}</Typography>
      <Typography sx={{ ...smallTextSx, mt: 1.5 }}>
        {report.reporter.displayName} · {new Date(report.createdAtUtc).toLocaleString('vi-VN')}
      </Typography>
    </Box>
    {report.parentAnswerBodyHtml && (
      <Box component="details" sx={{ mt: 2, p: 2, border: 1, borderColor: 'divider' }}>
        <Box component="summary" sx={{ ...smallTextSx, cursor: 'pointer', fontWeight: 700 }}>
          Ngữ cảnh: câu trả lời gốc
        </Box>
        <Box
          className="fr-view reading-content admin-preview"
          dangerouslySetInnerHTML={{ __html: report.parentAnswerBodyHtml }}
          sx={{ mt: 1.5 }}
        />
      </Box>
    )}
    <Typography component="h4" sx={{ mt: 2.5, fontSize: '0.875rem', fontWeight: 700 }}>Nội dung bị báo cáo</Typography>
    <Box
      className="admin-preview fr-view reading-content"
      dangerouslySetInnerHTML={{ __html: report.targetBodyHtml }}
      sx={{ mt: 1.5 }}
    />
    {report.status !== 'pending' && (
      <Box sx={noteBoxSx}>
        <strong>Kết quả xử lý</strong>
        <Typography sx={{ mt: 1, lineHeight: '1.5rem', fontSize: 'inherit' }}>{report.resolutionNote}</Typography>
        <Typography sx={{ ...smallTextSx, mt: 1 }}>
          {report.resolvedBy?.displayName ?? 'Không xác định'}
          {report.resolvedAtUtc && ` · ${new Date(report.resolvedAtUtc).toLocaleString('vi-VN')}`}
        </Typography>
      </Box>
    )}
    <Typography sx={{ ...smallTextSx, mt: 2, lineHeight: '1.5rem' }}>
      Kết quả báo cáo được lưu riêng. Nếu cần ẩn hoặc khóa chủ đề, hãy mở quản lý nội dung và thực hiện kiểm
      duyệt kèm lý do.
    </Typography>
    <Stack direction="row" sx={{ mt: 2, flexWrap: 'wrap', gap: 2 }}>
      <MuiLink component={Link} sx={linkSx} to={appRoutes.adminTopics + `?keyword=${encodeURIComponent(report.targetTitle)}`} underline="hover">
        Quản lý chủ đề →
      </MuiLink>
      {!report.isTargetHidden && !report.isTargetDeleted && (
        <MuiLink
          component={Link}
          sx={linkSx}
          to={
            appRoutes.topic(report.topicId) +
            (report.targetType === 'answer' ? `#answer-${report.targetId}` : '')
          }
          underline="hover"
        >
          Mở trên diễn đàn ↗
        </MuiLink>
      )}
    </Stack>
  </AdminDialog>
)
