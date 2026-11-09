import Box from '@mui/material/Box'
import MuiLink from '@mui/material/Link'
import Typography from '@mui/material/Typography'
import type { UseQueryResult } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { SavedTopicPage } from '../../api/bookmarks'
import { appRoutes } from '../../appRoutes'
import { getErrorMessage } from '../../queries/errorMessage'
import { isInitialLoading } from '../../queries/status'
import { EmptyPanel } from '../common/EmptyPanel'
import { Pager } from '../common/Pager'
import { Panel } from '../common/Panel'
import { AsyncStatePanel } from '../feedback/AsyncStatePanel'
import { TopicTypeBadge } from './TopicTypeBadge'

interface PersonalTopicListProps {
  query: UseQueryResult<SavedTopicPage>
  page: number
  onPageChange: (page: number) => void
  // The words of the list: "Lưu" or "Thả sao" before the date, and the texts for loading, error, empty and the pager.
  dateLabel: string
  loadingText: string
  errorText: string
  emptyTitle: string
  pagerLabel: string
  emptyHint?: ReactNode
}

const formatDate = (value: string) => new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' }).format(new Date(value))

// The list of posts that belong to one member and are read again later (saved posts, starred posts): a card for each
// post, a pager, and the loading, error and empty states. Both pages of the member use it.
export const PersonalTopicList = ({
  query,
  page,
  onPageChange,
  dateLabel,
  loadingText,
  errorText,
  emptyTitle,
  pagerLabel,
  emptyHint,
}: PersonalTopicListProps) => {
  const data = query.data ?? null
  const isLoading = isInitialLoading(query)
  const error = getErrorMessage(query.error, errorText)

  return (
    <Box sx={{ mt: 3.5 }}>
      <AsyncStatePanel error={error} isLoading={isLoading} loadingText={loadingText} onRetry={() => void query.refetch()} />
      {!isLoading && !error && data?.items.length === 0 && (
        <EmptyPanel title={emptyTitle}>
          {emptyHint}
          <MuiLink component={Link} sx={{ display: 'inline-block', mt: 1.5, fontWeight: 700 }} to={appRoutes.home} underline="hover">Khám phá nội dung</MuiLink>
        </EmptyPanel>
      )}
      {!isLoading && !error && data && data.items.length > 0 && (
        <>
          <Box sx={{ display: 'grid', gap: 2 }}>
            {data.items.map((topic) => (
              <Panel component="article" key={topic.id} sx={{ p: { xs: 2.5, sm: 3 } }}>
                <TopicTypeBadge type={topic.type} />
                <MuiLink
                  component={Link}
                  sx={{ display: 'block', mt: 1.5, color: 'var(--color-heading)', fontSize: '1.25rem', fontWeight: 700, '&:hover': { color: 'primary.main' } }}
                  to={appRoutes.topic(topic.id)}
                  underline="none"
                >
                  {topic.title}
                </MuiLink>
                <Typography color="text.secondary" sx={{ mt: 1, lineHeight: '1.5rem' }} variant="body2">{topic.summary}</Typography>
                <Typography color="text.secondary" sx={{ mt: 2, fontSize: '0.75rem' }}>
                  {topic.author.displayName} · {topic.category.name} · {dateLabel} {formatDate(topic.savedAtUtc)}
                </Typography>
              </Panel>
            ))}
          </Box>
          <Box sx={{ mt: 1.5 }}>
            <Pager label={pagerLabel} onChange={onPageChange} page={page} totalPages={data.totalPages} />
          </Box>
        </>
      )}
    </Box>
  )
}
