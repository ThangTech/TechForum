import Box from '@mui/material/Box'
import MuiLink from '@mui/material/Link'
import Typography from '@mui/material/Typography'
import { Link } from 'react-router-dom'
import type { SkillCommunity } from '../../api/skills'
import { appRoutes } from '../../appRoutes'
import { Panel } from '../common/Panel'
import { StatTile } from '../common/StatTile'

interface SkillSummaryProps {
  community: SkillCommunity
}

export const SkillSummary = ({ community }: SkillSummaryProps) => (
  <Panel component="section" sx={{ p: { xs: 3, sm: 4 } }}>
    <p className="eyebrow">Kỹ năng cộng đồng</p>
    <Typography component="h1" sx={{ color: 'var(--color-heading)', fontSize: '1.875rem', fontWeight: 800 }}>#{community.tag.name}</Typography>
    {community.tag.description && <Typography color="text.secondary" sx={{ mt: 1.5 }}>{community.tag.description}</Typography>}
    <Box sx={{ mt: 3, display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' } }}>
      <StatTile size="large">
        <Typography component="strong" sx={{ fontSize: '1.25rem', fontWeight: 700 }}>{community.topicCount}</Typography>
        <Typography color="text.secondary" component="span" sx={{ ml: 1 }} variant="body2">nội dung công khai</Typography>
      </StatTile>
      <StatTile size="large">
        <Typography component="strong" sx={{ fontSize: '1.25rem', fontWeight: 700 }}>{community.memberCount}</Typography>
        <Typography color="text.secondary" component="span" sx={{ ml: 1 }} variant="body2">thành viên sử dụng</Typography>
      </StatTile>
    </Box>
    <MuiLink
      component={Link}
      sx={{ display: 'inline-block', mt: 2.5, fontSize: '0.875rem', fontWeight: 700 }}
      to={`${appRoutes.home}?tagId=${community.tag.id}`}
      underline="hover"
    >
      Xem bài viết gắn thẻ này →
    </MuiLink>
  </Panel>
)
