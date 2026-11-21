// The filter of the admin lists of categories and tags, which are loaded whole and filtered in the browser.

export type CatalogStatus = '' | 'active' | 'inactive'

interface CatalogItem {
  name: string
  slug: string
  isActive: boolean
}

// True when the item matches the keyword (in its name or its address, without the case) and the status.
export const matchesCatalogFilter = (item: CatalogItem, keyword: string, status: CatalogStatus): boolean => {
  const word = keyword.trim()
  const matchesKeyword = !word ||
    item.name.toLocaleLowerCase('vi').includes(word.toLocaleLowerCase('vi')) ||
    item.slug.toLowerCase().includes(word.toLowerCase())
  const matchesStatus = status === 'active' ? item.isActive : status === 'inactive' ? !item.isActive : true
  return matchesKeyword && matchesStatus
}
