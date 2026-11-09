import { appRoutes } from '../../appRoutes'

export interface FooterLink {
  label: string
  to: string
}

// The links of the "Khám phá" column. They are the same for everybody.
export const exploreLinks: FooterLink[] = [
  { label: 'Bài viết', to: appRoutes.articles },
  { label: 'Hỏi đáp', to: appRoutes.questions },
  { label: 'Thảo luận', to: appRoutes.discussions },
  { label: 'Cộng đồng', to: appRoutes.communities },
  // Not a page: it takes the visitor to the search box in the header, wherever they are (the id is in HeaderSearch).
  { label: 'Tìm kiếm', to: '#header-search' },
]

// The "Của bạn" column: a member gets the pages of their own, a guest gets the way in.
export const getAccountLinks = (isSignedIn: boolean): FooterLink[] =>
  isSignedIn
    ? [
        { label: 'Viết bài mới', to: appRoutes.write },
        { label: 'Nội dung của tôi', to: appRoutes.myTopics },
        { label: 'Bài đã lưu', to: appRoutes.saved },
        { label: 'Hoạt động', to: appRoutes.activity },
        { label: 'Thông báo', to: appRoutes.notifications },
        { label: 'Báo cáo của tôi', to: appRoutes.myReports },
      ]
    : [
        { label: 'Đăng nhập', to: appRoutes.login },
        { label: 'Đăng ký', to: appRoutes.register },
        { label: 'Quên mật khẩu', to: appRoutes.forgotPassword },
      ]

// A link to the list of a page: the list has the id "topic-list", so the page opens at the list and not at its title.
export const toTopicList = (path: string, search: string): string => `${path}?${search}#topic-list`

// Shows the first few items of a long list so that the footer does not grow with the data.
export const takeFirst = <T>(items: readonly T[] | undefined, count: number): T[] => (items ?? []).slice(0, count)
