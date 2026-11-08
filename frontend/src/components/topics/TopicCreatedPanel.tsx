import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { Link } from 'react-router-dom'
import type { OwnTopic } from '../../api/topics'
import { appRoutes } from '../../appRoutes'
import { PageShell } from '../common/PageShell'
import { Panel } from '../common/Panel'

interface TopicCreatedPanelProps {
  actionLabel?: string
  topic: OwnTopic
  onReset: () => void
}

export const TopicCreatedPanel = ({ actionLabel = 'Soạn nội dung khác', topic, onReset }: TopicCreatedPanelProps) => (
  <PageShell compact maxWidth={720}>
    <Panel component="section" role="status" sx={{ p: 4, textAlign: 'center' }} tone="success">
      <Typography sx={{ color: 'success.main', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Đã lưu thành công</Typography>
      <Typography component="h1" sx={{ mt: 1, color: 'var(--color-heading)', fontSize: '1.5rem', fontWeight: 800 }}>{topic.title}</Typography>
      <Typography color="text.secondary" sx={{ mt: 1.5 }} variant="body2">
        {topic.status === 'published' ? 'Nội dung đã được xuất bản.' : 'Bản nháp chỉ bạn mới có thể quản lý.'}
      </Typography>
      <Stack direction="row" sx={{ mt: 3, justifyContent: 'center', gap: 1.5 }}>
        {topic.status === 'published' && (
          <Button component={Link} to={appRoutes.topic(topic.id)} variant="contained">Xem nội dung</Button>
        )}
        <Button onClick={onReset} type="button" variant="outlined">{actionLabel}</Button>
      </Stack>
    </Panel>
  </PageShell>
)
