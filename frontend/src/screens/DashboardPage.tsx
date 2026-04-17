import { useEffect, useState, type CSSProperties, type FormEvent, type ReactNode } from 'react'
import waterBottleImage from '../../assets/images/logging/waterbottle.png'
import { getDefaultAvatarSelection, type AvatarSelection } from '../avatar'
import AvatarPreview from '../components/AvatarPreview'

type WaterSummary = {
  userid: number
  date: string
  amount_logged: number
  goal: number
  percentage: number
  plant_stage: number
  water_logs: Array<{ id: number; amount: number; created_at: string }>
} | null

type MoodLog = {
  id: number
  mood: string
  created_at: string
}

type DailySummary = {
  userid: number
  date: string
  goal: number
  amount_logged: number
  percentage: number
  plant_stage: number
  water_logs: Array<{ id: number; amount: number; created_at: string }>
  moods_logged: number
  moods: MoodLog[]
} | null

type WeekActivityDay = {
  key: string
  label: string
  date: string
  hasActivity: boolean
  hasWater: boolean
  hasMood: boolean
  isToday: boolean
}

type CommunityFeedEntry = {
  userid: number
  name: string
  activity_type: 'water' | 'mood'
  summary: string
  created_at: string
  avatar?: AvatarSelection | null
}

type DashboardPageProps = {
  pageStyle?: CSSProperties
  navNode: ReactNode
  greetingText: string
  greetingName: string
  plantNode: ReactNode
  weekActivity: WeekActivityDay[]
  summaryDate: string
  waterSummary: WaterSummary
  dailySummary: DailySummary
  waterError: string
  hydrationRatio: number
  communityFeed: CommunityFeedEntry[]
  communityFeedError: string
}

