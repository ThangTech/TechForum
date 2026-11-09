// Makes the address part of a name: "Spring Boot" -> "spring-boot", "Cơ sở dữ liệu" -> "co-so-du-lieu".
// Letters lose their accents, everything is lower case and any other characters become a single dash.
export const toSlug = (text: string, maxLength: number): string => {
  const slug = text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  // Cutting can leave a dash at the end.
  return slug.slice(0, maxLength).replace(/-+$/, '')
}

// The same rule as the API: lower case letters and digits in groups that are separated by one dash.
export const isValidSlug = (slug: string, maxLength: number): boolean =>
  slug.length > 0 && slug.length <= maxLength && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)

export const slugRuleMessage = 'Chỉ gồm chữ thường không dấu, số và dấu gạch ngang, ví dụ: spring-boot.'
