import Box, { type BoxProps } from '@mui/material/Box'
import { useEffect, useRef } from 'react'
import { highlightCodeBlocks } from '../../utils/codeHighlight'

type RichHtmlProps = Omit<BoxProps, 'children' | 'dangerouslySetInnerHTML'> & {
  // HTML that the backend already cleaned (an article, an answer, a preview).
  html: string
}

// Shows the cleaned HTML of the content and colours its code blocks. It runs again when the HTML changes.
export const RichHtml = ({ html, ...boxProps }: RichHtmlProps) => {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (ref.current) highlightCodeBlocks(ref.current)
  }, [html])

  return <Box {...boxProps} dangerouslySetInnerHTML={{ __html: html }} ref={ref} />
}
