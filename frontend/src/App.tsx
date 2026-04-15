import { FormEvent, useEffect, useMemo, useState, type CSSProperties } from 'react'
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

type WaterLog = {
  id: number
  amount: number
  created_at: string
}

type WaterSummaryResponse = {
  userid: number
  date: string
  goal: number
  amount_logged: number
  percentage: number
  plant_stage: number
  water_logs: WaterLog[]
}

type Page = 'landing' | 'signup' | 'login' | 'dashboard' | 'activity'

type AuthUser = {
  userid: number
  name: string
  email: string
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000'
const LANDING_HERO_IMAGE_URL = import.meta.env.VITE_LANDING_HERO_IMAGE_URL ?? '/landing-hero.png'
const LANDING_BACKGROUND_IMAGE_URL = import.meta.env.VITE_LANDING_BACKGROUND_IMAGE_URL ?? ''
const DASHBOARD_BACKGROUND_IMAGE_URL = import.meta.env.VITE_DASHBOARD_BACKGROUND_IMAGE_URL ?? ''
const PLANT_IMAGE_URL = import.meta.env.VITE_PLANT_IMAGE_URL ?? ''
const PLANT_STAGE_IMAGE_URLS: Record<number, string> = {
  0: import.meta.env.VITE_PLANT_STAGE_0_IMAGE_URL ?? '',
  1: import.meta.env.VITE_PLANT_STAGE_1_IMAGE_URL ?? '',
  2: import.meta.env.VITE_PLANT_STAGE_2_IMAGE_URL ?? '',
  3: import.meta.env.VITE_PLANT_STAGE_3_IMAGE_URL ?? '',
  4: import.meta.env.VITE_PLANT_STAGE_4_IMAGE_URL ?? '',
}
const SIGNUP_ENDPOINT = import.meta.env.VITE_SIGNUP_ENDPOINT ?? '/auth/signup'
const LOGIN_ENDPOINT = import.meta.env.VITE_LOGIN_ENDPOINT ?? '/auth/login'
const WATER_ENDPOINT = import.meta.env.VITE_WATER_ENDPOINT ?? '/water'
const LOG_WATER_ENDPOINT = import.meta.env.VITE_LOG_WATER_ENDPOINT ?? '/water'
const AUTH_COOKIE_NAME = 'bloom_auth_user'
const AUTH_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24

function getBackgroundStyle(variableName: string, imageUrl: string): CSSProperties | undefined {
  if (!imageUrl) {
    return undefined
  }

  return {
    [variableName]: `url("${imageUrl}")`,
  } as CSSProperties
}

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

function getCookieValue(name: string) {
  const pattern = `; ${document.cookie}`
  const segments = pattern.split(`; ${name}=`)
  if (segments.length === 2) {
    return segments.pop()?.split(';').shift() ?? null
  }
  return null
}

function saveAuthUserCookie(user: AuthUser) {
  const serialized = encodeURIComponent(JSON.stringify(user))
  document.cookie = `${AUTH_COOKIE_NAME}=${serialized}; Max-Age=${AUTH_COOKIE_MAX_AGE_SECONDS}; Path=/; SameSite=Lax`
}

function clearAuthUserCookie() {
  document.cookie = `${AUTH_COOKIE_NAME}=; Max-Age=0; Path=/; SameSite=Lax`
}

function loadAuthUserFromCookie(): AuthUser | null {
  const rawCookie = getCookieValue(AUTH_COOKIE_NAME)
  if (!rawCookie) {
    return null
  }

  try {
    const parsed = JSON.parse(decodeURIComponent(rawCookie)) as AuthUser
    if (
      typeof parsed.userid === 'number' &&
      parsed.userid > 0 &&
      typeof parsed.name === 'string' &&
      typeof parsed.email === 'string'
    ) {
      return parsed
    }
  } catch {
    clearAuthUserCookie()
  }

  return null
}

function pageToHash(page: Page) {
  return `#/${page}`
}

function hashToPage(hash: string): Page | null {
  const normalized = hash.replace(/^#\/?/, '').trim().toLowerCase()

  if (
    normalized === 'landing' ||
    normalized === 'signup' ||
    normalized === 'login' ||
    normalized === 'dashboard' ||
    normalized === 'activity'
  ) {
    return normalized
  }

  return null
}

function guardPage(page: Page, isAuthenticated: boolean): Page {
  if (!isAuthenticated && (page === 'dashboard' || page === 'activity')) {
    return 'landing'
  }

  return page
}

function getInitialPage(isAuthenticated: boolean): Page {
  const fromHash = hashToPage(window.location.hash)
  if (!fromHash) {
    return isAuthenticated ? 'dashboard' : 'landing'
  }
  return guardPage(fromHash, isAuthenticated)
}

function clampProgress(percentage: number) {
  if (Number.isNaN(percentage)) {
    return 0
  }
  return Math.max(0, Math.min(1, percentage))
}

function formatMonthHeader(dateValue: string) {
  const basis = dateValue ? new Date(`${dateValue}T00:00:00`) : new Date()
  return basis.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function getTodayDateInputValue() {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

function getPlantStageLabel(stage: number) {
  if (stage >= 4) {
    return 'Blooming'
  }
  if (stage === 3) {
    return 'Growing Strong'
  }
  if (stage === 2) {
    return 'Sprouting'
  }
  if (stage === 1) {
    return 'Seedling'
  }
  return 'Seed'
}

function App() {
  const [page, setPage] = useState<Page>(() => getInitialPage(Boolean(loadAuthUserFromCookie())))
  const [authUser, setAuthUser] = useState<AuthUser | null>(() => loadAuthUserFromCookie())

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

  const [selectedWaterDate, setSelectedWaterDate] = useState(getTodayDateInputValue())
  const [waterSummary, setWaterSummary] = useState<WaterSummaryResponse | null>(null)
  const [waterError, setWaterError] = useState('')
  const [isLoadingWater, setIsLoadingWater] = useState(false)
  const [waterAmountInput, setWaterAmountInput] = useState('8')
  const [isLoggingWater, setIsLoggingWater] = useState(false)
  const [activityMessage, setActivityMessage] = useState('')
  const [activityError, setActivityError] = useState('')
  const [heroImageVisible, setHeroImageVisible] = useState(true)
  const [plantDisplayMode, setPlantDisplayMode] = useState<'ground' | 'pot'>('ground')
  const [navMenuOpen, setNavMenuOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)

  const signupUrl = useMemo(() => getApiUrl(SIGNUP_ENDPOINT), [])
  const loginUrl = useMemo(() => getApiUrl(LOGIN_ENDPOINT), [])
  const waterUrl = useMemo(() => getApiUrl(WATER_ENDPOINT), [])
  const logWaterUrl = useMemo(() => getApiUrl(LOG_WATER_ENDPOINT), [])

  useEffect(() => {
    if (authUser) {
      saveAuthUserCookie(authUser)
      return
    }
    clearAuthUserCookie()
  }, [authUser])

  useEffect(() => {
    const applyUrlState = () => {
      const fromHash = hashToPage(window.location.hash)
      const fallbackPage = authUser ? 'dashboard' : 'landing'
      const guardedPage = guardPage(fromHash ?? fallbackPage, Boolean(authUser))

      setPage(guardedPage)

      if (!fromHash || guardedPage !== fromHash) {
        window.history.replaceState({}, '', pageToHash(guardedPage))
      }
    }

    applyUrlState()
    window.addEventListener('hashchange', applyUrlState)
    window.addEventListener('popstate', applyUrlState)

    return () => {
      window.removeEventListener('hashchange', applyUrlState)
      window.removeEventListener('popstate', applyUrlState)
    }
  }, [authUser])

  async function fetchWaterSummary() {
    if (!authUser?.userid) {
      setWaterSummary(null)
      setWaterError('No logged-in user was found for hydration lookup.')
      return
    }

    const requestUrl = new URL(waterUrl)
    requestUrl.searchParams.set('userid', String(authUser.userid))
    if (selectedWaterDate) {
      requestUrl.searchParams.set('date', selectedWaterDate)
    }

    try {
      setIsLoadingWater(true)
      setWaterError('')

      const response = await fetch(requestUrl.toString())
      if (!response.ok) {
        throw new Error(`Unable to load hydration data (${response.status}).`)
      }

      const data = (await response.json()) as WaterSummaryResponse
      setWaterSummary(data)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load hydration data.'
      setWaterSummary(null)
      setWaterError(message)
    } finally {
      setIsLoadingWater(false)
    }
  }

  useEffect(() => {
    if (page !== 'dashboard' && page !== 'activity') {
      return
    }
    void fetchWaterSummary()
  }, [page, authUser?.userid, selectedWaterDate])

  useEffect(() => {
    const plantStage = waterSummary?.plant_stage ?? 0
    setPlantDisplayMode(plantStage >= 4 ? 'ground' : 'pot')
  }, [waterSummary?.plant_stage])

  useEffect(() => {
    setNavMenuOpen(false)
    setProfileMenuOpen(false)
  }, [page])

  async function handleLogWater(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!authUser?.userid) {
      setActivityError('You must be logged in to log water.')
      return
    }

    const parsedAmount = Number.parseInt(waterAmountInput, 10)
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setActivityError('Enter a valid water amount in ounces.')
      return
    }

    try {
      setIsLoggingWater(true)
      setActivityError('')
      setActivityMessage('Logging water...')

      const response = await fetch(logWaterUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parsedAmount,
          userid: authUser.userid,
        }),
      })

      const payload = await response.json()

      if (!response.ok) {
        const backendMessage =
          (payload && typeof payload.message === 'string' && payload.message) ||
          (payload && typeof payload.detail === 'string' && payload.detail) ||
          ''
        throw new Error(backendMessage || 'Unable to log water right now.')
      }

      if (payload && typeof payload.summary === 'object' && payload.summary) {
        setWaterSummary(payload.summary as WaterSummaryResponse)
      } else {
        await fetchWaterSummary()
      }

      setActivityMessage(`Logged ${parsedAmount} oz successfully.`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to log water right now.'
      setActivityError(message)
      setActivityMessage('')
    } finally {
      setIsLoggingWater(false)
    }
  }

  function navigateTo(nextPage: Page, options?: { replace?: boolean; ignoreAuthGuard?: boolean }) {
    const guardedPage = options?.ignoreAuthGuard ? nextPage : guardPage(nextPage, Boolean(authUser))
    const targetHash = pageToHash(guardedPage)

    if (options?.replace) {
      window.history.replaceState({}, '', targetHash)
    } else {
      window.history.pushState({}, '', targetHash)
    }

    setStatusMessage('')
    setIsErrorMessage(false)
    setNavMenuOpen(false)
    setProfileMenuOpen(false)
    setPage(guardedPage)
  }

  function goToPage(nextPage: Page) {
    navigateTo(nextPage)
  }

  function handleLogout() {
    setAuthUser(null)
    setWaterSummary(null)
    setWaterError('')
    setActivityError('')
    setActivityMessage('')
    setNavMenuOpen(false)
    setProfileMenuOpen(false)
    navigateTo('landing', { replace: true, ignoreAuthGuard: true })
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
      navigateTo('dashboard', { ignoreAuthGuard: true })
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
          {renderBloomLogo('nav')}
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
          <div className="hero-art" aria-label="Landing art by Bloom frontend design team">
            {heroImageVisible && (
              <img
                src={LANDING_HERO_IMAGE_URL}
                alt="Landing art"
                onError={() => setHeroImageVisible(false)}
                loading="lazy"
              />
            )}
          </div>
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

  function renderBloomLogo(mode: 'nav' | 'auth') {
    return (
      <button
        className={`bloom-logo ${mode}`}
        onClick={() => navigateTo('landing', { ignoreAuthGuard: true })}
        aria-label="Go to landing page"
      >
        Bloom
      </button>
    )
  }

  function renderHamburgerMenu() {
    return (
      <div className="nav-dropdown-wrap">
        <button
          type="button"
          className={`hamburger-btn ${navMenuOpen ? 'open' : ''}`}
          aria-label="Open navigation menu"
          aria-expanded={navMenuOpen}
          onClick={() => setNavMenuOpen((current) => !current)}
        >
          <span />
          <span />
          <span />
        </button>

        {navMenuOpen && (
          <div className="nav-dropdown" role="menu" aria-label="Navigation menu">
            <button className="nav-dropdown-item" onClick={() => navigateTo('dashboard', { ignoreAuthGuard: true })}>
              <span className="home-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M12 3 2.5 11.2l1.3 1.5L5 11.8V20h5v-5h4v5h5v-8.2l1.2.9 1.3-1.5L12 3Z" />
                </svg>
              </span>
              Home
            </button>
          </div>
        )}
      </div>
    )
  }

  function renderProfileMenu() {
    const profileName = authUser?.name?.trim() || 'User'

    return (
      <div className="nav-dropdown-wrap profile-wrap">
        <span className="profile-name" aria-hidden="true">
          {profileName}
        </span>
        <button
          type="button"
          className={`profile-btn ${profileMenuOpen ? 'open' : ''}`}
          aria-label="Open profile menu"
          aria-expanded={profileMenuOpen}
          onClick={() => setProfileMenuOpen((current) => !current)}
        >
          <span className="profile-avatar" aria-hidden="true" />
        </button>

        {profileMenuOpen && (
          <div className="nav-dropdown profile-dropdown" role="menu" aria-label="Profile menu">
            <button className="nav-dropdown-item danger" onClick={handleLogout}>
              Logout
            </button>
          </div>
        )}
      </div>
    )
  }

  function renderAuthTopBar(title: string) {
    return (
      <div className="auth-topbar">
        <button type="button" className="ghost-btn" onClick={() => goToPage('landing')}>
          Back To Landing
        </button>
        {renderBloomLogo('auth')}
        <p className="auth-title">{title}</p>
      </div>
    )
  }

  function renderDashboardNav(activePage: 'dashboard' | 'activity') {
    return (
      <header className="dashboard-nav">
        <div className="dashboard-nav-left">
          {renderHamburgerMenu()}
          {renderBloomLogo('nav')}
          <button
            className={`dashboard-link ${activePage === 'activity' ? 'is-active' : ''}`}
            onClick={() => navigateTo('activity', { ignoreAuthGuard: true })}
          >
            Activity Logging
          </button>
        </div>

        <div className="dashboard-nav-right">{renderProfileMenu()}</div>
      </header>
    )
  }

  function renderPlantStagePanel() {
    const stage = waterSummary?.plant_stage ?? 0
    const hydrationRatio = clampProgress(waterSummary?.percentage ?? 0)
    const hydrationPercent = Math.round((waterSummary?.percentage ?? 0) * 100)
    const isFullyBloomed = stage >= 4
    const useGroundDisplay = isFullyBloomed && plantDisplayMode === 'ground'
    const plantImageUrl = PLANT_STAGE_IMAGE_URLS[stage] || PLANT_IMAGE_URL
    const handlePlantToggle = () => {
      if (!isFullyBloomed) {
        return
      }

      setPlantDisplayMode((current) => (current === 'ground' ? 'pot' : 'ground'))
    }

    return (
      <aside className="plant-panel">
        <h2>Your Plant</h2>
        <p className="plant-stage-text">
          {isFullyBloomed ? (
            <strong>Your plant has fully bloomed!</strong>
          ) : (
            <>
              Stage {stage}/4: <strong>{getPlantStageLabel(stage)}</strong>
            </>
          )}
        </p>

        <button
          type="button"
          className={`plant-visual ${plantImageUrl ? 'has-image' : ''} ${isFullyBloomed ? 'is-clickable' : ''}`}
          aria-label={
            isFullyBloomed
              ? plantDisplayMode === 'ground'
                ? 'Fully bloomed plant in the ground. Click to place it in a pot.'
                : 'Fully bloomed plant in a pot. Click to place it in the ground.'
              : `Plant stage ${stage}`
          }
          aria-pressed={isFullyBloomed && plantDisplayMode === 'pot'}
          onClick={handlePlantToggle}
        >
          {plantImageUrl ? (
            <img className="plant-stage-image" src={plantImageUrl} alt="" aria-hidden="true" draggable={false} />
          ) : (
            <>
              <div className="plant-sun" />
              <div className="plant-cloud cloud-one" />
              <div className="plant-cloud cloud-two" />
              <div className="plant-hills" />
              {useGroundDisplay ? <div className="plant-ground ground-visible" /> : <div className="plant-ground" />}
              {!useGroundDisplay && <div className="plant-pot" />}
              {stage >= 1 && <div className="plant-stem" />}
              {stage >= 2 && <div className="plant-leaf leaf-left" />}
              {stage >= 2 && <div className="plant-leaf leaf-right" />}
              {stage >= 3 && <div className="plant-leaf leaf-top-left" />}
              {stage >= 3 && <div className="plant-leaf leaf-top-right" />}
              {stage >= 4 && <div className="plant-bloom" />}
            </>
          )}
        </button>

        <div className="plant-meter">
          <span style={{ width: `${hydrationPercent}%` }} />
        </div>
        <p className="plant-meta">Hydration: {hydrationPercent}% of daily goal</p>
      </aside>
    )
  }

  function renderProgressBar(label: string, percentage: number, variant: 'blue' | 'green' | 'gold') {
    const segmentCount = 12
    const filledSegments = Math.round(clampProgress(percentage) * segmentCount)

    return (
      <div className={`progress-card ${variant}`}>
        <div className="progress-card-title">{label}</div>
        <div className="progress-card-track">
          {Array.from({ length: segmentCount }).map((_, index) => (
            <span key={`${label}-${index}`} className={index < filledSegments ? 'filled' : ''} />
          ))}
        </div>
      </div>
    )
  }

  function renderDashboard() {
    const hydrationRatio = clampProgress(waterSummary?.percentage ?? 0)
    const moodRatio = clampProgress((waterSummary?.water_logs.length ?? 0) / 8)
    const pageStyle = getBackgroundStyle('--dashboard-background-image', DASHBOARD_BACKGROUND_IMAGE_URL)

    return (
      <div className="dashboard-page" style={pageStyle}>
        {renderDashboardNav('dashboard')}

        <main className="dashboard-main">
          <section className="greeting-banner">
            <h1>Good Morning, {authUser?.name ?? 'Bloom User'}!</h1>
            <p>Small daily actions build long-term wellness. Your progress is updated from your latest logs.</p>
          </section>

          {renderPlantStagePanel()}

          <div className="dashboard-content">
            <section className="dashboard-grid">
              <article className="calendar-card">
                <h2>{formatMonthHeader(selectedWaterDate)}</h2>
                <p>Calendar interactions are coming soon. Date filtering already updates hydration data.</p>
                <div className="calendar-placeholder" aria-hidden="true">
                  {Array.from({ length: 35 }).map((_, index) => (
                    <span key={index}>{index + 1 <= 31 ? index + 1 : ''}</span>
                  ))}
                </div>
              </article>

              <article className="tasks-card">
                <h2>Upcoming Tasks</h2>
                <ul>
                  <li>Log water at least 3 times today</li>
                  <li>Complete one mood check-in</li>
                  <li>Review your summary before bed</li>
                </ul>
              </article>

              <article className="friends-card">
                <h2>Your Friends</h2>
                <p>Community feed and friend comparisons will be added in a later milestone.</p>
                <div className="friend-snapshot">
                  <div className="friend-avatar" />
                  <div>
                    <p className="friend-name">Wellness Buddy</p>
                    <p className="friend-note">Hydration streak active</p>
                  </div>
                </div>
              </article>
            </section>

            <section className="progress-stack">
              {renderProgressBar('Hydration Progress', hydrationRatio, 'blue')}
              {renderProgressBar('Activity Progress', moodRatio, 'green')}
              {renderProgressBar('Consistency Score', (hydrationRatio + moodRatio) / 2, 'gold')}
            </section>

            <section className="dashboard-actions">
              <button className="join-btn" onClick={() => navigateTo('activity', { ignoreAuthGuard: true })}>
                Go To Activity Logging
              </button>
              <div className="dashboard-meta">
                {waterError ? (
                  <p className="error-text">{waterError}</p>
                ) : (
                  <p>
                    Latest hydration: {waterSummary?.amount_logged ?? 0} / {waterSummary?.goal ?? 64} oz
                  </p>
                )}
              </div>
            </section>
          </div>
        </main>
      </div>
    )
  }

  function renderActivity() {
    const hydrationPercentage = Math.round(clampProgress(waterSummary?.percentage ?? 0) * 100)
    const pageStyle = getBackgroundStyle('--dashboard-background-image', DASHBOARD_BACKGROUND_IMAGE_URL)

    return (
      <div className="dashboard-page" style={pageStyle}>
        {renderDashboardNav('activity')}

        <main className="activity-main">
          <section className="greeting-banner">
            <h1>Good Morning, {authUser?.name ?? 'Bloom User'}!</h1>
            <p>Track your activity and water, then watch your plant react as you progress.</p>
          </section>

          {renderPlantStagePanel()}

          <div className="activity-content">
            <section className="activity-card">
              <h1>Activity Logging</h1>
              <p>Log what you do now. Calendar interactions and extra activities can be layered in next.</p>

              <form className="activity-form" onSubmit={handleLogWater}>
                <label htmlFor="water-amount">Water Amount (oz)</label>
                <input
                  id="water-amount"
                  type="number"
                  min={1}
                  step={1}
                  value={waterAmountInput}
                  onChange={(event) => setWaterAmountInput(event.target.value)}
                />
                <button className="primary-action" type="submit" disabled={isLoggingWater}>
                  {isLoggingWater ? 'Saving...' : 'Log Water'}
                </button>
              </form>

              <div className="tracker-toolbar">
                <label htmlFor="water-date">Hydration Date</label>
                <input
                  id="water-date"
                  type="date"
                  value={selectedWaterDate}
                  onChange={(event) => setSelectedWaterDate(event.target.value)}
                />
                <button className="ghost-btn" onClick={() => void fetchWaterSummary()} disabled={isLoadingWater}>
                  {isLoadingWater ? 'Loading...' : 'Refresh'}
                </button>
              </div>

              {activityMessage && <p className="success-text">{activityMessage}</p>}
              {activityError && <p className="error-text">{activityError}</p>}

              <div className="tracker-grid">
                <article>
                  <h3>Hydration Log</h3>
                  {waterError ? (
                    <p>{waterError}</p>
                  ) : (
                    <>
                      <p>
                        {waterSummary
                          ? `${waterSummary.amount_logged} oz of ${waterSummary.goal} oz (${hydrationPercentage}%)`
                          : 'No hydration summary available yet.'}
                      </p>
                      <p>
                        Plant Stage: <strong>{waterSummary?.plant_stage ?? 0}</strong>
                      </p>
                      <p>
                        Entries Today: <strong>{waterSummary?.water_logs.length ?? 0}</strong>
                      </p>
                    </>
                  )}
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

              <div className="water-log-list">
                <h3>Water Entries</h3>
                {waterSummary?.water_logs.length ? (
                  <ul>
                    {waterSummary.water_logs.map((log) => (
                      <li key={log.id}>
                        <span>{log.amount} oz</span>
                        <span>{new Date(log.created_at).toLocaleTimeString()}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No water entries for this date yet.</p>
                )}
              </div>
            </section>
          </div>
        </main>
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

  if (page === 'signup') {
    return renderSignup()
  }

  if (page === 'login') {
    return renderLogin()
  }

  if (page === 'dashboard') {
    return renderDashboard()
  }

  if (page === 'activity') {
    return renderActivity()
  }

  return renderLanding()
}

export default App
