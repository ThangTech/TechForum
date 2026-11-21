interface HomeHeroProps {
  title: string
  description: string
}

export const HomeHero = ({ title, description }: HomeHeroProps) => (
  <section className="home-hero" aria-labelledby="page-title">
    <div className="home-hero__copy">
      <p className="eyebrow">Cộng đồng công nghệ Việt</p>
      <h1 id="page-title">{title}</h1>
      <p className="home-hero__description">{description}</p>
    </div>
  </section>
)
