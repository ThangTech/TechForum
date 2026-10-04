import { Component, type ErrorInfo, type ReactNode } from 'react'

interface AppErrorBoundaryProps {
  children: ReactNode
}

interface AppErrorBoundaryState {
  hasError: boolean
}

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  public state: AppErrorBoundaryState = { hasError: false }

  public static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Lỗi render giao diện TechForum.', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return (
        <main className="mx-auto grid min-h-screen max-w-2xl place-content-center gap-4 px-6 text-center">
          <h1 className="text-2xl font-bold text-slate-900">Không thể hiển thị trang này</h1>
          <p className="text-slate-600">
            Giao diện gặp lỗi ngoài dự kiến. Bạn có thể tải lại trang để thử lại.
          </p>
          <button
            className="mx-auto rounded-lg bg-blue-700 px-4 py-2 font-semibold text-white hover:bg-blue-800"
            onClick={() => window.location.reload()}
            type="button"
          >
            Tải lại trang
          </button>
        </main>
      )
    }

    return this.props.children
  }
}
