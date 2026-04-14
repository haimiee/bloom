import { FormEvent, useMemo, useState } from 'react'
import './App.css'

type AuthFieldErrors = {
  name?: string
  email?: string
  password?: string
}

type AuthResponse = {
  message?: string
  userid?: number
  name?: string
  email?: string
  [key: string]: unknown
}

type Page = 'landing' | 'signup' | 'login' | 'tracker'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000'
const SIGNUP_ENDPOINT = import.meta.env.VITE_SIGNUP_ENDPOINT ?? '/auth/signup'
const LOGIN_ENDPOINT = import.meta.env.VITE_LOGIN_ENDPOINT ?? '/auth/login'

function getApiUrl(endpoint: string) {
  if (/^https?:\/\//i.test(endpoint)) {
    return endpoint
  }

  const normalizedBase = API_BASE_URL.endsWith('/') ? API_BASE_URL : `${API_BASE_URL}/`
  const normalizedPath = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint
  return new URL(normalizedPath, normalizedBase).toString()
}

function validateSignupForm(name: string, email: string, password: string): AuthFieldErrors {
  const errors: AuthFieldErrors = {}

  if (!name.trim() || name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters.'
  }

  const normalizedEmail = email.trim().toLowerCase()
  if (!normalizedEmail) {
    errors.email = 'Email is required.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(normalizedEmail)) {
    errors.email = 'Enter a valid email address.'
  }

  if (!password) {
    errors.password = 'Password is required.'
  } else if (password.length < 8) {
    errors.password = 'Password must be at least 8 characters.'
  } else if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    errors.password = 'Password must include at least one letter and one number.'
  }

  return errors
}

function validateLoginForm(email: string, password: string): AuthFieldErrors {
  const errors: AuthFieldErrors = {}
  const normalizedEmail = email.trim().toLowerCase()

  if (!normalizedEmail) {
    errors.email = 'Email is required.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(normalizedEmail)) {
    errors.email = 'Enter a valid email address.'
  }

  if (!password) {
    errors.password = 'Password is required.'
  }

  return errors
}

async function parseResponse(response: Response) {
  const text = await response.text()
  if (!text) {
    return null
  }

  try {
    return JSON.parse(text) as AuthResponse
  } catch {
    return null
  }
}

