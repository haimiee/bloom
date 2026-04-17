import { FormEvent, useEffect, useMemo, useState, type CSSProperties } from 'react'
import './App.css'
import bloomLogo from '../assets/images/logo/bloomlogo.png'
import landingLandscapeGif from '../assets/images/landingpage/landscape.gif'
import plantStage1Image from '../assets/images/plant/stage1.png'
import plantStage2Image from '../assets/images/plant/stage2.png'
import plantStage3Image from '../assets/images/plant/stage3.png'
import plantStage4Image from '../assets/images/plant/stage4.png'
import LandingPage from './screens/LandingPage'
import LoginPage from './screens/LoginPage'
import SignupPage from './screens/SignupPage'
import AskMoodPage from './screens/AskMoodPage'
import { ActivityPage, DashboardPage } from './screens/DashboardPage'
import ProfilePage from './screens/ProfilePage'
import AvatarEditorModal from './components/AvatarEditorModal'
import AvatarPreview from './components/AvatarPreview'
import { getDefaultAvatarSelection } from './avatar'
import {
  AVATAR_ASSETS,
  AvatarLayerKey,
  AvatarSelection,
  isAvatarSetupDone,
  loadAvatarSelectionForUser,
  markAvatarSetupDone,
  saveAvatarSelectionForUser,
} from './avatar'

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

type MoodLog = {
  id: number
  mood: string
  created_at: string
}

