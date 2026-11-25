import TextField, { type TextFieldProps } from '@mui/material/TextField'
import { useState } from 'react'
import { useController, type FieldValues, type UseControllerProps } from 'react-hook-form'

type FormTextFieldProps<TFieldValues extends FieldValues> =
  Omit<TextFieldProps, 'name' | 'defaultValue' | 'error' | 'helperText' | 'onChange' | 'onBlur' | 'value'> &
  Pick<UseControllerProps<TFieldValues>, 'name' | 'control' | 'rules'> & {
    // Lỗi trả về từ API cho trường này; hiển thị khi không có lỗi kiểm tra ở trình duyệt.
    serverError?: string
    // Gợi ý hiện dưới ô khi không có lỗi (ví dụ quy tắc mật khẩu).
    hint?: string
  }

// Nối một TextField của MUI với React Hook Form để các form không phải lặp lại đoạn Controller.
export const FormTextField = <TFieldValues extends FieldValues>({
  name,
  control,
  rules,
  serverError,
  hint,
  ...textFieldProps
}: FormTextFieldProps<TFieldValues>) => {
  const { field, fieldState } = useController({ name, control, rules })
  // Người dùng sửa ô thì lỗi cũ của API ẩn đi, không còn treo tới lần gửi sau.
  const [dismissedError, setDismissedError] = useState<string | undefined>()
  const visibleServerError = serverError !== dismissedError ? serverError : undefined
  const message = fieldState.error?.message ?? visibleServerError

  return (
    <TextField
      {...textFieldProps}
      error={Boolean(message)}
      helperText={message ?? hint}
      inputRef={field.ref}
      name={field.name}
      onBlur={field.onBlur}
      onChange={(event) => {
        setDismissedError(serverError)
        field.onChange(event)
      }}
      value={field.value ?? ''}
    />
  )
}
