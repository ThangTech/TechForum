export interface AdminCategory {
  id: string
  name: string
  slug: string
  description: string | null
  displayOrder: number
  isActive: boolean
  topicCount: number
}

export interface SaveCategoryInput {
  name: string
  slug: string
  description: string | null
  displayOrder: number
}
