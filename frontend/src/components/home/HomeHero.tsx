import { useEffect, useState } from 'react'
import { getPublicStatistics, type PublicStatistics } from '../../api/statistics'

interface HomeHeroProps {
  title: string
  description: string
}

const formatCount = (value: number) => new Intl.NumberFormat('vi-VN').format(value)

export const HomeHero = ({ title, description }: HomeHeroProps) => {
  const [statistics, setStatistics] = useState<PublicStatistics | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    // Số liệu chỉ là thông tin phụ: nếu lỗi thì ẩn khối thống kê, không chặn trang.
    getPublicStatistics(controller.signal)
      .then(setStatistics)
      .catch(() => undefined)
    return () => controller.abort()
  }, [])

  return (
    <section className="home-hero" aria-labelledby="page-title">
      <div className="home-hero__copy">
        <p className="eyebrow">Cộng đồng công nghệ Việt</p>
        <h1 id="page-title">{title}</h1>
        <p className="home-hero__description">{description}</p>
      </div>
      {statistics && (
        <dl className="home-hero__stats" aria-label="Thống kê cộng đồng">
          <div><dd>{formatCount(statistics.memberCount)}</dd><dt>Thành viên</dt></div>
          <div><dd>{formatCount(statistics.articleCount)}</dd><dt>Bài viết</dt></div>
          <div><dd>{formatCount(statistics.questionCount)}</dd><dt>Câu hỏi</dt></div>
        </dl>
      )}
    </section>
  )
}
