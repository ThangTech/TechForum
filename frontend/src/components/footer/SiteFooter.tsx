import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { appRoutes } from '../../appRoutes'
import { useAuth } from '../../auth/authState'
import { useCategories } from '../../queries/categories'
import { usePublicStatistics } from '../../queries/statistics'
import { useTags } from '../../queries/tags'
import { CodeIcon } from '../common/ActionIcons'
import { BackToTopButton } from './BackToTopButton'
import {
  exploreLinks,
  formatCount,
  getAccountLinks,
  getSystemState,
  systemStateLabels,
  takeFirst,
  type FooterLink,
  type SystemState,
} from './footerLogic'

const REPOSITORY_URL = 'https://github.com/ThangTech/TechForum'

const linkSx = {
  color: 'var(--color-footer-muted)',
  fontSize: '0.9rem',
  textDecoration: 'none',
  '&:hover': { color: 'var(--color-on-footer)' },
  '&:focus-visible': { outlineColor: 'var(--color-footer-accent)', color: 'var(--color-on-footer)' },
} as const

const FooterColumn = ({ title, children }: { title: string; children: ReactNode }) => (
  <Box component="nav" aria-label={title}>
    <Typography
      component="h2"
      sx={{ mb: 2, color: 'var(--color-on-footer)', fontSize: '0.8125rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}
    >
      {title}
    </Typography>
    {children}
  </Box>
)

const LinkList = ({ links }: { links: FooterLink[] }) => (
  <Box component="ul" sx={{ display: 'grid', gap: 1.25, m: 0, p: 0, listStyle: 'none' }}>
    {links.map((link) => (
      <li key={link.to}><Box component={Link} sx={linkSx} to={link.to}>{link.label}</Box></li>
    ))}
  </Box>
)

const statusColors: Record<SystemState, string> = {
  checking: 'var(--color-footer-muted)',
  ok: '#4ade80',
  down: '#f97066',
}

const SystemStatus = ({ state }: { state: SystemState }) => (
  <Box role="status" sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, color: 'var(--color-footer-muted)', fontSize: '0.8125rem' }}>
    <Box aria-hidden="true" component="span" sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: statusColors[state] }} />
    {systemStateLabels[state]}
  </Box>
)

