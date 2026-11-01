import Button from '@mui/material/Button'

interface AsyncStatePanelProps {
  error: string | null
  isLoading: boolean
  loadingText: string
  onRetry: () => void
}

export const AsyncStatePanel = ({
  error,
  isLoading,
  loadingText,
  onRetry,
}: AsyncStatePanelProps) => {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500" role="status">
        {loadingText}
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4 rounded-xl border border-red-200 bg-white p-10 text-center" role="alert">
        <p className="text-sm text-red-700">{error}</p>
        <Button onClick={onRetry} variant="outlined">Thử lại</Button>
      </div>
    )
  }

  return null
}
