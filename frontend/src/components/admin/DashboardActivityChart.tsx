import type { AdminDashboard } from '../../api/adminOverview'

const series = [
  { key: 'articleCount', label: 'Bài viết', color: '#2e64b5' },
  { key: 'questionCount', label: 'Câu hỏi', color: '#55a1c1' },
  { key: 'answerCount', label: 'Câu trả lời', color: '#75a582' },
] as const

export const DashboardActivityChart = ({ items }: { items: AdminDashboard['activitySeries'] }) => {
  const width = 680
  const height = 235
  const left = 34
  const right = 15
  const top = 15
  const bottom = 34
  const maxValue =
    Math.ceil(Math.max(4, ...items.flatMap((item) => series.map((line) => item[line.key]))) / 4) * 4
  const chartWidth = width - left - right
  const chartHeight = height - top - bottom
  const x = (index: number) => left + (items.length > 1 ? index / (items.length - 1) : 0.5) * chartWidth
  const y = (value: number) => top + chartHeight - (value / maxValue) * chartHeight
  const dateLabel = (date: string) => date.slice(5).split('-').reverse().join('/')
  const labelIndexes = new Set([
    0,
    Math.floor((items.length - 1) / 3),
    Math.floor(((items.length - 1) * 2) / 3),
    items.length - 1,
  ])
  const hasActivity = items.some((item) => item.articleCount + item.questionCount + item.answerCount > 0)

  return (
    <div className="admin-chart-body">
      <svg
        aria-labelledby="activity-chart-title activity-chart-description"
        className="admin-chart"
        role="img"
        viewBox={`0 0 ${width} ${height}`}
      >
        <title id="activity-chart-title">Biểu đồ đóng góp theo ngày</title>
        <desc id="activity-chart-description">
          {hasActivity
            ? 'Ba đường thể hiện số bài viết, câu hỏi và câu trả lời công khai. Bảng số liệu chi tiết ở phía dưới.'
            : 'Chưa có đóng góp công khai trong khoảng thời gian đã chọn.'}
        </desc>
        {[0, 1, 2, 3, 4].map((step) => {
          const value = (maxValue * step) / 4
          return (
            <g key={step}>
              <line stroke="#e9edf3" x1={left} x2={width - right} y1={y(value)} y2={y(value)} />
              <text textAnchor="end" x={left - 9} y={y(value) + 3}>
                {value}
              </text>
            </g>
          )
        })}
        {items.map(
          (item, index) =>
            labelIndexes.has(index) && (
              <text
                key={item.date}
                textAnchor={index === 0 ? 'start' : index === items.length - 1 ? 'end' : 'middle'}
                x={x(index)}
                y={height - 9}
              >
                {dateLabel(item.date)}
              </text>
            ),
        )}
        {series.map((line) => (
          <g key={line.key}>
            <polyline
              fill="none"
              points={items.map((item, index) => `${x(index)},${y(item[line.key])}`).join(' ')}
              stroke={line.color}
              strokeLinejoin="round"
              strokeWidth="2.5"
            />
            {items.length === 1 && <circle cx={x(0)} cy={y(items[0][line.key])} fill={line.color} r="3" />}
          </g>
        ))}
      </svg>
      <div className="admin-chart-legend">
        {series.map((line) => (
          <span key={line.key}>
            <i style={{ background: line.color }} />
            {line.label}
          </span>
        ))}
      </div>
      {!hasActivity && (
        <p className="mt-3 text-xs text-slate-500">Chưa có đóng góp công khai trong kỳ này.</p>
      )}
      <details className="mt-4 text-[11px] text-slate-500">
        <summary className="cursor-pointer font-semibold">Xem bảng số liệu theo ngày</summary>
        <div className="admin-table-scroll mt-3 max-h-64">
          <table className="admin-table">
            <caption className="sr-only">Số lượng đóng góp theo ngày, giờ Việt Nam</caption>
            <thead>
              <tr>
                <th>Ngày</th>
                <th>Thành viên mới</th>
                {series.map((line) => (
                  <th key={line.key}>{line.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.date}>
                  <td>{item.date.split('-').reverse().join('/')}</td>
                  <td>{item.newMemberCount}</td>
                  {series.map((line) => (
                    <td key={line.key}>{item[line.key]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  )
}