function App() {
  const [page, setPage] = useState<Page>('landing')
  const [authUser, setAuthUser] = useState<{ userid: number; name: string; email: string } | null>(null)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  const [showPassword, setShowPassword] = useState(false)
  const [showLoginPassword, setShowLoginPassword] = useState(false)

  const [signupErrors, setSignupErrors] = useState<AuthFieldErrors>({})
  const [loginErrors, setLoginErrors] = useState<AuthFieldErrors>({})
  const [statusMessage, setStatusMessage] = useState('')
  const [isErrorMessage, setIsErrorMessage] = useState(false)
  const [isSubmittingSignup, setIsSubmittingSignup] = useState(false)
  const [isSubmittingLogin, setIsSubmittingLogin] = useState(false)

  const signupUrl = useMemo(() => getApiUrl(SIGNUP_ENDPOINT), [])
  const loginUrl = useMemo(() => getApiUrl(LOGIN_ENDPOINT), [])

  function goToPage(nextPage: Page) {
    setStatusMessage('')
    setIsErrorMessage(false)
    setPage(nextPage)
  }

  async function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const errors = validateSignupForm(name, email, password)
    setSignupErrors(errors)

    if (Object.keys(errors).length > 0) {
      setStatusMessage('Please fix the highlighted fields.')
      setIsErrorMessage(true)
      return
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    try {
      setIsSubmittingSignup(true)
      setStatusMessage('Creating your account...')
      setIsErrorMessage(false)

      const response = await fetch(signupUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
        }),
        signal: controller.signal,
      })

      const parsed = await parseResponse(response)

      if (!response.ok) {
        const backendMessage =
          (parsed && typeof parsed.message === 'string' && parsed.message) ||
          (parsed && typeof parsed.detail === 'string' && parsed.detail) ||
          ''

        if (response.status === 404) {
          throw new Error(
            `Signup endpoint not found (${signupUrl}). Add a backend route for account creation or set VITE_SIGNUP_ENDPOINT.`
          )
        }

        throw new Error(backendMessage || `Signup failed with status ${response.status}.`)
      }

      setStatusMessage(parsed?.message || 'Account created. You can now log in.')
      setIsErrorMessage(false)
      setPassword('')
      setLoginEmail(email.trim().toLowerCase())
      setLoginPassword('')
      setTimeout(() => {
        goToPage('login')
      }, 400)
    } catch (error) {
      const fallback = 'Something went wrong while creating your account.'
      const message = error instanceof Error ? error.message : fallback
      setStatusMessage(message)
      setIsErrorMessage(true)
    } finally {
      clearTimeout(timeoutId)
      setIsSubmittingSignup(false)
    }
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const errors = validateLoginForm(loginEmail, loginPassword)
    setLoginErrors(errors)

    if (Object.keys(errors).length > 0) {
      setStatusMessage('Please fix the highlighted fields.')
      setIsErrorMessage(true)
      return
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    try {
      setIsSubmittingLogin(true)
      setStatusMessage('Logging you in...')
      setIsErrorMessage(false)

      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginEmail.trim().toLowerCase(),
          password: loginPassword,
        }),
        signal: controller.signal,
      })

      const parsed = await parseResponse(response)
      if (!response.ok) {
        const backendMessage =
          (parsed && typeof parsed.message === 'string' && parsed.message) ||
          (parsed && typeof parsed.detail === 'string' && parsed.detail) ||
          ''
        throw new Error(backendMessage || `Login failed with status ${response.status}.`)
      }

      const userName = typeof parsed?.name === 'string' ? parsed.name : 'Bloom User'
      const userEmail = typeof parsed?.email === 'string' ? parsed.email : loginEmail.trim().toLowerCase()
      const userId = typeof parsed?.userid === 'number' ? parsed.userid : 0

      setAuthUser({ userid: userId, name: userName, email: userEmail })
      setStatusMessage('Login successful. Welcome back.')
      setIsErrorMessage(false)
      setPage('tracker')
    } catch (error) {
      const fallback = 'Something went wrong while logging in.'
      const message = error instanceof Error ? error.message : fallback
      setStatusMessage(message)
      setIsErrorMessage(true)
    } finally {
      clearTimeout(timeoutId)
      setIsSubmittingLogin(false)
    }
  }

  function renderLanding() {
    return (
      <div className="landing-page">
        <header className="landing-nav">
          <button className="brand-chip" onClick={() => goToPage('landing')}>
            BLOOM
          </button>
          <nav>
            <button className="nav-btn" onClick={() => goToPage('signup')}>
              Sign Up
            </button>
            <button className="nav-btn" onClick={() => goToPage('login')}>
              Log In
            </button>
          </nav>
        </header>

        <section className="hero-section">
          <div className="hero-art" aria-hidden="true" />
          <article className="hero-card">
            <h1>Change The Way You Approach Your Health</h1>
            <p>
              Bloom helps you track hydration and mood with a friendlier, lower-pressure approach to daily
              wellness.
            </p>
            <button className="cta-btn" onClick={() => goToPage('signup')}>
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
              We are a Girls Who Code team building a more approachable way to track health. Bloom is designed to
              feel supportive, social, and realistic for everyday life.
            </p>
          </div>
          <div className="about-copy">
            <h3>An Accessible Tool That Makes Health... Approachable.</h3>
            <p>
              Join a judgment-free space focused on progress over perfection. We make wellness feel human.
            </p>
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
            <button className="join-btn" onClick={() => goToPage('signup')}>
              Create Account
            </button>
            <button className="ghost-btn" onClick={() => goToPage('login')}>
              Existing User Log In
            </button>
          </div>
        </section>
      </div>
    )
  }

  function renderAuthTopBar(title: string) {
    return (
      <div className="auth-topbar">
        <button type="button" className="ghost-btn" onClick={() => goToPage('landing')}>
          Back To Landing
        </button>
        <h1 className="brand">Bloom</h1>
        <p className="auth-title">{title}</p>
      </div>
    )
  }

  function renderSignup() {
    return (
      <div className="auth-page">
        <div className="auth-layout">
          <aside className="art-panel" aria-hidden="true">
            <div className="sprite-placeholder" />
          </aside>
          <section className="form-shell" aria-labelledby="signup-title">
            {renderAuthTopBar('Create Account')}
            <form className="signup-form" onSubmit={handleSignup} noValidate>
              <div className="field-wrap">
                <label htmlFor="signup-name">Your Name</label>
                <input
                  id="signup-name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Your Name"
                  aria-invalid={Boolean(signupErrors.name)}
                  aria-describedby={signupErrors.name ? 'signup-name-error' : undefined}
                />
                {signupErrors.name && (
                  <p className="field-error" id="signup-name-error" role="alert">
                    {signupErrors.name}
                  </p>
                )}
              </div>

              <div className="field-wrap">
                <label htmlFor="signup-email">Email</label>
                <input
                  id="signup-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Email"
                  aria-invalid={Boolean(signupErrors.email)}
                  aria-describedby={signupErrors.email ? 'signup-email-error' : undefined}
                />
                {signupErrors.email && (
                  <p className="field-error" id="signup-email-error" role="alert">
                    {signupErrors.email}
                  </p>
                )}
              </div>

              <div className="field-wrap">
                <label htmlFor="signup-password">Password</label>
                <div className="password-row">
                  <input
                    id="signup-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Password"
                    aria-invalid={Boolean(signupErrors.password)}
                    aria-describedby={signupErrors.password ? 'signup-password-error' : undefined}
                  />
                  <button
                    className="visibility-toggle"
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                {signupErrors.password && (
                  <p className="field-error" id="signup-password-error" role="alert">
                    {signupErrors.password}
                  </p>
                )}
              </div>

              <button className="primary-action" type="submit" disabled={isSubmittingSignup}>
                {isSubmittingSignup ? 'Creating...' : 'Start Blooming'}
              </button>
            </form>

            <p className={`status-message ${isErrorMessage ? 'error' : ''}`} role="status" aria-live="polite">
              {statusMessage}
            </p>

            <div className="login-row">
              <p>Have an account?</p>
              <button className="secondary-action" type="button" onClick={() => goToPage('login')}>
                Log In
              </button>
            </div>
          </section>
        </div>
      </div>
    )
  }

  function renderLogin() {
    return (
      <div className="auth-page">
        <div className="auth-layout single-column">
          <section className="form-shell" aria-labelledby="login-title">
            {renderAuthTopBar('Log In')}
            <form className="signup-form" onSubmit={handleLogin} noValidate>
              <div className="field-wrap">
                <label htmlFor="login-email">Email</label>
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  value={loginEmail}
                  onChange={(event) => setLoginEmail(event.target.value)}
                  placeholder="Email"
                  aria-invalid={Boolean(loginErrors.email)}
                  aria-describedby={loginErrors.email ? 'login-email-error' : undefined}
                />
                {loginErrors.email && (
                  <p className="field-error" id="login-email-error" role="alert">
                    {loginErrors.email}
                  </p>
                )}
              </div>

              <div className="field-wrap">
                <label htmlFor="login-password">Password</label>
                <div className="password-row">
                  <input
                    id="login-password"
                    type={showLoginPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={loginPassword}
                    onChange={(event) => setLoginPassword(event.target.value)}
                    placeholder="Password"
                    aria-invalid={Boolean(loginErrors.password)}
                    aria-describedby={loginErrors.password ? 'login-password-error' : undefined}
                  />
                  <button
                    className="visibility-toggle"
                    type="button"
                    onClick={() => setShowLoginPassword((current) => !current)}
                    aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                  >
                    {showLoginPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                {loginErrors.password && (
                  <p className="field-error" id="login-password-error" role="alert">
                    {loginErrors.password}
                  </p>
                )}
              </div>

              <button className="primary-action" type="submit" disabled={isSubmittingLogin}>
                {isSubmittingLogin ? 'Logging In...' : 'Enter Bloom'}
              </button>
            </form>

            <p className={`status-message ${isErrorMessage ? 'error' : ''}`} role="status" aria-live="polite">
              {statusMessage}
            </p>

            <div className="login-row">
              <p>Need an account?</p>
              <button className="secondary-action" type="button" onClick={() => goToPage('signup')}>
                Create Account
              </button>
            </div>
          </section>
        </div>
      </div>
    )
  }

  function renderTracker() {
    return (
      <div className="tracker-page">
        <header className="tracker-header">
          <h1>Bloom Activity Tracker</h1>
          <button className="ghost-btn" onClick={() => goToPage('landing')}>
            Back To Landing
          </button>
        </header>

        <section className="tracker-card">
          <h2>Welcome, {authUser?.name ?? 'Bloom User'}.</h2>
          <p>
            You are logged in as {authUser?.email ?? 'your account'}. This is your flow destination before the full
            tracker modules are added.
          </p>
          <div className="tracker-grid">
            <article>
              <h3>Hydration Log</h3>
              <p>Next step: connect to /water POST and /water GET endpoints.</p>
            </article>
            <article>
              <h3>Mood Log</h3>
              <p>Next step: connect to /mood POST and /moods GET endpoints.</p>
            </article>
            <article>
              <h3>Daily Summary</h3>
              <p>Next step: display /summary data with progress visuals and plant stage.</p>
            </article>
          </div>
        </section>
      </div>
    )
  }

  if (page === 'signup') {
    return renderSignup()
  }

  if (page === 'login') {
    return renderLogin()
  }

  if (page === 'tracker') {
    return renderTracker()
  }

  return renderLanding()
}

export default App
