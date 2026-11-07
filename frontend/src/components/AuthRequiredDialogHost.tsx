import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuthDialogStore } from '../auth/authDialogStore'
import { AuthRequiredDialog } from './AuthRequiredDialog'

// The only place where the "please log in" dialog is mounted. Open it with openAuthDialog().
export const AuthRequiredDialogHost = () => {
  const isOpen = useAuthDialogStore((state) => state.isOpen)
  const close = useAuthDialogStore((state) => state.close)
  const location = useLocation()

  // The dialog sends the user to the login or register page. This host stays mounted on every page,
  // so it must close itself when the page changes.
  useEffect(() => {
    close()
  }, [close, location.key])

  return <AuthRequiredDialog isOpen={isOpen} onClose={close} />
}
