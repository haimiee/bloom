import type { ReactNode } from 'react'

type LandingPageProps = {
  logoNode: ReactNode
  flowerNode: ReactNode
  heroImageVisible: boolean
  landingHeroImageUrl: string
  onHeroImageError: () => void
  onGoSignUp: () => void
  onGoLogin: () => void
}

export default function LandingPage({
  logoNode,
  flowerNode,
  heroImageVisible,
  landingHeroImageUrl,
  onHeroImageError,
  onGoSignUp,
  onGoLogin,
}: LandingPageProps) {
  return (
    <div className="landing-page">
      <header className="landing-nav">
        {logoNode}
        <div className="landing-nav-center" aria-hidden="true">
          {flowerNode}
        </div>
        <nav>
          <button className="nav-btn" onClick={onGoSignUp}>
            Sign Up
          </button>
          <button className="nav-btn" onClick={onGoLogin}>
            Log In
          </button>
        </nav>
      </header>

      <section className="hero-section">
        <div className="hero-art" aria-label="Landing art by Bloom frontend design team">
          {heroImageVisible && (
            <img
              src={landingHeroImageUrl}
              alt="Landing art"
              onError={onHeroImageError}
              loading="lazy"
            />
          )}
        </div>
        <article className="hero-card">
          <h1>Change The Way You Approach Your Health</h1>
          <p>
            Bloom helps you track hydration and mood with a friendlier, lower-pressure approach to daily wellness.
          </p>
          <button className="cta-btn" onClick={onGoSignUp}>
            Sign Up
          </button>
        </article>
      </section>

      <section className="values-band">
        <div className="value-card">
          <h2>Vibrant</h2>
          <p>Connection</p>
        </div>
        <div className="value-card">
          <h2>Authentic</h2>
          <p>Expression</p>
        </div>
        <div className="value-card">
          <h2>Honest</h2>
          <p>Wellness</p>
        </div>
      </section>

      <section className="about-section">
        <div className="about-panel">
          <h2>About Us</h2>
          <p>
            We are a Girls Who Code team building a more approachable way to track health. Bloom is designed to feel
            supportive, social, and realistic for everyday life.
          </p>
        </div>
        <div className="about-copy">
          <h3>An Accessible Tool That Makes Health... Approachable.</h3>
          <p>Join a judgment-free space focused on progress over perfection. We make wellness feel human.</p>
        </div>
      </section>

      <section className="features-section">
        <h2>What Makes Us Different?</h2>
        <p>A social approach to wellness</p>
        <div className="feature-grid">
          <article className="feature-card">
            <h3>Conversation</h3>
            <p>Share experiences, emotions, and progress with supportive people.</p>
          </article>
          <article className="feature-card">
            <h3>Tracking / Logging</h3>
            <p>Use simple tools to monitor goals with consistency and clarity.</p>
          </article>
          <article className="feature-card">
            <h3>Avatar Creation</h3>
            <p>Express your identity in a way that makes your wellness journey yours.</p>
          </article>
          <article className="feature-card">
            <h3>Friendly Competition</h3>
            <p>Motivation through growth-focused points and challenge systems.</p>
          </article>
        </div>
      </section>

      <section className="join-band">
        <h2>Join The Bloom Squad!</h2>
        <div className="join-actions">
          <button className="join-btn" onClick={onGoSignUp}>
            Create Account
          </button>
          <button className="ghost-btn" onClick={onGoLogin}>
            Existing User Log In
          </button>
        </div>
      </section>
    </div>
  )
}