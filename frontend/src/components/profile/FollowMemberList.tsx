import Box from '@mui/material/Box'
import MuiLink from '@mui/material/Link'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { Link } from 'react-router-dom'
import type { FollowMember } from '../../api/profiles'
import { appRoutes } from '../../appRoutes'
import { EmptyPanel } from '../common/EmptyPanel'
import { Panel } from '../common/Panel'
import { PanelList } from '../common/PanelList'

interface FollowMemberListProps {
  members: FollowMember[]
}

export const FollowMemberList = ({ members }: FollowMemberListProps) => {
  if (members.length === 0) {
    return <EmptyPanel>Chưa có thành viên nào trong danh sách này.</EmptyPanel>
  }

  return (
    <Panel>
      <PanelList>
        {members.map((member) => (
          <Box component="li" key={member.id} sx={{ p: { xs: 2.5, sm: 3 } }}>
            <Stack direction="row" sx={{ alignItems: 'flex-start', gap: 2 }}>
              <Box
                aria-hidden="true"
                component="span"
                sx={{
                  display: 'grid',
                  placeItems: 'center',
                  flexShrink: 0,
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  bgcolor: 'primary.light',
                  color: 'primary.main',
                  fontWeight: 800,
                }}
              >
                {member.displayName.slice(0, 1).toLocaleUpperCase('vi-VN')}
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <MuiLink
                  component={Link}
                  sx={{ color: 'var(--color-heading)', fontWeight: 800, '&:hover': { color: 'primary.main' } }}
                  to={appRoutes.member(member.id)}
                  underline="none"
                >
                  {member.displayName}
                </MuiLink>
                {member.bio && (
                  <Typography
                    color="text.secondary"
                    sx={{ mt: 0.5, lineHeight: '1.5rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                    variant="body2"
                  >
                    {member.bio}
                  </Typography>
                )}
                <Typography color="text.secondary" sx={{ mt: 1, fontSize: '0.75rem' }}>{member.publishedTopicCount} nội dung công khai</Typography>
              </Box>
            </Stack>
          </Box>
        ))}
      </PanelList>
    </Panel>
  )
}
