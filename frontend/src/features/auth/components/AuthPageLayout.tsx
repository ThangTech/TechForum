import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { appRoutes } from '../../../app/appRoutes'

interface AuthPageLayoutProps {
  image: string
  title: string
  description: string
  children: ReactNode
}

// The frame of the login, register and password pages: a picture with a short text on one side, the form on the other.
export const AuthPageLayout = ({ image, title, description, children }: AuthPageLayoutProps) => {
  return (
    <main className="auth-page">
      <section className="auth-visual" aria-label="Giới thiệu TechForum">
        <Link className="auth-visual__brand" to={appRoutes.home}>Tech<span>Forum</span></Link>
        <div className="auth-visual__copy">
          <img src={image} alt="Cộng đồng cùng trao đổi kiến thức công nghệ" />
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </section>
      <section className="auth-form-panel">{children}</section>
    </main>
  )
}
