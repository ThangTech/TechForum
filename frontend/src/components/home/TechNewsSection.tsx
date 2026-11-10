import Box from '@mui/material/Box'
import MuiLink from '@mui/material/Link'
import Skeleton from '@mui/material/Skeleton'
import Typography from '@mui/material/Typography'
import { Link } from 'react-router-dom'
import type { TopicSummary } from '../../api/topics'
import { toMediaUrl } from '../../api/media'
import { appRoutes } from '../../appRoutes'
import { isInitialLoading } from '../../queries/status'
import { hashId } from '../../utils/ids'
import { useTopicFeed } from '../../queries/topics'
import { TagCover } from './TagCover'

const NEWS_COUNT = 6

// A topic with no picture and no tag gets a plain blue gradient, so every card keeps the same shape.
const fallbackGradients = [
  'linear-gradient(135deg, #1d4ed8, #38bdf8)',
  'linear-gradient(135deg, #0f766e, #38bdf8)',
  'linear-gradient(135deg, #4338ca, #60a5fa)',
  'linear-gradient(135deg, #0369a1, #22d3ee)',
]

const formatDate = (value: string) => new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' }).format(new Date(value))

const gridSx = {
  display: 'grid',
  gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: 'repeat(3, minmax(0, 1fr))' },
  gap: 2,
} as const

const NewsCard = ({ topic }: { topic: TopicSummary }) => (
  <Box component="article" sx={{ minWidth: 0 }}>
    <MuiLink component={Link} sx={{ display: 'block', color: 'inherit', '&:hover .news-title': { color: 'primary.main' } }} to={appRoutes.topic(topic.id)} underline="none">
      <Box
        sx={{
          aspectRatio: '16 / 9',
          overflow: 'hidden',
          borderRadius: '6px',
          background: fallbackGradients[hashId(topic.id) % fallbackGradients.length],
        }}
      >
        {topic.coverImageUrl
          ? (
            <Box
              alt=""
              component="img"
              loading="lazy"
              src={toMediaUrl(topic.coverImageUrl)}
              sx={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }}
            />
          )
          // No picture (for example the article only has a video): the cover shows its first tag.
          : topic.tags.length > 0 && <TagCover tag={topic.tags[0]} />}
      </Box>
      <Typography
        className="news-title"
        sx={{
          mt: 1,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          color: 'var(--color-heading)',
          fontSize: '0.9375rem',
          fontWeight: 600,
          lineHeight: '1.4rem',
        }}
      >
        {topic.title}
      </Typography>
      <Typography sx={{ mt: 0.25, color: 'var(--color-quiet)', fontSize: '0.75rem' }}>
        {topic.category.name} · {formatDate(topic.publishedAtUtc)}
      </Typography>
    </MuiLink>
  </Box>
)

// "Tin công nghệ": the newest articles of the site with their pictures. It is extra information, so when
// the articles cannot be loaded or there are none, the block is left out instead of showing an error.
export const TechNewsSection = () => {
  const newsQuery = useTopicFeed('latest', { page: 1, pageSize: NEWS_COUNT, type: 'Article' })
  const topics = newsQuery.data?.items ?? []

  if (isInitialLoading(newsQuery)) {
    return (
      <Box sx={{ ...gridSx, mb: 3 }}>
        {Array.from({ length: NEWS_COUNT }, (_, index) => <Skeleton key={index} sx={{ aspectRatio: '16 / 9', height: 'auto' }} variant="rounded" />)}
      </Box>
    )
  }

  if (topics.length === 0) return null

  return (
    <Box aria-labelledby="tech-news-title" component="section" sx={{ mb: 3 }}>
      <Typography component="h2" id="tech-news-title" sx={{ mb: 1.5, color: 'var(--color-heading)', fontSize: '1.125rem', fontWeight: 700 }}>
        Tin công nghệ
      </Typography>
      <Box sx={gridSx}>
        {topics.map((topic) => <NewsCard key={topic.id} topic={topic} />)}
      </Box>
    </Box>
  )
}
