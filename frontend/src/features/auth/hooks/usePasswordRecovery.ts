import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useLocation } from 'react-router-dom'
import { getActionError } from '../../../shared/hooks/useActionFeedback'
import { requestPasswordReset, resetPassword } from '../api/auth'
import type { ForgotPasswordFormValues, ResetPasswordFormValues } from '../types/authForms'

// The page "forgot password": sends the email and shows the answer of the API.
export const useForgotPasswordPage = () => {
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const form = useForm<ForgotPasswordFormValues>({ defaultValues: { email: '' } })

  const submit = form.handleSubmit(async ({ email }) => {
    setError(null)
    setMessage(null)
    try {
      const result = await requestPasswordReset(email.trim())
      setMessage(result.message)
    } catch (requestError) {
      setError(getActionError(requestError, 'Không thể gửi yêu cầu. Vui lòng thử lại.'))
    }
  })

  return { message, error, control: form.control, isSubmitting: form.formState.isSubmitting, submit }
}

// The page "new password", opened from the link of the email. The email and the token are after the # of the address,
// so the browser never sends them to a server or in a Referer.
export const useResetPasswordPage = () => {
  const location = useLocation()
  const parameters = new URLSearchParams(location.hash.slice(1))
  const email = parameters.get('email') ?? ''
  const token = parameters.get('token') ?? ''
  const [error, setError] = useState<string | null>(null)
  const [isComplete, setIsComplete] = useState(false)
  const form = useForm<ResetPasswordFormValues>({ defaultValues: { password: '', confirmation: '' } })

  const submit = form.handleSubmit(async ({ password }) => {
    setError(null)
    try {
      await resetPassword(email, token, password)
      setIsComplete(true)
      form.reset()
    } catch (requestError) {
      setError(getActionError(requestError, 'Không thể đặt lại mật khẩu. Vui lòng thử lại.'))
    }
  })

  return {
    email,
    hasValidLink: email !== '' && token !== '',
    isComplete,
    error,
    control: form.control,
    isSubmitting: form.formState.isSubmitting,
    submit,
  }
}
