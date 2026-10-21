import type { ReadingHeading } from '../../utils/readingContent'

interface Props {
  headings: ReadingHeading[]
}

const HeadingLinks = ({ headings }: Props) => (
  <nav aria-label="Mục lục nội dung">
    <ol className="reading-toc__links">
      {headings.map((heading) => (
        <li className={heading.level === 3 ? 'reading-toc__child' : undefined} key={heading.id}>
          <a href={`#${heading.id}`}>{heading.title}</a>
        </li>
      ))}
    </ol>
  </nav>
)

export const ReadingTableOfContents = ({ headings }: Props) => {
  if (headings.length === 0) return null

  return (
    <aside className="reading-toc">
      <div className="reading-toc__desktop">
        <p className="reading-toc__title">Mục lục</p>
        <HeadingLinks headings={headings} />
      </div>
      <details className="reading-toc__mobile">
        <summary>Mục lục <span>({headings.length} đề mục)</span></summary>
        <HeadingLinks headings={headings} />
      </details>
    </aside>
  )
}
