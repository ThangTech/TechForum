import { usePublicStatistics } from '../../queries/statistics'
import { InlineStats } from '../common/InlineStats'

interface HomeHeroProps {
  title: string
  description: string
}

const formatCount = (value: number) => new Intl.NumberFormat('vi-VN').format(value)

export const HomeHero = ({ title, description }: HomeHeroProps) => {
  // Số liệu chỉ là thông tin phụ: nếu lỗi thì không có dữ liệu và dòng thống kê bị ẩn, không chặn trang.
  const { data: statistics } = usePublicStatistics()

  return (
    <section className="home-hero" aria-labelledby="page-title">
      <div className="home-hero__copy">
        <p className="eyebrow">Cộng đồng công nghệ Việt</p>
        <h1 id="page-title">{title}</h1>
        <p className="home-hero__description">{description}</p>
        {statistics && (
          <InlineStats
            items={[
              { value: formatCount(statistics.memberCount), label: 'thành viên' },
              { value: formatCount(statistics.articleCount), label: 'bài viết' },
              { value: formatCount(statistics.questionCount), label: 'câu hỏi' },
            ]}
            label="Thống kê cộng đồng"
            sx={{ mt: 1.5 }}
          />
        )}
      </div>
    </section>
  )
}
