import MuiLink from '@mui/material/Link'
import Typography from '@mui/material/Typography'
import { Link } from 'react-router-dom'
import type { SkillCommunity } from '../../api/skills'
import { appRoutes } from '../../appRoutes'
import { Panel } from '../common/Panel'
import { InlineStats } from '../common/InlineStats'

interface SkillSummaryProps {
  community: SkillCommunity
}

export const SkillSummary = ({ community }: SkillSummaryProps) => (
  <Panel component="section" sx={{ p: { xs: 3, sm: 4 } }}>
    <p className="eyebrow">Kỹ năng cộng đồng</p>
    <Typography component="h1" sx={{ color: 'var(--color-heading)', fontSize: '1.875rem', fontWeight: 800 }}>#{community.tag.name}</Typography>
    {community.tag.description && <Typography color="text.secondary" sx={{ mt: 1.5 }}>{community.tag.description}</Typography>}
    <InlineStats
      items={[
        { value: community.topicCount, label: 'nội dung công khai' },
        { value: community.memberCount, label: 'thành viên sử dụng' },
      ]}
      label="Thống kê kỹ năng"
      sx={{ mt: 2 }}
    />
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
