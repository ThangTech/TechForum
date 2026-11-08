import Alert from '@mui/material/Alert'

interface AdminFeedbackProps {
  error?: string | null
  success?: string | null
  info?: string | null
}

// The messages shown above an admin list: a failed action, a finished action or a notice.
export const AdminFeedback = ({ error, success, info }: AdminFeedbackProps) => (
  <>
    {info && <Alert role="status" severity="info" sx={{ mt: 2.5 }}>{info}</Alert>}
    {error && <Alert role="alert" severity="error" sx={{ mt: 2.5 }}>{error}</Alert>}
    {success && <Alert role="status" severity="success" sx={{ mt: 2.5 }}>{success}</Alert>}
  </>
)