type CommunityFeedEntry = {
  userid: number
  name: string
  activity_type: 'water' | 'mood'
  summary: string
  created_at: string
  avatar?: AvatarSelection | null
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

type DailySummaryResponse = WaterSummaryResponse & {
  moods_logged: number
  moods: MoodLog[]
}

type WeekActivityDay = {
  key: string
  label: string
  date: string
  hasActivity: boolean
  hasWater: boolean
  hasMood: boolean
  isToday: boolean
}

type Page = 'landing' | 'signup' | 'login' | 'ask-mood' | 'dashboard' | 'activity' | 'profile'

type AuthUser = {
  userid: number
  name: string
  email: string
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? `${window.location.protocol}//${window.location.hostname}:8000`
const LANDING_HERO_IMAGE_URL = import.meta.env.VITE_LANDING_HERO_IMAGE_URL ?? landingLandscapeGif
const LANDING_BACKGROUND_IMAGE_URL = import.meta.env.VITE_LANDING_BACKGROUND_IMAGE_URL ?? ''
const DASHBOARD_BACKGROUND_IMAGE_URL = import.meta.env.VITE_DASHBOARD_BACKGROUND_IMAGE_URL ?? ''
const PLANT_STAGE_IMAGE_URLS: Record<number, string> = {
  0: '',
  1: import.meta.env.VITE_PLANT_STAGE_1_IMAGE_URL ?? plantStage1Image,
  2: import.meta.env.VITE_PLANT_STAGE_2_IMAGE_URL ?? plantStage2Image,
  3: import.meta.env.VITE_PLANT_STAGE_3_IMAGE_URL ?? plantStage3Image,
  4: import.meta.env.VITE_PLANT_STAGE_4_IMAGE_URL ?? plantStage4Image,
}
const SIGNUP_ENDPOINT = import.meta.env.VITE_SIGNUP_ENDPOINT ?? '/auth/signup'
const LOGIN_ENDPOINT = import.meta.env.VITE_LOGIN_ENDPOINT ?? '/auth/login'
const WATER_ENDPOINT = import.meta.env.VITE_WATER_ENDPOINT ?? '/water'
const LOG_WATER_ENDPOINT = import.meta.env.VITE_LOG_WATER_ENDPOINT ?? '/water'
const LOG_MOOD_ENDPOINT = import.meta.env.VITE_LOG_MOOD_ENDPOINT ?? '/mood'
const MOODS_ENDPOINT = import.meta.env.VITE_MOODS_ENDPOINT ?? '/moods'
const SUMMARY_ENDPOINT = import.meta.env.VITE_SUMMARY_ENDPOINT ?? '/summary'
const COMMUNITY_FEED_ENDPOINT = import.meta.env.VITE_COMMUNITY_FEED_ENDPOINT ?? '/community-feed'
const MOOD_OPTIONS_ENDPOINT = import.meta.env.VITE_MOOD_OPTIONS_ENDPOINT ?? '/mood-options'
const AVATAR_ENDPOINT = import.meta.env.VITE_AVATAR_ENDPOINT ?? '/avatar'
const SESSION_ENDPOINT = import.meta.env.VITE_SESSION_ENDPOINT ?? '/auth/session'
const LOGOUT_ENDPOINT = import.meta.env.VITE_LOGOUT_ENDPOINT ?? '/auth/logout'
const AUTH_USER_STORAGE_KEY = 'bloom_auth_user'
const MOOD_PROMPT_DONE_PREFIX = 'bloom_mood_prompt_done'
const DEFAULT_MOOD_OPTIONS = ['Happy', 'Calm', 'Focused', 'Excited', 'Tired', 'Stressed']

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

function saveAuthUserToStorage(user: AuthUser) {
  try {
    localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(user))
  } catch {
    // Ignore storage errors in restricted browser modes.
  }
}

function clearAuthUserFromStorage() {
  try {
    localStorage.removeItem(AUTH_USER_STORAGE_KEY)
  } catch {
    // Ignore storage errors in restricted browser modes.
  }
}

function loadAuthUserFromStorage(): AuthUser | null {
  try {
    const rawValue = localStorage.getItem(AUTH_USER_STORAGE_KEY)
    if (!rawValue) {
      return null
    }

    const parsed = JSON.parse(rawValue) as AuthUser
    if (
      typeof parsed.userid === 'number' &&
      parsed.userid > 0 &&
      typeof parsed.name === 'string' &&
      typeof parsed.email === 'string'
    ) {
      return parsed
    }
  } catch {
    clearAuthUserFromStorage()
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
    normalized === 'ask-mood' ||
    normalized === 'dashboard' ||
    normalized === 'activity' ||
    normalized === 'profile'
  ) {
    return normalized
  }

  return null
}

function guardPage(page: Page, isAuthenticated: boolean): Page {
  if (!isAuthenticated && (page === 'ask-mood' || page === 'dashboard' || page === 'activity' || page === 'profile')) {
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
  return 'Nothing'
}

function getTodayDayString() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function buildMoodPromptDoneKey(userId: number, dayString: string) {
  return `${MOOD_PROMPT_DONE_PREFIX}:${userId}:${dayString}`
}

function hasCompletedMoodPromptToday(userId: number, dayString: string) {
  try {
    return localStorage.getItem(buildMoodPromptDoneKey(userId, dayString)) === '1'
  } catch {
    return false
  }
}

function markMoodPromptCompletedToday(userId: number, dayString: string) {
  try {
    localStorage.setItem(buildMoodPromptDoneKey(userId, dayString), '1')
  } catch {
    // Ignore storage errors in restricted browser modes.
  }
}

function getStartOfWeekSunday(referenceDate: Date) {
  const start = new Date(referenceDate)
  start.setHours(0, 0, 0, 0)
  start.setDate(referenceDate.getDate() - referenceDate.getDay())
  return start
}

function toDayString(value: Date) {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getTimeOfDayGreeting() {
  const hour = new Date().getHours()

  if (hour >= 18) {
    return 'Good Evening'
  }
  if (hour >= 12) {
    return 'Good Afternoon'
  }
  if (hour >= 5) {
    return 'Good Morning'
  }
  return 'Good Night'
}

function getLongestActiveStreak(days: WeekActivityDay[]) {
  let longest = 0
  let current = 0

  for (const day of days) {
    if (day.hasActivity) {
      current += 1
      longest = Math.max(longest, current)
    } else {
      current = 0
    }
  }

  return longest
}

function getUserHandle(email: string) {
  const localPart = email.split('@')[0]?.trim()
  if (!localPart) {
    return '@bloom_user'
  }

  return `@${localPart}`
}

function App() {
  const [page, setPage] = useState<Page>(() => getInitialPage(Boolean(loadAuthUserFromStorage())))
  const [authUser, setAuthUser] = useState<AuthUser | null>(() => loadAuthUserFromStorage())

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

  const [waterSummary, setWaterSummary] = useState<WaterSummaryResponse | null>(null)
  const [dailySummary, setDailySummary] = useState<DailySummaryResponse | null>(null)
  const [weekActivity, setWeekActivity] = useState<WeekActivityDay[]>([])
  const [moodLogs, setMoodLogs] = useState<MoodLog[]>([])
  const [communityFeed, setCommunityFeed] = useState<CommunityFeedEntry[]>([])
  const [waterError, setWaterError] = useState('')
  const [moodError, setMoodError] = useState('')
  const [communityFeedError, setCommunityFeedError] = useState('')
  const [isLoadingDailyData, setIsLoadingDailyData] = useState(false)
  const [waterAmountInput, setWaterAmountInput] = useState('8')
  const [moodInput, setMoodInput] = useState('Calm')
  const [askMoodSelection, setAskMoodSelection] = useState('Calm')
  const [askMoodOptions, setAskMoodOptions] = useState<string[]>(DEFAULT_MOOD_OPTIONS)
  const [askMoodHasHistory, setAskMoodHasHistory] = useState(false)
  const [isCustomAskMood, setIsCustomAskMood] = useState(false)
  const [askMoodCustomText, setAskMoodCustomText] = useState('')
  const [isLoggingWater, setIsLoggingWater] = useState(false)
  const [isLoggingMood, setIsLoggingMood] = useState(false)
  const [isSubmittingAskMood, setIsSubmittingAskMood] = useState(false)
  const [askMoodError, setAskMoodError] = useState('')
  const [activityMessage, setActivityMessage] = useState('')
  const [activityError, setActivityError] = useState('')
  const [heroImageVisible, setHeroImageVisible] = useState(true)
  const [navMenuOpen, setNavMenuOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [avatarSelection, setAvatarSelection] = useState<AvatarSelection>(() => getDefaultAvatarSelection())
  const [avatarModalMode, setAvatarModalMode] = useState<'onboarding' | 'editor' | null>(null)

  const signupUrl = useMemo(() => getApiUrl(SIGNUP_ENDPOINT), [])
  const loginUrl = useMemo(() => getApiUrl(LOGIN_ENDPOINT), [])
  const logWaterUrl = useMemo(() => getApiUrl(LOG_WATER_ENDPOINT), [])
  const logMoodUrl = useMemo(() => getApiUrl(LOG_MOOD_ENDPOINT), [])
  const moodsUrl = useMemo(() => getApiUrl(MOODS_ENDPOINT), [])
  const summaryUrl = useMemo(() => getApiUrl(SUMMARY_ENDPOINT), [])
  const communityFeedUrl = useMemo(() => getApiUrl(COMMUNITY_FEED_ENDPOINT), [])
  const moodOptionsUrl = useMemo(() => getApiUrl(MOOD_OPTIONS_ENDPOINT), [])
  const avatarUrl = useMemo(() => getApiUrl(AVATAR_ENDPOINT), [])
  const sessionUrl = useMemo(() => getApiUrl(SESSION_ENDPOINT), [])
  const logoutUrl = useMemo(() => getApiUrl(LOGOUT_ENDPOINT), [])

  useEffect(() => {
    document.title = 'Bloom'

    const existingFavicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
    if (existingFavicon) {
      existingFavicon.href = bloomLogo
      existingFavicon.type = 'image/png'
      return
    }

    const favicon = document.createElement('link')
    favicon.rel = 'icon'
    favicon.type = 'image/png'
    favicon.href = bloomLogo
    document.head.appendChild(favicon)
  }, [])

  function applySummaryState(summary: DailySummaryResponse) {
    setDailySummary(summary)
    setMoodLogs(summary.moods ?? [])
    setWaterSummary({
      userid: summary.userid,
      date: summary.date,
      goal: summary.goal,
      amount_logged: summary.amount_logged,
      percentage: summary.percentage,
      plant_stage: summary.plant_stage,
      water_logs: summary.water_logs,
    })
  }

  useEffect(() => {
    if (authUser) {
      saveAuthUserToStorage(authUser)
      return
    }
    clearAuthUserFromStorage()
  }, [authUser])

  useEffect(() => {
    if (!authUser?.userid) {
      setAvatarSelection(getDefaultAvatarSelection())
      setAvatarModalMode(null)
      setAskMoodOptions(DEFAULT_MOOD_OPTIONS)
      setAskMoodSelection(DEFAULT_MOOD_OPTIONS[0])
      setAskMoodHasHistory(false)
      return
    }

    setAvatarSelection(loadAvatarSelectionForUser(authUser.userid))
  }, [authUser?.userid])

  useEffect(() => {
    if (!authUser?.userid) {
      return
    }

    let isMounted = true

    async function fetchMoodOptions() {
      try {
        const response = await fetch(moodOptionsUrl, { credentials: 'include' })
        if (!response.ok) {
          return
        }

        const payload = (await response.json()) as { options?: string[]; has_history?: boolean }
        if (!isMounted) {
          return
        }

        const options = Array.isArray(payload.options)
          ? payload.options.map((item) => String(item).trim()).filter(Boolean)
          : []

        const resolvedOptions = options.length ? options : DEFAULT_MOOD_OPTIONS
        setAskMoodOptions(resolvedOptions)
        setAskMoodHasHistory(Boolean(payload.has_history))

        setAskMoodSelection((current) => {
          if (resolvedOptions.includes(current)) {
            return current
          }
          return resolvedOptions[0]
        })
      } catch {
        if (isMounted) {
          setAskMoodOptions(DEFAULT_MOOD_OPTIONS)
          setAskMoodSelection(DEFAULT_MOOD_OPTIONS[0])
        }
      }
    }

    void fetchMoodOptions()

    return () => {
      isMounted = false
    }
  }, [authUser?.userid, moodOptionsUrl])

  useEffect(() => {
    if (!authUser?.userid) {
      return
    }

    if (page !== 'dashboard') {
      return
    }

    const today = getTodayDayString()
    const moodPromptCompleted = hasCompletedMoodPromptToday(authUser.userid, today)
    const avatarSetupDone = isAvatarSetupDone(authUser.userid)

    if (moodPromptCompleted && !avatarSetupDone) {
      setAvatarModalMode((current) => current ?? 'onboarding')
    }
  }, [page, authUser?.userid])

  useEffect(() => {
    let isMounted = true

    async function syncSessionUser() {
      try {
        const response = await fetch(sessionUrl, { credentials: 'include' })

        if (!isMounted) {
          return
        }

        if (!response.ok) {
          setAuthUser(null)
          return
        }

        const parsed = await parseResponse(response)
        const userName = typeof parsed?.name === 'string' ? parsed.name : ''
        const userEmail = typeof parsed?.email === 'string' ? parsed.email : ''
        const userId = typeof parsed?.userid === 'number' ? parsed.userid : 0

        if (userId > 0 && userName && userEmail) {
          setAuthUser({ userid: userId, name: userName, email: userEmail })
          return
        }

        setAuthUser(null)
      } catch {
        if (isMounted) {
          setAuthUser(null)
        }
      }
    }

    void syncSessionUser()

    return () => {
      isMounted = false
    }
  }, [sessionUrl])

  useEffect(() => {
    const applyUrlState = () => {
      const fromHash = hashToPage(window.location.hash)
      const fallbackPage = authUser ? 'dashboard' : 'landing'
      const basePage = guardPage(fromHash ?? fallbackPage, Boolean(authUser))

      let guardedPage = basePage
      if (authUser?.userid && (basePage === 'dashboard' || basePage === 'activity' || basePage === 'profile')) {
        const today = getTodayDayString()
        if (!hasCompletedMoodPromptToday(authUser.userid, today)) {
          guardedPage = 'ask-mood'
        }
      }

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

  async function fetchWeekActivityData(userId: number) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const start = getStartOfWeekSunday(today)
    const labels = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
    const days = Array.from({ length: 7 }).map((_, index) => {
      const dateValue = new Date(start)
      dateValue.setDate(start.getDate() + index)
      const dayString = toDayString(dateValue)

      return {
        key: `${dayString}-${index}`,
        label: labels[index],
        date: dayString,
        hasActivity: false,
        hasWater: false,
        hasMood: false,
        isToday: dayString === toDayString(today),
      }
    })

    try {
      const results = await Promise.all(
        days.map(async (day) => {
          const request = new URL(summaryUrl)
          request.searchParams.set('userid', String(userId))
          request.searchParams.set('date', day.date)

          const response = await fetch(request.toString(), { credentials: 'include' })
          if (!response.ok) {
            return { date: day.date, hasActivity: false, hasWater: false, hasMood: false }
          }

          const payload = (await response.json()) as DailySummaryResponse
          const hasWater = payload.amount_logged > 0
          const hasMood = payload.moods_logged > 0
          return {
            date: day.date,
            hasActivity: hasWater || hasMood,
            hasWater,
            hasMood,
          }
        })
      )

      const map = new Map(results.map((item) => [item.date, item]))
      setWeekActivity(
        days.map((day) => {
          const activity = map.get(day.date)
          return {
            ...day,
            hasActivity: Boolean(activity?.hasActivity),
            hasWater: Boolean(activity?.hasWater),
            hasMood: Boolean(activity?.hasMood),
          }
        })
      )
    } catch {
      setWeekActivity(days)
    }
  }

  async function fetchDailyData() {
    if (!authUser?.userid) {
      setWaterSummary(null)
      setDailySummary(null)
      setMoodLogs([])
      setCommunityFeed([])
      setWeekActivity([])
      setWaterError('No logged-in user was found for hydration lookup.')
      return
    }

    const requestSummaryUrl = new URL(summaryUrl)
    requestSummaryUrl.searchParams.set('userid', String(authUser.userid))

    const requestMoodsUrl = new URL(moodsUrl)
    requestMoodsUrl.searchParams.set('userid', String(authUser.userid))

    try {
      setIsLoadingDailyData(true)
      setWaterError('')
      setMoodError('')
      setCommunityFeedError('')

      const response = await fetch(requestSummaryUrl.toString(), { credentials: 'include' })
      if (!response.ok) {
        throw new Error(`Unable to load summary data (${response.status}).`)
      }

      const summaryData = (await response.json()) as DailySummaryResponse
      applySummaryState(summaryData)
      await fetchWeekActivityData(authUser.userid)

      const moodsResponse = await fetch(requestMoodsUrl.toString(), { credentials: 'include' })
      if (moodsResponse.ok) {
        const moodsPayload = (await moodsResponse.json()) as { moods?: MoodLog[] }
        if (Array.isArray(moodsPayload.moods)) {
          setMoodLogs(moodsPayload.moods)
        }
      } else {
        setMoodError(`Unable to load moods (${moodsResponse.status}).`)
      }

      const communityResponse = await fetch(communityFeedUrl, { credentials: 'include' })
      if (communityResponse.ok) {
        const communityPayload = (await communityResponse.json()) as { entries?: CommunityFeedEntry[] }
        if (Array.isArray(communityPayload.entries)) {
          setCommunityFeed(communityPayload.entries)
        }
      } else {
        setCommunityFeedError(`Unable to load community feed (${communityResponse.status}).`)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load summary data.'
      setWaterSummary(null)
      setDailySummary(null)
      setMoodLogs([])
      setCommunityFeed([])
      setWeekActivity([])
      setWaterError(message)
    } finally {
      setIsLoadingDailyData(false)
    }
  }

  useEffect(() => {
    if (page !== 'dashboard' && page !== 'activity') {
      return
    }
    void fetchDailyData()
  }, [page, authUser?.userid])

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
        credentials: 'include',
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
        applySummaryState(payload.summary as DailySummaryResponse)
      } else {
        await fetchDailyData()
      }

      await fetchWeekActivityData(authUser.userid)

      setActivityMessage(`Logged ${parsedAmount} oz successfully.`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to log water right now.'
      setActivityError(message)
      setActivityMessage('')
    } finally {
      setIsLoggingWater(false)
    }
  }

  async function handleLogMood(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!authUser?.userid) {
      setActivityError('You must be logged in to log a mood.')
      return
    }

    const moodValue = moodInput.trim()
    if (!moodValue) {
      setActivityError('Select or enter a mood before logging.')
      return
    }

    try {
      setIsLoggingMood(true)
      setActivityError('')
      setActivityMessage('Logging mood...')

      const response = await fetch(logMoodUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          mood: moodValue,
          userid: authUser.userid,
        }),
      })

      const payload = await response.json()

      if (!response.ok) {
        const backendMessage =
          (payload && typeof payload.message === 'string' && payload.message) ||
          (payload && typeof payload.detail === 'string' && payload.detail) ||
          ''
        throw new Error(backendMessage || 'Unable to log mood right now.')
      }

      if (payload && typeof payload.summary === 'object' && payload.summary) {
        applySummaryState(payload.summary as DailySummaryResponse)
      } else {
        await fetchDailyData()
      }

      await fetchWeekActivityData(authUser.userid)

      setActivityMessage(`Logged mood: ${moodValue}.`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to log mood right now.'
      setActivityError(message)
      setActivityMessage('')
    } finally {
      setIsLoggingMood(false)
    }
  }

  function getPostLoginPage(userId: number): Page {
    const today = getTodayDayString()
    return hasCompletedMoodPromptToday(userId, today) ? 'dashboard' : 'ask-mood'
  }

  async function handleAskMoodContinue() {
    if (!authUser?.userid) {
      return
    }

    const selectedMood = isCustomAskMood ? askMoodCustomText.trim() : askMoodSelection.trim()
    if (!selectedMood) {
      setAskMoodError('Choose a mood or type one to continue.')
      return
    }

    try {
      setIsSubmittingAskMood(true)
      setAskMoodError('')

      const response = await fetch(logMoodUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          mood: selectedMood,
          userid: authUser.userid,
        }),
      })

      const payload = await response.json()
      if (!response.ok) {
        const backendMessage =
          (payload && typeof payload.message === 'string' && payload.message) ||
          (payload && typeof payload.detail === 'string' && payload.detail) ||
          ''
        throw new Error(backendMessage || 'Unable to save your mood right now.')
      }

      if (payload && typeof payload.summary === 'object' && payload.summary) {
        applySummaryState(payload.summary as DailySummaryResponse)
      }

      setAskMoodHasHistory(true)
      if (isCustomAskMood) {
        setAskMoodOptions((current) => {
          if (current.some((item) => item.toLowerCase() === selectedMood.toLowerCase())) {
            return current
          }
          return [...current, selectedMood]
        })
      }

      markMoodPromptCompletedToday(authUser.userid, getTodayDayString())
      setMoodInput(selectedMood)
      await fetchWeekActivityData(authUser.userid)
      navigateTo('dashboard', { replace: true, ignoreAuthGuard: true })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save your mood right now.'
      setAskMoodError(message)
    } finally {
      setIsSubmittingAskMood(false)
    }
  }

  function handleAvatarLayerChange(layer: AvatarLayerKey, value: string) {
    setAvatarSelection((current) => ({
      ...current,
      [layer]: value,
    }))
  }

  function handleOpenAvatarEditor() {
    setAvatarModalMode('editor')
  }

  function handleCloseAvatarModal() {
    if (avatarModalMode === 'onboarding' && authUser?.userid) {
      markAvatarSetupDone(authUser.userid)
    }

    setAvatarModalMode(null)
  }

  async function handleSaveAvatar() {
    if (!authUser?.userid) {
      setAvatarModalMode(null)
      return
    }

    saveAvatarSelectionForUser(authUser.userid, avatarSelection)
    try {
      const response = await fetch(avatarUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ avatar: avatarSelection }),
      })

      if (!response.ok) {
        throw new Error(`Unable to save avatar (${response.status}).`)
      }

      setStatusMessage('Avatar saved.')
      setIsErrorMessage(false)
      setAvatarModalMode(null)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save avatar.'
      setStatusMessage(message)
      setIsErrorMessage(true)
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
    void fetch(logoutUrl, {
      method: 'POST',
      credentials: 'include',
    })

    setAuthUser(null)
    setWaterSummary(null)
    setDailySummary(null)
    setWeekActivity([])
    setMoodLogs([])
    setWaterError('')
    setMoodError('')
    setActivityError('')
    setActivityMessage('')
    setAskMoodError('')
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
        credentials: 'include',
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
        credentials: 'include',
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
      navigateTo(getPostLoginPage(userId), { ignoreAuthGuard: true })
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
      <LandingPage
        logoNode={renderBloomLogo('nav')}
        heroImageVisible={heroImageVisible}
        landingHeroImageUrl={LANDING_HERO_IMAGE_URL}
        onHeroImageError={() => setHeroImageVisible(false)}
        onGoSignUp={() => goToPage('signup')}
        onGoLogin={() => goToPage('login')}
      />
    )
  }

  function renderBloomLogo(mode: 'nav' | 'auth') {
    return (
      <span className={`bloom-logo ${mode}`} aria-label="Bloom">
        Bloom
      </span>
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
            <button className="nav-dropdown-item" onClick={() => navigateTo('activity', { ignoreAuthGuard: true })}>
              Activity
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
          <AvatarPreview avatar={avatarSelection} className="avatar-preview-nav-head avatar-preview-headshot" />
        </button>

        {profileMenuOpen && (
          <div className="nav-dropdown profile-dropdown" role="menu" aria-label="Profile menu">
            <button className="nav-dropdown-item" onClick={() => navigateTo('profile', { ignoreAuthGuard: true })}>
              Profile
            </button>
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

  function renderDashboardNav(activePage: 'dashboard' | 'activity' | 'profile') {
    const longestStreak = getLongestActiveStreak(weekActivity)
    const streakTitle = `You're on a ${longestStreak}-day streak!`

    return (
      <header className="dashboard-nav">
        <div className="dashboard-nav-left">
          {renderHamburgerMenu()}
          {renderBloomLogo('nav')}
        </div>

        <div className="dashboard-nav-right">
          <div className="streak-badge" aria-label={streakTitle}>
            <span className="streak-flame" aria-hidden="true">
              <svg viewBox="0 0 24 24" role="img" focusable="false">
                <path d="M12.1 2.5c.5 2.4-.6 4.1-1.6 5.6-.9 1.4-1.7 2.6-1.2 4.2.2.9.8 1.7 1.7 2.1-.1-.6-.1-1.2.1-1.8.5-1.6 1.9-2.5 3.1-3.3 1.4-1 2.6-1.8 2.8-3.7 1.9 1.8 3 4.3 3 6.9 0 5-3.6 8.6-8.1 8.6S4 17.3 4 12.8c0-3 1.6-5.9 4.2-7.8-.5 1.7-.1 3.2 1 4.4.2-2.7 1.8-4.9 2.9-6.9z" />
              </svg>
            </span>
            <span className="streak-count" aria-hidden="true">{longestStreak}</span>
            <span className="streak-tooltip" role="tooltip">
              {streakTitle}
            </span>
          </div>
          {renderProfileMenu()}
        </div>
      </header>
    )
  }

  function renderPlantStagePanel() {
    const stage = waterSummary?.plant_stage ?? 0
    const plantImageUrl = PLANT_STAGE_IMAGE_URLS[stage] || ''

    return (
      <aside className="plant-panel">
        <h2>Your Plant</h2>
        <p className="plant-stage-text">
          Stage {stage}/4: <strong>{getPlantStageLabel(stage)}</strong>
        </p>

        <div className="plant-visual" aria-label={`Plant stage ${stage}`}>
          {plantImageUrl ? (
            <img className="plant-stage-image" src={plantImageUrl} alt="" aria-hidden="true" draggable={false} />
          ) : null}
        </div>
      </aside>
    )
  }

  function renderAskMood() {
    return (
      <AskMoodPage
        greetingName={authUser?.name ?? 'Bloom User'}
        moodOptions={askMoodOptions}
        isReturningUser={askMoodHasHistory}
        selectedMood={askMoodSelection}
        customMoodEnabled={isCustomAskMood}
        customMoodText={askMoodCustomText}
        isSubmitting={isSubmittingAskMood}
        errorMessage={askMoodError}
        onSelectMood={(mood) => {
          setIsCustomAskMood(false)
          setAskMoodSelection(mood)
        }}
        onToggleCustomMood={() => setIsCustomAskMood((current) => !current)}
        onCustomMoodTextChange={setAskMoodCustomText}
        onContinue={() => void handleAskMoodContinue()}
      />
    )
  }

  function renderAvatarModal() {
    if (!avatarModalMode) {
      return null
    }

    return (
      <AvatarEditorModal
        open={Boolean(avatarModalMode)}
        mode={avatarModalMode}
        avatar={avatarSelection}
        assets={AVATAR_ASSETS}
        onChange={handleAvatarLayerChange}
        onSave={handleSaveAvatar}
        onClose={handleCloseAvatarModal}
      />
    )
  }

  function renderDashboard() {
    const hydrationRatio = clampProgress(waterSummary?.percentage ?? 0)
    const pageStyle = getBackgroundStyle('--dashboard-background-image', DASHBOARD_BACKGROUND_IMAGE_URL)
    const greeting = getTimeOfDayGreeting()

    return (
      <>
        <DashboardPage
          pageStyle={pageStyle}
          navNode={renderDashboardNav('dashboard')}
          greetingText={greeting}
          greetingName={authUser?.name ?? 'Bloom User'}
          plantNode={renderPlantStagePanel()}
          weekActivity={weekActivity}
          summaryDate={dailySummary?.date ?? waterSummary?.date ?? ''}
          waterSummary={waterSummary}
          dailySummary={dailySummary}
          waterError={waterError}
          hydrationRatio={hydrationRatio}
          communityFeed={communityFeed}
          communityFeedError={communityFeedError}
        />
        {renderAvatarModal()}
      </>
    )
  }

  function renderActivity() {
    const hydrationPercentage = Math.round(clampProgress(waterSummary?.percentage ?? 0) * 100)
    const pageStyle = getBackgroundStyle('--dashboard-background-image', DASHBOARD_BACKGROUND_IMAGE_URL)
    const greeting = getTimeOfDayGreeting()

    return (
      <>
        <ActivityPage
          pageStyle={pageStyle}
          navNode={renderDashboardNav('activity')}
          greetingText={greeting}
          greetingName={authUser?.name ?? 'Bloom User'}
          plantNode={renderPlantStagePanel()}
          weekActivity={weekActivity}
          waterSummary={waterSummary}
          dailySummary={dailySummary}
          moodLogs={moodLogs}
          waterError={waterError}
          moodError={moodError}
          activityMessage={activityMessage}
          activityError={activityError}
          isLoggingWater={isLoggingWater}
          isLoggingMood={isLoggingMood}
          waterAmountInput={waterAmountInput}
          moodInput={moodInput}
          isLoadingDailyData={isLoadingDailyData}
          hydrationPercentage={hydrationPercentage}
          avatar={avatarSelection}
          onWaterAmountChange={setWaterAmountInput}
          onMoodChange={setMoodInput}
          onSubmitWater={handleLogWater}
          onSubmitMood={handleLogMood}
        />
        {renderAvatarModal()}
      </>
    )
  }

  function renderProfile() {
    const displayName = authUser?.name?.trim() || 'Bloom User'
    const username = getUserHandle(authUser?.email ?? '')
    const friendsCount = 0
    const longestStreak = getLongestActiveStreak(weekActivity)
    const bioText =
      'This is your profile space. In the next milestone, we can add custom bios and social features.'

    return (
      <>
        <ProfilePage
          navNode={renderDashboardNav('profile')}
          displayName={displayName}
          username={username}
          friendsCount={friendsCount}
          longestStreak={longestStreak}
          bioText={bioText}
          avatar={avatarSelection}
          onEditAvatar={handleOpenAvatarEditor}
        />
        {renderAvatarModal()}
      </>
    )
  }

  function renderSignup() {
    return (
      <SignupPage
        topBarNode={renderAuthTopBar('Create Account')}
        name={name}
        email={email}
        password={password}
        signupErrors={signupErrors}
        statusMessage={statusMessage}
        isErrorMessage={isErrorMessage}
        isSubmittingSignup={isSubmittingSignup}
        showPassword={showPassword}
        onNameChange={setName}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        onTogglePassword={() => setShowPassword((current) => !current)}
        onSubmit={handleSignup}
        onGoLogin={() => goToPage('login')}
      />
    )
  }

  function renderLogin() {
    return (
      <LoginPage
        topBarNode={renderAuthTopBar('Log In')}
        email={loginEmail}
        password={loginPassword}
        loginErrors={loginErrors}
        statusMessage={statusMessage}
        isErrorMessage={isErrorMessage}
        isSubmittingLogin={isSubmittingLogin}
        showPassword={showLoginPassword}
        onEmailChange={setLoginEmail}
        onPasswordChange={setLoginPassword}
        onTogglePassword={() => setShowLoginPassword((current) => !current)}
        onSubmit={handleLogin}
        onGoSignup={() => goToPage('signup')}
      />
    )
  }

  let pageContent = renderLanding()

  if (page === 'signup') {
    pageContent = renderSignup()
  } else if (page === 'login') {
    pageContent = renderLogin()
  } else if (page === 'dashboard') {
    pageContent = renderDashboard()
  } else if (page === 'activity') {
    pageContent = renderActivity()
  } else if (page === 'profile') {
    pageContent = renderProfile()
  } else if (page === 'ask-mood') {
    pageContent = renderAskMood()
  }

  return (
    <>
      <div className="bloom-global-logo" aria-hidden="true">
        <img className="bloom-global-logo-image" src={bloomLogo} alt="" draggable={false} />
      </div>
      {pageContent}
    </>
  )
}

export default App
