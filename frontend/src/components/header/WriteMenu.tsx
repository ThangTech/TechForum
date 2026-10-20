import { DropdownMenu, type DropdownMenuOption } from '@astryxdesign/core/DropdownMenu'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { appRoutes } from '../../appRoutes'
import { useAuth } from '../../auth/authState'
import { AuthRequiredDialog } from '../AuthRequiredDialog'

const PenIcon = () => (
  <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 24 24" width="18">
    <path d="M4 20h4l11-11a2.8 2.8 0 0 0-4-4L4 16v4Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    <path d="m13.5 6.5 4 4" stroke="currentColor" strokeWidth="2" />
  </svg>
)

export const WriteMenu = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const write = (type: 'article' | 'question') => {
    if (!user) {
      setIsAuthOpen(true)
      return
    }
    navigate(`${appRoutes.write}?type=${type}`)
  }
  const items: DropdownMenuOption[] = [
    { id: 'article', label: 'Viết bài', onClick: () => write('article') },
    { id: 'question', label: 'Đặt câu hỏi', onClick: () => write('question') },
  ]

  return (
    <span data-tour="write" title="Viết nội dung">
      <DropdownMenu
        alignment="end"
        button={{ icon: <PenIcon />, label: 'Viết', variant: 'primary' }}
        items={items}
        menuWidth={180}
        placement="below"
      />
      <AuthRequiredDialog isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </span>
  )
}
