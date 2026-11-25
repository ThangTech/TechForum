import { useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../auth/hooks/authState'
import { getTourStorageKey, shouldStartTour } from '../utils/tourLogic'

const getPresentStep = (selector: string, title: string, intro: string) => {
  const element = document.querySelector(selector)
  return element ? { element, title, intro } : null
}

// The short guide of the home page (Intro.js). It starts by itself on the first visit, and again when the address has
// "?tour=1" (the link "Hướng dẫn sử dụng" in the footer), also when the visitor already is on the home page.
export const HomeTour = () => {
  const { user, isLoading } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const isRequested = searchParams.get('tour') === '1'
  const userId = user?.id ?? null
  // True from the moment the guide is put on screen until the visitor finishes or closes it.
  const isRunning = useRef(false)

  useEffect(() => {
    if (isLoading) return undefined

    const storageKey = getTourStorageKey(userId)
    // Đã xem lúc còn là khách thì không bật lại ngay sau khi đăng ký.
    const wasSeen = localStorage.getItem(storageKey) === 'true' || localStorage.getItem(getTourStorageKey(null)) === 'true'
    if (!shouldStartTour({ isRequested, isRunning: isRunning.current, wasSeen })) return undefined

    // The effect runs again when the account or the address changes. The guide that was about to start is then dropped
    // and the new run decides again, so a change during the short wait cannot lose the guide.
    let isCancelled = false
    const timer = window.setTimeout(async () => {
      const isSignedIn = userId !== null
      const steps = [
        getPresentStep('[data-tour="search"]', 'Tìm kiếm', 'Tìm bài viết và câu hỏi công khai bằng từ khóa.'),
        getPresentStep('[data-tour="content-types"]', 'Duyệt nội dung', 'Chuyển nhanh giữa bài viết, hỏi đáp và các thảo luận đang hoạt động.'),
        getPresentStep('[data-tour="content-feed"]', 'Khám phá cộng đồng', 'Mở một nội dung để đọc, thảo luận và xem các số liệu tương tác thật.'),
        getPresentStep('[data-tour="write"]', 'Chia sẻ kiến thức', isSignedIn
          ? 'Viết bài hoặc đặt câu hỏi mới cho cộng đồng.'
          : 'Chức năng viết nội dung sẽ yêu cầu bạn đăng nhập trước.'),
        getPresentStep('[data-tour="account"]', isSignedIn
          ? 'Tài khoản của bạn'
          : 'Tham gia TechForum', isSignedIn
          ? 'Mở menu để quản lý nội dung, bài đã lưu và tài khoản.'
          : 'Đăng nhập hoặc đăng ký để viết bài và tương tác.'),
      ].filter((step): step is NonNullable<typeof step> => step !== null)

      if (steps.length === 0) return

      const { default: introJs } = await import('intro.js')
      if (isCancelled || isRunning.current) return

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
      const finish = () => {
        isRunning.current = false
        localStorage.setItem(storageKey, 'true')
      }
      tour.onComplete(finish)
      tour.onSkip(finish)
      tour.onExit(finish)

      isRunning.current = true
      // The link in the footer is at the bottom of the page and the first step is in the header.
      if (isRequested) window.scrollTo({ top: 0 })
      void tour.start()

      if (isRequested) {
        // "?tour=1" did its work: it leaves the address, so a reload does not start the guide again.
        setSearchParams((current) => {
          const next = new URLSearchParams(current)
          next.delete('tour')
          return next
        }, { replace: true })
      }
    }, 300)

    return () => {
      isCancelled = true
      window.clearTimeout(timer)
    }
  }, [isLoading, isRequested, setSearchParams, userId])

  return null
}
