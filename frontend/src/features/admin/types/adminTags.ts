export interface AdminTag {
  id: string
  name: string
  slug: string
  description: string | null
  isActive: boolean
  topicCount: number
}

export interface SaveTagInput {
  name: string
  slug: string
  description: string | null
}
