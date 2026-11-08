import Box from '@mui/material/Box'
import MuiLink from '@mui/material/Link'
import Typography from '@mui/material/Typography'
import { Link, useSearchParams } from 'react-router-dom'
import { appRoutes } from '../appRoutes'
import { EmptyPanel } from '../components/common/EmptyPanel'
import { PageHeading } from '../components/common/PageHeading'
import { PageShell } from '../components/common/PageShell'
import { Pager } from '../components/common/Pager'
import { Panel } from '../components/common/Panel'
import { AsyncStatePanel } from '../components/feedback/AsyncStatePanel'
import { TopicTypeBadge } from '../components/topics/TopicTypeBadge'
import { useSavedTopics } from '../queries/bookmarks'
import { getErrorMessage } from '../queries/errorMessage'
import { isInitialLoading } from '../queries/status'

const readPage = (value: string | null) => {
  const page = Number(value)
  return Number.isInteger(page) && page > 0 ? page : 1
}

export const SavedTopicsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = readPage(searchParams.get('page'))
  const savedQuery = useSavedTopics(page, 10)
  const data = savedQuery.data ?? null
  const isLoading = isInitialLoading(savedQuery)
  const error = getErrorMessage(savedQuery.error, 'Không thể tải danh sách đã lưu.')

  const changePage = (nextPage: number) => {
    const next = new URLSearchParams(searchParams)
    if (nextPage <= 1) next.delete('page')
    else next.set('page', String(nextPage))
    setSearchParams(next)
  }

  return (
    <PageShell maxWidth={1240}>
      <PageHeading description="Các bài viết và câu hỏi bạn muốn đọc lại." eyebrow="Thư viện cá nhân" title="Nội dung đã lưu" />
      <Box sx={{ mt: 3.5 }}>
        <AsyncStatePanel error={error} isLoading={isLoading} loadingText="Đang tải nội dung đã lưu…" onRetry={() => void savedQuery.refetch()} />
        {!isLoading && !error && data?.items.length === 0 && (
          <EmptyPanel title="Bạn chưa lưu nội dung nào">
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
                    {topic.author.displayName} · {topic.category.name} · Lưu {new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' }).format(new Date(topic.savedAtUtc))}
                  </Typography>
                </Panel>
              ))}
            </Box>
            <Box sx={{ mt: 1.5 }}>
              <Pager label="Phân trang nội dung đã lưu" onChange={changePage} page={page} totalPages={data.totalPages} />
            </Box>
          </>
        )}
      </Box>
    </PageShell>
  )
}
