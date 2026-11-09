import Box from '@mui/material/Box'
import MuiLink from '@mui/material/Link'
import Typography from '@mui/material/Typography'
import { Link } from 'react-router-dom'
import type { SkillMember } from '../../api/skills'
import { appRoutes } from '../../appRoutes'
import { EmptyStateIcon } from '../common/EmptyStateIcon'
import { Panel } from '../common/Panel'
import { PanelList } from '../common/PanelList'

interface SkillMemberListProps {
  members: SkillMember[]
}

export const SkillMemberList = ({ members }: SkillMemberListProps) => (
  <Panel component="section">
    <Box sx={{ p: 2.5, borderBottom: 1, borderColor: 'divider' }}>
      <Typography component="h2" sx={{ color: 'var(--color-heading)', fontSize: '1.25rem', fontWeight: 700 }}>Thành viên có kỹ năng này</Typography>
    </Box>
    {members.length === 0 ? (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <EmptyStateIcon />
        <Typography color="text.secondary" variant="body2">Chưa có nội dung công khai dùng thẻ này.</Typography>
      </Box>
    ) : (
      <PanelList>
        {members.map((member) => (
          <Box component="li" key={member.id} sx={{ p: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
            <MuiLink
              component={Link}
              sx={{ color: 'text.primary', fontWeight: 700, '&:hover': { color: 'primary.main' } }}
              to={appRoutes.member(member.id)}
              underline="none"
            >
              {member.displayName}
            </MuiLink>
            <Typography color="text.secondary" component="span" variant="body2">{member.topicCount} nội dung</Typography>
          </Box>
        ))}
      </PanelList>
    )}
  </Panel>
)
