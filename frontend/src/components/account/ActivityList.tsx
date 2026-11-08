import Box from '@mui/material/Box'
import MuiLink from '@mui/material/Link'
import Typography from '@mui/material/Typography'
import { Link } from 'react-router-dom'
import type { ActivityPage } from '../../api/activity'
import { EmptyPanel } from '../common/EmptyPanel'
import { Pager } from '../common/Pager'
import { Panel } from '../common/Panel'
import { PanelList } from '../common/PanelList'

const formatDate = (value: string) => new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'medium',
  timeStyle: 'short',
}).format(new Date(value))

export const ActivityList = ({ data, onPageChange }: { data: ActivityPage; onPageChange: (page: number) => void }) => {
  if (data.items.length === 0) {
    return <EmptyPanel>Bạn chưa có hoạt động công khai nào.</EmptyPanel>
  }
  return (
    <>
      <Panel>
        <PanelList ordered>
          {data.items.map((item, index) => (
            <Box component="li" key={`${item.type}-${item.link}-${index}`} sx={{ p: { xs: 2.5, sm: 3 } }}>
              <Typography component="span" sx={{ color: 'primary.main', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.025em', textTransform: 'uppercase' }}>
                {item.type === 'topic-created' ? 'Nội dung' : 'Thảo luận'}
              </Typography>
              <MuiLink
                component={Link}
                sx={{ display: 'block', mt: 0.5, color: 'var(--color-heading)', fontWeight: 700, '&:hover': { color: 'primary.main' } }}
                to={item.link}
                underline="none"
              >
                {item.title}
              </MuiLink>
              <Typography color="text.secondary" sx={{ mt: 0.5 }} variant="body2">{item.description}</Typography>
              <Typography color="text.secondary" component="time" dateTime={item.occurredAtUtc} sx={{ display: 'block', mt: 1, fontSize: '0.75rem' }}>
                {formatDate(item.occurredAtUtc)}
              </Typography>
            </Box>
          ))}
        </PanelList>
      </Panel>
      <Pager onChange={onPageChange} page={data.page} totalPages={data.totalPages} />
    </>
  )
}
