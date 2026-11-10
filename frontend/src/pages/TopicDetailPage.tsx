import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import MuiLink from '@mui/material/Link'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useEffect, useMemo } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { RichHtml } from '../components/common/RichHtml'
import { ApiError } from '../api/client'
import { toDisplayMediaHtml } from '../api/media'
import { AsyncStatePanel } from '../components/feedback/AsyncStatePanel'
import { TopicTypeBadge } from '../components/topics/TopicTypeBadge'
import { topicTagChipSx } from '../components/topics/topicTagChipSx'
import { UserAvatar } from '../components/account/UserAvatar'
import { ViewIcon } from '../components/common/StatIcons'
import { appRoutes } from '../appRoutes'
import { DiscussionSection } from '../components/discussions/DiscussionSection'
import { UsefulStarButton } from '../components/interactions/UsefulStarButton'
import { TopicVoteButtons } from '../components/interactions/TopicVoteButtons'
import { BookmarkButton } from '../components/interactions/BookmarkButton'
import { ReportAction } from '../components/reports/ReportAction'
import { TopicEngagementBar } from '../components/interactions/TopicEngagementBar'
import { useAuth } from '../auth/authState'
import { ReadingTableOfContents } from '../components/topics/ReadingTableOfContents'
import { RelatedTopics } from '../components/topics/RelatedTopics'
import { getErrorMessage } from '../queries/errorMessage'
import { isInitialLoading } from '../queries/status'
import { useTopic } from '../queries/topics'
import { isGuid } from '../utils/ids'
import { prepareReadingContent } from '../utils/readingContent'
import '../styles/topicReading.css'

const formatDateTime = (value: string) => new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'long',
  timeStyle: 'short',
}).format(new Date(value))

