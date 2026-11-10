import type { TopicFeedMode, TopicRange } from '../../api/topics'

// The tabs of the news feed, in order. The word shown on the tab is the second one.
export const feedTabs = [
  ['latest', 'Mới nhất'],
  ['hot', 'Hot'],
  ['top', 'Top'],
  ['weekly', 'Nổi bật tuần'],
  ['following', 'Đang theo dõi'],
] as const satisfies readonly (readonly [TopicFeedMode, string])[]

// The times of the tab "Top", with the word shown for each.
export const topRanges = [
  ['day', 'Hôm nay'],
  ['week', 'Tuần này'],
  ['month', 'Tháng này'],
  ['all', 'Mọi thời đại'],
] as const satisfies readonly (readonly [TopicRange, string])[]

export const defaultTopRange: TopicRange = 'week'

// The tab that the address (?feed=) asks for; anything that is not a tab gives "latest".
export const parseFeed = (value: string | null): TopicFeedMode =>
  feedTabs.some(([feed]) => feed === value) ? (value as TopicFeedMode) : 'latest'

export const parseRange = (value: string | null): TopicRange =>
  topRanges.some(([range]) => range === value) ? (value as TopicRange) : defaultTopRange

// The "sort" that the API is asked for. "weekly", "hot" and "top" are sorts of the API; "latest" and "following" are not.
export const getFeedSort = (feed: TopicFeedMode, fixedSort?: 'discussion'): 'discussion' | 'weekly' | 'hot' | 'top' | undefined =>
  feed === 'weekly' || feed === 'hot' || feed === 'top' ? feed : fixedSort

// The score is shown on the cards of the tabs that order by it.
export const showsScore = (feed: TopicFeedMode): boolean => feed === 'hot' || feed === 'top'

// The sentence under the tabs, so a visitor knows how the list is ordered.
export const describeFeed = (feed: TopicFeedMode, range: TopicRange): string => {
  switch (feed) {
    case 'weekly':
      return 'Các bài được quan tâm qua lượt đánh giá, lưu và trả lời trong 7 ngày gần nhất. Số liệu trên bài là tổng tương tác.'
    case 'following':
      return 'Nội dung công khai từ tác giả bạn theo dõi; bài ghim trước, sau đó mới nhất.'
    case 'hot':
      return 'Bài được bình chọn nhiều trong thời gian ngắn lên đầu, rồi tự hạ dần theo thời gian. Điểm của bài mới được ẩn trong 2 giờ đầu.'
    case 'top': {
      const label = topRanges.find(([value]) => value === range)?.[1] ?? ''
      return `Bài có điểm bình chọn cao nhất (${label.toLowerCase()}). Điểm của bài mới được ẩn trong 2 giờ đầu.`
    }
    default:
      return 'Bài ghim trước, sau đó mới nhất'
  }
}
