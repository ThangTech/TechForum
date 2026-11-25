import Box from '@mui/material/Box'
import MuiLink from '@mui/material/Link'
import Typography from '@mui/material/Typography'
import { Link } from 'react-router-dom'
import { appRoutes } from '../../../app/appRoutes'
import { PageHeading } from '../../../shared/components/PageHeading'
import { PageShell } from '../../../shared/components/PageShell'
import { usePageMeta } from '../../../shared/hooks/usePageMeta'
import { privacyPolicy, termsOfUse } from '../content/legalContent'

// Trang Chính sách bảo mật và Điều khoản sử dụng: cùng một khung, chỉ khác nội dung.
export const LegalPage = ({ kind }: { kind: 'privacy' | 'terms' }) => {
  const document = kind === 'privacy' ? privacyPolicy : termsOfUse
  const other = kind === 'privacy'
    ? { label: 'Điều khoản sử dụng', to: appRoutes.terms }
    : { label: 'Chính sách bảo mật', to: appRoutes.privacy }
  usePageMeta(document.title, document.description)

  return (
    <PageShell maxWidth={760}>
      <PageHeading description={document.description} eyebrow={`Cập nhật ngày ${document.updatedOn}`} title={document.title} />
      <Box className="reading-content" component="article" sx={{ mt: 4, color: 'text.primary', lineHeight: 1.75 }}>
        {document.sections.map((section) => (
          <Box component="section" key={section.heading} sx={{ mt: 4 }}>
            <Typography component="h2" sx={{ mb: 1.5, color: 'var(--color-heading)', fontSize: '1.2rem', fontWeight: 700 }}>
              {section.heading}
            </Typography>
            {section.paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            {section.items && (
              <Box component="ul" sx={{ pl: 3, display: 'grid', gap: 1, listStyle: 'disc' }}>
                {section.items.map((item) => <li key={item}>{item}</li>)}
              </Box>
            )}
          </Box>
        ))}
        <Typography sx={{ mt: 5, color: 'text.secondary' }}>
          Xem thêm: <MuiLink component={Link} to={other.to} underline="always">{other.label}</MuiLink>
        </Typography>
      </Box>
    </PageShell>
  )
}
