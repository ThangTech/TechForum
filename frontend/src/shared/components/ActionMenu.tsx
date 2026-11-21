import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import { useId, useState, type ReactNode } from 'react'

export type ActionMenuItem =
  | { type: 'divider' }
  | {
    id: string
    label: string
    onClick: () => void
    isDisabled?: boolean
    // 'destructive' dùng cho thao tác nguy hiểm như đăng xuất hay xóa.
    variant?: 'destructive'
  }

interface ActionMenuProps {
  label: string
  icon?: ReactNode
  items: ActionMenuItem[]
  menuWidth: number
  // Chỉ hiện icon (ví dụ avatar), nhãn dùng làm aria-label.
  isIconOnly?: boolean
}

export const ActionMenu = ({ label, icon, items, menuWidth, isIconOnly = false }: ActionMenuProps) => {
  const menuId = useId()
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const isOpen = anchor !== null
  const close = () => setAnchor(null)

  const triggerProps = {
    'aria-controls': isOpen ? menuId : undefined,
    'aria-expanded': isOpen ? true : undefined,
    'aria-haspopup': 'menu' as const,
    onClick: (event: React.MouseEvent<HTMLElement>) => setAnchor(event.currentTarget),
  }

  return (
    <>
      {isIconOnly ? (
        <IconButton aria-label={label} {...triggerProps}>{icon}</IconButton>
      ) : (
        <Button startIcon={icon} variant="contained" {...triggerProps}>{label}</Button>
      )}
      <Menu
        anchorEl={anchor}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        id={menuId}
        onClose={close}
        open={isOpen}
        slotProps={{ paper: { sx: { width: menuWidth, mt: 0.5 } } }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      >
        {items.map((item, index) => {
          if ('type' in item) return <Divider key={`divider-${index}`} />
          return (
            <MenuItem
              disabled={item.isDisabled}
              key={item.id}
              onClick={() => {
                close()
                item.onClick()
              }}
              sx={item.variant === 'destructive' ? { color: 'error.main' } : undefined}
            >
              {item.label}
            </MenuItem>
          )
        })}
      </Menu>
    </>
  )
}
