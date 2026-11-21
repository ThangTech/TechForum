import { useEffect, useRef } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'
import { getHashTargetId, getScrollBlock } from '../utils/scrollTarget'

// React Router does not move the scroll bar when the page changes, so a link in the footer would open the next
// page at the same height. This fixes it in two ways:
// - a link with a hash ("/articles#topic-list", "#header-search") scrolls to the element with that id, and
//   focuses it when it is a box to type in;
// - a link to another page without a hash starts that page at the top.
// Going back and forward is left to the browser, which remembers where the visitor was.
export const ScrollManager = () => {
  const { hash, key, pathname } = useLocation()
  const navigationType = useNavigationType()
  const lastPathname = useRef(pathname)

  useEffect(() => {
    const isNewPage = lastPathname.current !== pathname
    lastPathname.current = pathname
    const targetId = getHashTargetId(hash)

    if (!targetId) {
      if (isNewPage && navigationType !== 'POP') window.scrollTo({ top: 0 })
      return undefined
    }

    // The target may be drawn a moment after the route changes, so it is looked for during a short time.
    let frame = 0
    let attempts = 0
    const scrollToTarget = () => {
      const target = document.getElementById(targetId)
      if (target) {
        target.scrollIntoView({ block: getScrollBlock(target.tagName) })
        if (getScrollBlock(target.tagName) === 'center') target.focus({ preventScroll: true })
        return
      }
      attempts += 1
      if (attempts < 30) frame = window.requestAnimationFrame(scrollToTarget)
    }
    scrollToTarget()
    return () => window.cancelAnimationFrame(frame)
    // key changes with every navigation, so the same link pressed twice scrolls twice.
  }, [hash, key, navigationType, pathname])

  return null
}
