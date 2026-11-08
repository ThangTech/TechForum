import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import type { ReactNode } from 'react'

interface AdminPageHeadingProps {
  eyebrow: string
  title: string
  description: ReactNode
  // Buttons shown on the right of the heading, for example "Create".
  actions?: ReactNode
}

// The heading block at the top of every admin page. The font sizes and colours come from
// ".admin-page" and ".admin-page-description" in admin.css, so all admin pages look the same.
export const AdminPageHeading = ({ eyebrow, title, description, actions }: AdminPageHeadingProps) => (
  <Stack direction="row" sx={{ flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 2 }}>
    <Box>
      <p className="eyebrow">{eyebrow}</p>
      <Typography component="h1" sx={{ fontWeight: 800 }}>{title}</Typography>
      <p className="admin-page-description">{description}</p>
    </Box>
    {actions}
  </Stack>
)
