import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ApiError } from '../../../shared/api/client'
import { getFieldError } from '../../../shared/api/fieldErrors'
import type { RegisterFormValues } from '../types/authForms'
import { getSafeReturnUrl } from '../utils/returnUrl'
import { useAuth } from './authState'

// The register page: the form, the errors of each field sent back by the API, and where to go after.
export const useRegisterPage = () => {
  const { user, register } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const returnUrl = getSafeReturnUrl(searchParams.get('returnUrl'))
  const [apiError, setApiError] = useState<ApiError | null>(null)
  const [clientError, setClientError] = useState<string | null>(null)
  const form = useForm<RegisterFormValues>({
    defaultValues: { displayName: '', email: '', password: '', confirmPassword: '' },
  })

  const submit = form.handleSubmit(async ({ displayName, email, password }) => {
    setApiError(null)
    setClientError(null)
    try {
      await register({ displayName, email, password })
      navigate(returnUrl, { replace: true })
    } catch (requestError) {
      if (requestError instanceof ApiError) setApiError(requestError)
      else setClientError('Không thể đăng ký lúc này. Vui lòng thử lại.')
    }
  })

  return {
    isSignedIn: user !== null,
    returnUrl,
    // The error that belongs to no field (or to the account as a whole).
    generalError: clientError || getFieldError(apiError, 'account') || apiError?.message,
    fieldError: (name: keyof RegisterFormValues) => getFieldError(apiError, name),
    control: form.control,
    isSubmitting: form.formState.isSubmitting,
    submit,
  }
}
