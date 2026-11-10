import Box from '@mui/material/Box'
import ButtonBase from '@mui/material/ButtonBase'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import type { NotificationPage } from '../../api/notifications'
import { EmptyPanel } from '../common/EmptyPanel'
import { Pager } from '../common/Pager'
import { Panel } from '../common/Panel'
import { PanelList } from '../common/PanelList'

interface NotificationListProps {
  data: NotificationPage
  busyId: string | null
  onOpen: (id: string, link: string, isRead: boolean) => void
  onPageChange: (page: number) => void
}

const formatDate = (value: string) => new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'medium',
  timeStyle: 'short',
}).format(new Date(value))

export const NotificationList = ({ data, busyId, onOpen, onPageChange }: NotificationListProps) => {
  if (data.items.length === 0) {
    return <EmptyPanel>Bạn chưa có thông báo nào.</EmptyPanel>
  }

  return (
    <>
      <Panel>
        <PanelList>
          {data.items.map((item) => (
            <Box component="li" key={item.id} sx={{ bgcolor: item.readAtUtc ? undefined : 'rgba(234, 242, 255, 0.6)' }}>
              <ButtonBase
                disabled={busyId === item.id}
                onClick={() => onOpen(item.id, item.link, item.readAtUtc !== null)}
                sx={{ display: 'block', width: '100%', p: { xs: 2.5, sm: 3 }, textAlign: 'left', '&.Mui-disabled': { opacity: 0.6 } }}
              >
                <Stack direction="row" sx={{ alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
                  <Box component="span" sx={{ minWidth: 0, flex: 1 }}>
                    <Typography component="strong" sx={{ display: 'block', color: 'var(--color-heading)', fontSize: '0.875rem', fontWeight: 700 }}>{item.title}</Typography>
                    <Typography color="text.secondary" component="span" sx={{ display: 'block', mt: 0.5, lineHeight: '1.5rem', whiteSpace: 'pre-wrap', overflowWrap: 'break-word' }} variant="body2">{item.message}</Typography>
                  </Box>
                  {!item.readAtUtc && <Box aria-label="Chưa đọc" component="span" role="img" sx={{ mt: 0.5, width: 10, height: 10, flexShrink: 0, borderRadius: '50%', bgcolor: 'primary.main' }} />}
                </Stack>
                <Typography color="text.secondary" component="time" dateTime={item.createdAtUtc} sx={{ display: 'block', mt: 1.5, fontSize: '0.75rem' }}>{formatDate(item.createdAtUtc)}</Typography>
              </ButtonBase>
            </Box>
          ))}
        </PanelList>
      </Panel>
      <Pager onChange={onPageChange} page={data.page} totalPages={data.totalPages} />
    </>
  )
}
