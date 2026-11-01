import { useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { appRoutes } from '../../appRoutes'
import { SearchIcon } from '../common/NavIcons'

const HeaderSearchForm = ({ initialKeyword }: { initialKeyword: string }) => {
  const navigate = useNavigate()
  const [keyword, setKeyword] = useState(initialKeyword)

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const params = new URLSearchParams()
    if (keyword.trim()) params.set('keyword', keyword.trim())
    navigate({ pathname: appRoutes.search, search: params.toString() })
  }

  return (
    <form className="search-unavailable" data-tour="search" onSubmit={handleSearch} role="search">
      <button aria-label="Tìm kiếm" className="search-unavailable__button" type="submit">
        <SearchIcon />
      </button>
      <label className="sr-only" htmlFor="header-search">Tìm bài viết và câu hỏi</label>
      <input
        id="header-search"
        onChange={(event) => setKeyword(event.target.value)}
        placeholder="Tìm bài viết và câu hỏi"
        value={keyword}
      />
    </form>
  )
}

// Ô tìm kiếm duy nhất của trang: nhấn Enter hoặc bấm kính lúp để tìm. Khi đang ở trang tìm kiếm,
// ô nhập hiển thị lại từ khóa hiện tại; đổi từ khóa trên URL thì tạo lại form bằng key.
export const HeaderSearch = () => {
  const location = useLocation()
  const urlKeyword = location.pathname === appRoutes.search
    ? new URLSearchParams(location.search).get('keyword') ?? ''
    : ''

  return <HeaderSearchForm initialKeyword={urlKeyword} key={urlKeyword} />
}
