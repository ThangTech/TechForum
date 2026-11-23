import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { getActionError } from '../../../shared/hooks/useActionFeedback'
import type { LoginFormValues } from '../types/authForms'
import { getLoginNotice } from '../utils/passwordRules'
import { getSafeReturnUrl } from '../utils/returnUrl'
import { useAuth } from './authState'
import { useGoogleSignIn } from './useGoogleSignIn'

// The login page: the form, the message left by another page, and where to go after the login.
export const useLoginPage = () => {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const returnUrl = getSafeReturnUrl(searchParams.get('returnUrl'))
  const [error, setError] = useState<string | null>(null)
  const google = useGoogleSignIn(returnUrl)
  const form = useForm<LoginFormValues>({ defaultValues: { email: '', password: '', rememberMe: false } })

  const submit = form.handleSubmit(async (values) => {
    setError(null)
    try {
      await login(values)
      navigate(returnUrl, { replace: true })
    } catch (requestError) {
      setError(getActionError(requestError, 'Không thể đăng nhập lúc này. Vui lòng thử lại.'))
    }
  })

  return {
    // A signed-in member is sent on to where they wanted to go.
    isSignedIn: user !== null,
    returnUrl,
    notice: getLoginNotice(location.state),
    error: error ?? google.error,
    signInWithGoogle: google.signIn,
    control: form.control,
    isSubmitting: form.formState.isSubmitting,
    submit,
  }
}
