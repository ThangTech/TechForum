export interface AdminBanner {
  id: string
  title: string
  imageUrl: string
  linkUrl: string | null
  displayOrder: number
  isActive: boolean
  startsAtUtc: string | null
  endsAtUtc: string | null
  createdAtUtc: string
}

export interface SaveBannerInput {
  title: string
  imageUrl: string
  linkUrl: string | null
  displayOrder: number
  startsAtUtc: string | null
  endsAtUtc: string | null
}
