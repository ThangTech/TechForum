import { useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../auth/authState'

const TOUR_STORAGE_PREFIX = 'techforum.home-tour.completed'

const getPresentStep = (selector: string, title: string, intro: string) => {
  const element = document.querySelector(selector)
  return element ? { element, title, intro } : null
}

export const HomeTour = () => {
  const { user, isLoading } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const hasStarted = useRef(false)

  useEffect(() => {
    if (isLoading || hasStarted.current) return

    const storageKey = `${TOUR_STORAGE_PREFIX}.${user?.id ?? 'guest'}`
    const isRequested = searchParams.get('tour') === '1'
    if (!isRequested && localStorage.getItem(storageKey) === 'true') return

    hasStarted.current = true
    const timer = window.setTimeout(async () => {
      const steps = [
        getPresentStep('[data-tour="search"]', 'Tìm kiếm', 'Tìm bài viết và câu hỏi công khai bằng từ khóa.'),
        getPresentStep('[data-tour="content-types"]', 'Duyệt nội dung', 'Chuyển nhanh giữa bài viết, hỏi đáp và trang chủ.'),
        getPresentStep('[data-tour="content-feed"]', 'Khám phá cộng đồng', 'Mở một nội dung để đọc, thảo luận và xem các số liệu tương tác thật.'),
        getPresentStep('[data-tour="write"]', 'Chia sẻ kiến thức', user
          ? 'Viết bài hoặc đặt câu hỏi mới cho cộng đồng.'
          : 'Chức năng viết nội dung sẽ yêu cầu bạn đăng nhập trước.'),
        getPresentStep('[data-tour="account"]', user
          ? 'Tài khoản của bạn'
          : 'Tham gia TechForum', user
          ? 'Mở menu để quản lý nội dung, bài đã lưu và tùy chỉnh.'
          : 'Đăng nhập hoặc đăng ký để viết bài và tương tác.'),
      ].filter((step): step is NonNullable<typeof step> => step !== null)

      if (steps.length === 0) return

      const { default: introJs } = await import('intro.js')
      const tour = introJs.tour().setOptions({
        steps,
        nextLabel: 'Tiếp tục',
        prevLabel: 'Quay lại',
        skipLabel: 'Bỏ qua',
        doneLabel: 'Hoàn tất',
        showProgress: true,
        showStepNumbers: true,
        exitOnOverlayClick: false,
      })
      const rememberCompletion = () => localStorage.setItem(storageKey, 'true')
      tour.onComplete(rememberCompletion)
      tour.onSkip(rememberCompletion)
      tour.onExit(rememberCompletion)
      void tour.start()

      if (isRequested) {
        const next = new URLSearchParams(searchParams)
        next.delete('tour')
        setSearchParams(next, { replace: true })
      }
    }, 300)

    return () => window.clearTimeout(timer)
  }, [isLoading, searchParams, setSearchParams, user])

  return null
}
