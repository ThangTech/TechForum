import TextField, { type TextFieldProps } from '@mui/material/TextField'
import { useController, type FieldValues, type UseControllerProps } from 'react-hook-form'

type FormTextFieldProps<TFieldValues extends FieldValues> =
  Omit<TextFieldProps, 'name' | 'defaultValue' | 'error' | 'helperText' | 'onChange' | 'onBlur' | 'value'> &
  Pick<UseControllerProps<TFieldValues>, 'name' | 'control' | 'rules'> & {
    // Lỗi trả về từ API cho trường này; hiển thị khi không có lỗi kiểm tra ở trình duyệt.
    serverError?: string
  }

// Nối một TextField của MUI với React Hook Form để các form không phải lặp lại đoạn Controller.
export const FormTextField = <TFieldValues extends FieldValues>({
  name,
  control,
  rules,
  serverError,
  ...textFieldProps
}: FormTextFieldProps<TFieldValues>) => {
  const { field, fieldState } = useController({ name, control, rules })
  const message = fieldState.error?.message ?? serverError

  return (
    <TextField
      {...textFieldProps}
      error={Boolean(message)}
      helperText={message}
      inputRef={field.ref}
      name={field.name}
      onBlur={field.onBlur}
      onChange={field.onChange}
      value={field.value ?? ''}
    />
  )
}