export const TopicDetailPage = () => {
  const { id } = useParams()
  const location = useLocation()
  const topicId = (id ?? '').toLowerCase()
  const { user } = useAuth()
  const isValidId = isGuid(topicId)
  const topicQuery = useTopic(topicId, isValidId)
  const topic = topicQuery.data ?? null
  const isLoading = isValidId && isInitialLoading(topicQuery)
  const requestError = topicQuery.error
  const loadError = requestError instanceof ApiError && requestError.status === 404
    ? 'Nội dung không tồn tại hoặc không còn được công khai.'
    : getErrorMessage(requestError)
  const error = isValidId ? loadError : 'Đường dẫn nội dung không hợp lệ.'
  const readingContent = useMemo(
    () => topic ? prepareReadingContent(toDisplayMediaHtml(topic.bodyHtml), topic.id) : null,
    [topic],
  )

  useEffect(() => {
    if (isLoading || error || topic?.id !== topicId || !readingContent) return
    const headingId = location.hash.slice(1)
    if (!readingContent.headings.some((heading) => heading.id === headingId)) return

    const heading = document.getElementById(headingId)
    heading?.scrollIntoView({ block: 'start' })
    heading?.focus({ preventScroll: true })
  }, [error, isLoading, location.hash, readingContent, topic?.id, topicId])

  const isTopicReady = !isLoading && !error && topic?.id === topicId && readingContent !== null
  const wasUpdatedAfterPublication = topic?.updatedAtUtc &&
    new Date(topic.updatedAtUtc).getTime() > new Date(topic.publishedAtUtc).getTime()

  return (
    <main className="main-area" id="main-content">
      <div className={`topic-reading-page${readingContent?.headings.length ? '' : ' topic-reading-page--without-toc'}`}>
        <MuiLink
          component={Link}
          sx={{ fontSize: '0.875rem', fontWeight: 600 }}
          to={topic?.type === 'question' ? appRoutes.questions : appRoutes.articles}
          underline="hover"
        >
          ← Quay lại danh sách
        </MuiLink>

        <Box sx={{ mt: 3 }}>
          <AsyncStatePanel
            error={error}
            isLoading={isLoading}
            loadingText="Đang tải nội dung…"
            onRetry={() => void topicQuery.refetch()}
          />
        </Box>

        {isTopicReady && topic && readingContent && (
          <div className={`topic-reading-layout${readingContent.headings.length > 0 ? ' topic-reading-layout--with-toc' : ''}`}>
            <ReadingTableOfContents headings={readingContent.headings} />
            <div className="topic-reading-column">
              <article className="topic-reading-article">
                <Box component="header" sx={{ p: { xs: 3, sm: 4 }, borderBottom: 1, borderColor: 'divider' }}>
                  <Stack direction="row" sx={{ flexWrap: 'wrap', alignItems: 'center', gap: 1, fontSize: '0.75rem' }}>
                    <TopicTypeBadge type={topic.type} />
                    {topic.isPinned && <Typography color="primary" component="span" sx={{ fontSize: 'inherit', fontWeight: 600 }}>Đã ghim</Typography>}
                    {topic.isDiscussionLocked && <Typography color="text.secondary" component="span" sx={{ fontSize: 'inherit', fontWeight: 600 }}>Đã khóa thảo luận</Typography>}
                    {user?.id === topic.author.id && (
                      <MuiLink component={Link} sx={{ ml: 'auto', fontSize: 'inherit', fontWeight: 600 }} to={appRoutes.editTopic(topic.id)} underline="hover">Chỉnh sửa nội dung</MuiLink>
                    )}
                  </Stack>
                  <Typography
                    component="h1"
                    sx={{
                      mt: 2,
                      color: 'var(--color-heading)',
                      fontSize: { xs: '1.875rem', sm: '2.25rem' },
                      fontWeight: 800,
                      lineHeight: 1.25,
                      letterSpacing: '-0.025em',
                    }}
                  >
                    {topic.title}
                  </Typography>
                  <Typography color="text.secondary" sx={{ mt: 2, lineHeight: '1.75rem' }}>{topic.summary}</Typography>
                  <Stack direction="row" sx={{ mt: 2.5, flexWrap: 'wrap', alignItems: 'center', columnGap: 1.5, rowGap: 1, color: 'text.secondary', fontSize: '0.875rem' }}>
                    <MuiLink
                      component={Link}
                      sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.primary', fontWeight: 600, '&:hover': { color: 'primary.main' } }}
                      to={appRoutes.member(topic.author.id)}
                      underline="none"
                    >
                      {/* Chi tiết chủ đề chưa trả về ảnh đại diện nên hiển thị chữ cái đầu của tên. */}
                      <UserAvatar avatarUrl={null} displayName={topic.author.displayName} />
                      {topic.author.displayName}
                    </MuiLink>
                    <span aria-hidden="true">·</span>
                    <time dateTime={topic.publishedAtUtc}>{formatDateTime(topic.publishedAtUtc)}</time>
                    <span aria-hidden="true">·</span>
                    <MuiLink
                      color="inherit"
                      component={Link}
                      sx={{ '&:hover': { color: 'primary.main' } }}
                      to={`${topic.type === 'question' ? appRoutes.questions : appRoutes.articles}?categoryId=${topic.category.id}`}
                      underline="none"
                    >{topic.category.name}</MuiLink>
                  </Stack>
                  <Stack direction="row" sx={{ mt: 1.5, flexWrap: 'wrap', alignItems: 'center', columnGap: 2, rowGap: 1, color: 'text.secondary', fontSize: '0.75rem' }}>
                    <span className="topic-stat" title="Lượt xem"><ViewIcon />{topic.viewCount}<span className="sr-only"> lượt xem</span></span>
                    <span title="Thời gian ước tính tùy theo nội dung và tốc độ đọc.">Khoảng {Math.max(1, readingContent.readingMinutes)} phút đọc</span>
                    {wasUpdatedAfterPublication && topic.updatedAtUtc && (
                      <time dateTime={topic.updatedAtUtc}>Cập nhật {formatDateTime(topic.updatedAtUtc)}</time>
                    )}
                  </Stack>
                  {topic.tags.length > 0 && (
                    <Stack direction="row" sx={{ mt: 2, flexWrap: 'wrap', gap: 1 }}>
                      {topic.tags.map((tag) => (
                        <Chip
                          clickable
                          component={Link}
                          key={tag.id}
                          label={`#${tag.name}`}
                          size="small"
                          sx={topicTagChipSx}
                          to={`${appRoutes.search}?tagId=${tag.id}`}
                          variant="outlined"
                        />
                      ))}
                    </Stack>
                  )}
                </Box>

                <RichHtml
                  className="fr-view reading-content"
                  html={readingContent.html}
                  sx={{
                    p: { xs: 3, sm: 4 },
                    color: 'text.primary',
                    lineHeight: 2,
                    '& a': { color: 'primary.main', textDecoration: 'underline' },
                    '& p': { mb: 2.5 },
                  }}
                />
                <Box component="footer" sx={{ px: { xs: 3, sm: 4 }, py: 2.5, borderTop: 1, borderColor: 'divider', bgcolor: 'var(--color-subtle)' }}>
                  <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1.5 }}>
                    <TopicVoteButtons authorId={topic.author.id} topicId={topic.id} />
                    <UsefulStarButton topicId={topic.id} />
                    <BookmarkButton topicId={topic.id} />
                    <ReportAction targetId={topic.id} targetType="topic" />
                  </Stack>
                  <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                    <TopicEngagementBar title={topic.title} topicId={topic.id} />
                  </Box>
                </Box>
              </article>
              <DiscussionSection
                isLocked={topic.isDiscussionLocked}
                key={topic.id}
                topicAuthorId={topic.author.id}
                topicId={topic.id}
                topicType={topic.type}
              />
              <RelatedTopics key={`related-${topic.id}`} topicId={topic.id} />
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
