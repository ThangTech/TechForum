import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import MuiLink from '@mui/material/Link'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { Link } from 'react-router-dom'
import { RichHtml } from '../../../shared/components/RichHtml'
import { PageBreadcrumbs, type BreadcrumbItem } from '../../../shared/components/PageBreadcrumbs'
import { AsyncStatePanel } from '../../../shared/feedback/AsyncStatePanel'
import { TopicTypeBadge } from '../components/TopicTypeBadge'
import { topicTagChipSx } from '../utils/topicTagChipSx'
import { UserAvatar } from '../../members/components/UserAvatar'
import { ViewIcon } from '../../../shared/components/StatIcons'
import { appRoutes } from '../../../app/appRoutes'
import { DiscussionSection } from '../../answers/components/DiscussionSection'
import { TopicActionRail } from '../../interactions/components/TopicActionRail'
import { ReadingTableOfContents } from '../components/ReadingTableOfContents'
import { RelatedTopics } from '../components/RelatedTopics'
import { usePageMeta } from '../../../shared/hooks/usePageMeta'
import { useTopicDetailPage } from '../hooks/useTopicDetailPage'
import { useState } from 'react'
import '../styles/topicReading.css'

const discussionId = 'discussion'

const formatDateTime = (value: string) => new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'long',
  timeStyle: 'short',
}).format(new Date(value))

export const TopicDetailPage = () => {
  const { topic, readingContent, isLoading, error, notFoundTitle, retry, isTopicReady, isOwnTopic, wasUpdatedAfterPublication } =
    useTopicDetailPage()
  usePageMeta(topic?.title, topic?.summary)
  const [answerCount, setAnswerCount] = useState<number | null>(null)
  // Trang chủ › Bài viết (hoặc Hỏi đáp) › chuyên mục › tên bài; khi bài chưa tải xong chỉ có Trang chủ.
  const listRoute = topic?.type === 'question' ? appRoutes.questions : appRoutes.articles
  const breadcrumbs: BreadcrumbItem[] = topic
    ? [
        { label: 'Trang chủ', to: appRoutes.home },
        { label: topic.type === 'question' ? 'Hỏi đáp' : 'Bài viết', to: listRoute },
        { label: topic.category.name, to: `${listRoute}?categoryId=${topic.category.id}` },
        { label: topic.title },
      ]
    : [{ label: 'Trang chủ', to: appRoutes.home }]

  return (
    <main className="main-area" id="main-content">
      <div className={`topic-reading-page${readingContent?.headings.length ? '' : ' topic-reading-page--without-toc'}`}>
        <PageBreadcrumbs items={breadcrumbs} />

        <Box sx={{ mt: 3 }}>
          <AsyncStatePanel
            error={error}
            isLoading={isLoading}
            loadingText="Đang tải nội dung…"
            notFoundTitle={notFoundTitle}
            onRetry={retry}
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
                    {isOwnTopic && (
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
                  className="reading-content"
                  html={readingContent.html}
                  sx={{
                    p: { xs: 3, sm: 4 },
                    color: 'text.primary',
                    lineHeight: 2,
                    '& a': { color: 'primary.main', textDecoration: 'underline' },
                    '& p': { mb: 2.5 },
                  }}
                />
              </article>
              <TopicActionRail
                answerCount={answerCount}
                authorId={topic.author.id}
                discussionId={discussionId}
                key={`rail-${topic.id}`}
                title={topic.title}
                topicId={topic.id}
              />
              <DiscussionSection
                isLocked={topic.isDiscussionLocked}
                key={topic.id}
                onTotalChange={setAnswerCount}
                sectionId={discussionId}
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
