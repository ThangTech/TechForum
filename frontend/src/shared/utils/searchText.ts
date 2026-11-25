// Chuẩn hoá để so khớp không phân biệt hoa/thường và dấu tiếng Việt (đ → d), giống văn bản tìm kiếm ở backend.
export const normalizeForSearch = (value: string): string =>
  value
    .trim()
    .toLocaleLowerCase('vi')
    .replaceAll('đ', 'd')
    .normalize('NFD')
    .replace(/\p{Mn}/gu, '')
    .replace(/\s+/g, ' ')
