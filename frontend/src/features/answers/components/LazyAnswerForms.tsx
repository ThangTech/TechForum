import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { lazy, Suspense, type ComponentProps } from 'react'

// Trình soạn thảo (TipTap) khá nặng: chỉ tải khi trang có ô trả lời, để trang chủ và danh sách vẫn nhẹ.
const AnswerFormModule = lazy(() => import('./AnswerForm').then((module) => ({ default: module.AnswerForm })))
const AnswerEditDialogModule = lazy(() => import('./AnswerEditDialog').then((module) => ({ default: module.AnswerEditDialog })))

const Loading = () => (
  <Box sx={{ p: 3, border: 1, borderColor: 'divider', borderRadius: 2 }}>
    <Typography color="text.secondary" role="status" variant="body2">Đang mở ô trả lời…</Typography>
  </Box>
)

export const AnswerForm = (props: ComponentProps<typeof AnswerFormModule>) => (
  <Suspense fallback={<Loading />}><AnswerFormModule {...props} /></Suspense>
)

export const AnswerEditDialog = (props: ComponentProps<typeof AnswerEditDialogModule>) => (
  <Suspense fallback={null}><AnswerEditDialogModule {...props} /></Suspense>
)
