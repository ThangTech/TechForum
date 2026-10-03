import { Navigate, useLocation, useParams } from 'react-router-dom'

interface LegacyRouteRedirectProps {
  to: string | ((params: Readonly<Record<string, string | undefined>>) => string)
}

export const LegacyRouteRedirect = ({ to }: LegacyRouteRedirectProps) => {
  const location = useLocation()
  const params = useParams()
  const pathname = typeof to === 'function' ? to(params) : to

  return <Navigate replace to={`${pathname}${location.search}${location.hash}`} />
}