function ProgressBar({ label, percentage, variant }: { label: string; percentage: number; variant: 'blue' | 'green' | 'gold' }) {
  const segmentCount = 12
  const filledSegments = Math.round(Math.max(0, Math.min(1, percentage)) * segmentCount)

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

function formatSummaryHeader(dateValue: string) {
  const basis = dateValue ? new Date(`${dateValue}T00:00:00`) : new Date()
  return basis.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatFeedTimeAgo(timestamp: string) {
  const loggedAt = new Date(timestamp).getTime()
  if (!Number.isFinite(loggedAt)) {
    return 'just now'
  }

  const diffMs = Math.max(0, Date.now() - loggedAt)
  const diffMinutes = Math.floor(diffMs / 60000)

  if (diffMinutes < 1) {
    return 'just now'
  }

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`
  }

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) {
    return `${diffHours}h ago`
  }

  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}d ago`
}

function toDayString(dateValue: Date) {
  const year = dateValue.getFullYear()
  const month = String(dateValue.getMonth() + 1).padStart(2, '0')
  const day = String(dateValue.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getCalendarCells(dateValue: string, weekActivity: WeekActivityDay[]) {
  const basis = dateValue ? new Date(`${dateValue}T00:00:00`) : new Date()
  const year = basis.getFullYear()
  const month = basis.getMonth()
  const firstDayOfMonth = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = toDayString(new Date())
  const activityMap = new Map(weekActivity.map((day) => [day.date, day]))

  return Array.from({ length: firstDayOfMonth + daysInMonth }).map((_, index) => {
    if (index < firstDayOfMonth) {
      return {
        key: `blank-${index}`,
        label: '',
        hasWater: false,
        hasMood: false,
        isToday: false,
        isBlank: true,
      }
    }

    const dayNumber = index - firstDayOfMonth + 1
    const dayDate = new Date(year, month, dayNumber)
    const dayKey = toDayString(dayDate)
    const activity = activityMap.get(dayKey)

    return {
      key: dayKey,
      label: String(dayNumber),
      hasWater: Boolean(activity?.hasWater),
      hasMood: Boolean(activity?.hasMood),
      isToday: dayKey === today,
      isBlank: false,
    }
  })
}

export function DashboardPage({
  pageStyle,
  navNode,
  greetingText,
  greetingName,
  plantNode,
  weekActivity,
  summaryDate,
  waterSummary,
  dailySummary,
  waterError,
  hydrationRatio,
  communityFeed,
  communityFeedError,
}: DashboardPageProps) {
  return (
    <div className="dashboard-page screen-fade-in" style={pageStyle}>
      {navNode}

      <main className="dashboard-main">
        <section className="greeting-banner">
          <h1>{greetingText}, {greetingName}!</h1>
          <p>Small daily actions build long-term wellness. Your progress is updated from your latest logs.</p>
        </section>

        <section className="week-summary-box" aria-label="Weekly activity summary">
          <h2>This Week</h2>
          <div className="week-circle-row">
            {weekActivity.map((day) => (
              <div key={day.key} className={`week-day-circle ${day.hasActivity ? 'is-active' : ''} ${day.isToday ? 'is-today' : ''}`}>
                {day.label}
              </div>
            ))}
          </div>
          <p>{weekActivity.filter((day) => day.hasActivity).length} active day(s) so far this week</p>
        </section>

        {plantNode}

        <div className="dashboard-content">
          <section className="dashboard-grid">
            <article className="calendar-card">
              <h2>{formatSummaryHeader(summaryDate)}</h2>
              <p>Daily summary synced from backend.</p>
              <div className="calendar-placeholder" aria-label="Monthly activity calendar">
                {getCalendarCells(summaryDate, weekActivity).map((cell) => (
                  <div key={cell.key} className={`calendar-day ${cell.isBlank ? 'is-blank' : ''} ${cell.isToday ? 'is-today' : ''}`}>
                    {!cell.isBlank && (
                      <>
                        <span className="calendar-day-number">{cell.label}</span>
                        <span className="calendar-day-dots" aria-hidden="true">
                          {cell.hasWater && <span className="calendar-dot water-dot" />}
                          {cell.hasMood && <span className="calendar-dot mood-dot" />}
                        </span>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </article>

            <article className="tasks-card">
              <h2>Today&apos;s Snapshot</h2>
              <ul>
                <li>Plant stage: {dailySummary?.plant_stage ?? waterSummary?.plant_stage ?? 0}/5</li>
                <li>Moods logged: {dailySummary?.moods_logged ?? dailySummary?.moods?.length ?? 0}</li>
                <li>Water entries: {waterSummary?.water_logs.length ?? 0}</li>
              </ul>
            </article>

            <article className="friends-card">
              <h2>The Bloom Community</h2>
              {communityFeedError ? (
                <p>{communityFeedError}</p>
              ) : communityFeed.length ? (
                <ul className="friend-feed-list">
                  {communityFeed.map((entry) => (
                    <li key={`${entry.userid}-${entry.created_at}`} className="friend-feed-item">
                      <div className="friend-avatar" aria-hidden="true">
                        <AvatarPreview
                          avatar={entry.avatar ?? getDefaultAvatarSelection()}
                          className="avatar-preview-friend-head avatar-preview-headshot"
                        />
                      </div>
                      <div>
                        <p className="friend-name">{entry.name}</p>
                        <p className="friend-note">{entry.summary}</p>
                      </div>
                      <span className="friend-time">{formatFeedTimeAgo(entry.created_at)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No community activity yet.</p>
              )}
            </article>
          </section>

          <section className="progress-stack">
            <ProgressBar label="Hydration Progress" percentage={hydrationRatio} variant="blue" />
          </section>

          <section className="dashboard-actions">
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

type ActivityPageProps = {
  pageStyle?: CSSProperties
  navNode: ReactNode
  greetingText: string
  greetingName: string
  plantNode: ReactNode
  weekActivity: WeekActivityDay[]
  waterSummary: WaterSummary
  dailySummary: DailySummary
  moodLogs: MoodLog[]
  waterError: string
  moodError: string
  activityMessage: string
  activityError: string
  isLoggingWater: boolean
  isLoggingMood: boolean
  waterAmountInput: string
  moodInput: string
  isLoadingDailyData: boolean
  hydrationPercentage: number
  avatar: AvatarSelection
  onWaterAmountChange: (value: string) => void
  onMoodChange: (value: string) => void
  onSubmitWater: (event: FormEvent<HTMLFormElement>) => void
  onSubmitMood: (event: FormEvent<HTMLFormElement>) => void
}

function formatTimeAgo(timestamp: string) {
  const logTime = new Date(timestamp).getTime()
  if (!Number.isFinite(logTime)) {
    return 'logged just now'
  }

  const diffMs = Math.max(0, Date.now() - logTime)
  const diffMinutes = Math.floor(diffMs / 60000)

  if (diffMinutes < 1) {
    return 'logged just now'
  }

  if (diffMinutes < 60) {
    return `logged ${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`
  }

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) {
    return `logged ${diffHours} hour${diffHours === 1 ? '' : 's'} ago`
  }

  const diffDays = Math.floor(diffHours / 24)
  return `logged ${diffDays} day${diffDays === 1 ? '' : 's'} ago`
}

export function ActivityPage({
  pageStyle,
  navNode,
  greetingText,
  greetingName,
  plantNode,
  weekActivity,
  waterSummary,
  dailySummary,
  moodLogs,
  waterError,
  moodError,
  activityMessage,
  activityError,
  isLoggingWater,
  isLoggingMood,
  waterAmountInput,
  moodInput,
  isLoadingDailyData,
  hydrationPercentage,
  avatar,
  onWaterAmountChange,
  onMoodChange,
  onSubmitWater,
  onSubmitMood,
}: ActivityPageProps) {
  const [playSipAnimation, setPlaySipAnimation] = useState(false)
  const waterLogs = waterSummary?.water_logs ?? []
  const recentLog = waterLogs.length ? waterLogs[waterLogs.length - 1] : null
  const olderLogs = waterLogs.length > 1 ? waterLogs.slice(0, -1).reverse() : []

  useEffect(() => {
    if (!isLoggingWater) {
      return
    }

    setPlaySipAnimation(false)

    const frameId = window.requestAnimationFrame(() => {
      setPlaySipAnimation(true)
    })

    const resetId = window.setTimeout(() => {
      setPlaySipAnimation(false)
    }, 760)

    return () => {
      window.cancelAnimationFrame(frameId)
      window.clearTimeout(resetId)
    }
  }, [isLoggingWater])

  function adjustWaterAmount(delta: number) {
    const currentAmount = Number.parseInt(waterAmountInput, 10)
    const safeCurrent = Number.isFinite(currentAmount) ? currentAmount : 8
    const nextAmount = Math.max(1, safeCurrent + delta)
    onWaterAmountChange(String(nextAmount))
  }

  return (
    <div className="dashboard-page screen-fade-in" style={pageStyle}>
      {navNode}

      <main className="activity-main">
        <section className="greeting-banner">
          <h1>{greetingText}, {greetingName}!</h1>
        </section>

        <section className="week-summary-box" aria-label="Weekly activity summary">
          <h2>This Week</h2>
          <div className="week-circle-row">
            {weekActivity.map((day) => (
              <div key={day.key} className={`week-day-circle ${day.hasActivity ? 'is-active' : ''} ${day.isToday ? 'is-today' : ''}`}>
                {day.label}
              </div>
            ))}
          </div>
          <p>{weekActivity.filter((day) => day.hasActivity).length} active day(s) so far this week</p>
        </section>

        {plantNode}

        <div className="activity-content">
          <section className="activity-card">
            <h1>Activity Logging</h1>

            <form className="hydration-playground" onSubmit={onSubmitWater}>
              <div className={`hydration-avatar-wrap ${playSipAnimation ? 'is-sipping' : ''}`}>
                <AvatarPreview avatar={avatar} className="avatar-preview-hydration" />
              </div>

              <div className="hydration-controls">
                <label htmlFor="water-amount">Amount (oz)</label>
                <div className="hydration-stepper">
                  <button type="button" className="stepper-btn" onClick={() => adjustWaterAmount(-1)} aria-label="Decrease water amount">
                    -
                  </button>
                  <input
                    id="water-amount"
                    type="number"
                    min={1}
                    step={1}
                    value={waterAmountInput}
                    onChange={(event) => onWaterAmountChange(event.target.value)}
                  />
                  <button type="button" className="stepper-btn" onClick={() => adjustWaterAmount(1)} aria-label="Increase water amount">
                    +
                  </button>
                </div>

                <button className={`water-bottle-btn ${playSipAnimation ? 'is-pouring' : ''}`} type="submit" disabled={isLoggingWater}>
                  <img src={waterBottleImage} alt="Water bottle" draggable={false} />
                  <span>{isLoggingWater ? 'Logging...' : 'Drink + Log Water'}</span>
                </button>
              </div>
            </form>

            <form className="activity-form mood-form" onSubmit={onSubmitMood}>
              <label htmlFor="mood-select">Mood</label>
              <select id="mood-select" value={moodInput} onChange={(event) => onMoodChange(event.target.value)}>
                <option value="Calm">Calm</option>
                <option value="Happy">Happy</option>
                <option value="Focused">Focused</option>
                <option value="Tired">Tired</option>
                <option value="Stressed">Stressed</option>
              </select>
              <button className="primary-action" type="submit" disabled={isLoggingMood}>
                {isLoggingMood ? 'Saving...' : 'Log Mood'}
              </button>
            </form>

            {isLoadingDailyData && <p>Updating today&apos;s summary...</p>}

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
                {moodError ? (
                  <p>{moodError}</p>
                ) : moodLogs.length ? (
                  <ul>
                    {moodLogs.slice(0, 3).map((mood) => (
                      <li key={mood.id}>
                        <strong>{mood.mood}</strong>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No moods logged today yet.</p>
                )}
              </article>
            </div>

            <div className="water-log-list">
              <h3>Water Entries</h3>
              {recentLog ? (
                <div className="water-log-recent" tabIndex={0}>
                  <p>
                    Recent: <strong>{recentLog.amount} oz</strong> <span>{formatTimeAgo(recentLog.created_at)}</span>
                  </p>

                  {olderLogs.length > 0 && (
                    <div className="water-log-hover-list" role="tooltip">
                      <h4>Earlier Today</h4>
                      <ul>
                        {olderLogs.map((log) => (
                          <li key={log.id}>
                            <span>{log.amount} oz</span>
                            <span>{formatTimeAgo(log.created_at)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
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