// The footer: who we are with live numbers of the community, the main places of the site, the pages of the
// member, the categories and tags that exist right now, and whether the server answers.
export const SiteFooter = () => {
  const { user } = useAuth()
  const statistics = usePublicStatistics()
  const categories = takeFirst(useCategories().data, 8)
  const tags = takeFirst(useTags().data, 12)
  const systemState = getSystemState(statistics.status)
  const counts = statistics.data
    ? [
        { label: 'Thành viên', value: formatCount(statistics.data.memberCount) },
        { label: 'Bài viết', value: formatCount(statistics.data.articleCount) },
        { label: 'Câu hỏi', value: formatCount(statistics.data.questionCount) },
      ]
    : []

  return (
    <>
      <Box component="footer" sx={{ mt: 6, bgcolor: 'var(--color-footer)', color: 'var(--color-on-footer)' }}>
        <div className="site-footer__inner">
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: '1.5fr 1fr 1fr 1.4fr' },
              gap: { xs: '32px 20px', md: 6 },
              py: { xs: 5, md: 7 },
            }}
          >
            {/* On a phone the first and the last block take the whole width; the two link columns stand side by side. */}
            <Box sx={{ gridColumn: { xs: '1 / -1', md: 'auto' } }}>
              <Box
                aria-label="TechForum - trang chủ"
                component={Link}
                sx={{ color: 'var(--color-on-footer)', fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 750, letterSpacing: '-0.03em', textDecoration: 'none', '&:focus-visible': { outlineColor: 'var(--color-footer-accent)' } }}
                to={appRoutes.home}
              >
                Tech<Box component="span" sx={{ color: 'var(--color-footer-accent)' }}>Forum</Box>
              </Box>
              <Typography sx={{ mt: 1.5, color: 'var(--color-footer-muted)', fontSize: '0.9rem', lineHeight: 1.7, maxWidth: 360 }}>
                Cộng đồng công nghệ Việt: nơi kiến thức được sẻ chia, câu hỏi được trả lời và mọi người cùng học hỏi.
              </Typography>
              <Box
                aria-hidden="true"
                component="code"
                sx={{ display: 'inline-block', mt: 2, px: 1.5, py: 0.75, border: 1, borderColor: 'var(--color-footer-border)', borderRadius: '6px', color: 'var(--color-footer-accent)', fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}
              >
                {'> học · chia sẻ · làm chủ công nghệ'}<span className="footer-cursor" />
              </Box>
              {counts.length > 0 && (
                <Box aria-label="Số liệu cộng đồng" component="dl" sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mt: 3, mb: 0 }}>
                  {counts.map((item) => (
                    <Box key={item.label}>
                      <Box component="dd" sx={{ m: 0, color: 'var(--color-on-footer)', fontSize: '1.375rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums', lineHeight: 1.2 }}>{item.value}</Box>
                      <Box component="dt" sx={{ color: 'var(--color-footer-muted)', fontSize: '0.75rem' }}>{item.label}</Box>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>

            <FooterColumn title="Khám phá"><LinkList links={exploreLinks} /></FooterColumn>

            <FooterColumn title={user ? 'Của bạn' : 'Tham gia'}><LinkList links={getAccountLinks(Boolean(user))} /></FooterColumn>

            <Box sx={{ display: 'grid', gap: 3, alignContent: 'start', gridColumn: { xs: '1 / -1', md: 'auto' } }}>
              {categories.length > 0 && (
                <FooterColumn title="Chuyên mục">
                  <LinkList links={categories.map((category) => ({ label: category.name, to: `${appRoutes.articles}?categoryId=${category.id}` }))} />
                </FooterColumn>
              )}
              {tags.length > 0 && (
                <FooterColumn title="Thẻ phổ biến">
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {tags.map((tag) => (
                      <Box
                        component={Link}
                        key={tag.id}
                        sx={{
                          px: 1.25,
                          py: 0.375,
                          border: 1,
                          borderColor: 'var(--color-footer-border)',
                          borderRadius: '999px',
                          color: 'var(--color-footer-muted)',
                          fontSize: '0.8125rem',
                          textDecoration: 'none',
                          '&:hover, &:focus-visible': { borderColor: 'var(--color-footer-accent)', color: 'var(--color-footer-accent)' },
                          '&:focus-visible': { outlineColor: 'var(--color-footer-accent)' },
                        }}
                        to={`${appRoutes.search}?tagId=${tag.id}`}
                      >
                        #{tag.name}
                      </Box>
                    ))}
                  </Box>
                </FooterColumn>
              )}
            </Box>
          </Box>

          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 2,
              py: 3,
              // Keeps the last link away from the round "back to top" button, which sits over the corner of the page.
              pr: 7,
              '@media (min-width: 1400px)': { pr: 0 },
              borderTop: 1,
              borderColor: 'var(--color-footer-border)',
              color: 'var(--color-footer-muted)',
              fontSize: '0.8125rem',
            }}
          >
            <span>© {new Date().getFullYear()} TechForum · Nơi kiến thức được sẻ chia</span>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 3 }}>
              <SystemStatus state={systemState} />
              <Box
                component="a"
                href={REPOSITORY_URL}
                rel="noopener noreferrer"
                sx={{ ...linkSx, display: 'inline-flex', alignItems: 'center', gap: 0.75, fontSize: '0.8125rem' }}
                target="_blank"
              >
                <CodeIcon size={16} />Mã nguồn
              </Box>
            </Box>
          </Box>
        </div>
      </Box>
      <BackToTopButton />
    </>
  )
}
