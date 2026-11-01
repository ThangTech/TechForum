import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { appRoutes } from '../../appRoutes'
import {
  ArticleIcon,
  ClipboardIcon,
  CommunityIcon,
  DashboardIcon,
  FlagIcon,
  FolderIcon,
  TagIcon,
} from '../common/NavIcons'
import { adminLinks } from './adminNavigationLinks'

const iconByRoute: Record<string, ReactNode> = {
  [appRoutes.adminOverview]: <DashboardIcon />,
  [appRoutes.adminTopics]: <ArticleIcon />,
  [appRoutes.adminReports]: <FlagIcon />,
  [appRoutes.adminAccounts]: <CommunityIcon />,
  [appRoutes.adminCategories]: <FolderIcon />,
  [appRoutes.adminTags]: <TagIcon />,
  [appRoutes.adminAudit]: <ClipboardIcon />,
}

export const AdminNavigation = ({ onNavigate }: { onNavigate?: () => void }) => {
  return (
    <nav aria-label="Điều hướng quản trị" className="admin-navigation">
      <List disablePadding>
        {adminLinks.map((link) => (
          <ListItemButton
            component={NavLink}
            end={link.to === appRoutes.adminOverview}
            key={link.to}
            onClick={onNavigate}
            sx={{
              borderRadius: 1.5,
              color: 'text.secondary',
              mb: 0.5,
              '&.active': { bgcolor: 'primary.light', color: 'primary.dark', fontWeight: 700 },
            }}
            to={link.to}
          >
            <ListItemIcon sx={{ color: 'inherit', minWidth: 36 }}>{iconByRoute[link.to]}</ListItemIcon>
            <ListItemText primary={link.label} slotProps={{ primary: { sx: { fontWeight: 'inherit', fontSize: '0.9rem' } } }} />
          </ListItemButton>
        ))}
      </List>
    </nav>
  )
}
