import type { CSSProperties, FormEvent, ReactNode } from 'react'

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
  hasActivity: boolean
  isToday: boolean
}

type DashboardPageProps = {
  pageStyle?: CSSProperties
  navNode: ReactNode
  greetingName: string
  plantNode: ReactNode
  weekActivity: WeekActivityDay[]
  summaryDate: string
  waterSummary: WaterSummary
  dailySummary: DailySummary
  waterError: string
  hydrationRatio: number
  moodRatio: number
  onGoActivity: () => void
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

export function DashboardPage({
  pageStyle,
  navNode,
  greetingName,
  plantNode,
  weekActivity,
  summaryDate,
  waterSummary,
  dailySummary,
  waterError,
  hydrationRatio,
  moodRatio,
  onGoActivity,
}: DashboardPageProps) {
  return (
    <div className="dashboard-page screen-fade-in" style={pageStyle}>
      {navNode}

      <main className="dashboard-main">
        <section className="greeting-banner">
          <h1>Good Morning, {greetingName}!</h1>
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
              <div className="calendar-placeholder" aria-hidden="true">
                {Array.from({ length: 35 }).map((_, index) => (
                  <span key={index}>{index + 1 <= 31 ? index + 1 : ''}</span>
                ))}
              </div>
            </article>

            <article className="tasks-card">
              <h2>Today&apos;s Snapshot</h2>
              <ul>
                <li>Plant stage: {dailySummary?.plant_stage ?? waterSummary?.plant_stage ?? 0}/4</li>
                <li>Moods logged: {dailySummary?.moods_logged ?? dailySummary?.moods?.length ?? 0}</li>
                <li>Water entries: {waterSummary?.water_logs.length ?? 0}</li>
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
            <ProgressBar label="Hydration Progress" percentage={hydrationRatio} variant="blue" />
            <ProgressBar label="Activity Progress" percentage={moodRatio} variant="green" />
            <ProgressBar label="Consistency Score" percentage={(hydrationRatio + moodRatio) / 2} variant="gold" />
          </section>

          <section className="dashboard-actions">
            <button className="join-btn" onClick={onGoActivity}>
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

type ActivityPageProps = {
  pageStyle?: CSSProperties
  navNode: ReactNode
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
  onWaterAmountChange: (value: string) => void
  onMoodChange: (value: string) => void
  onSubmitWater: (event: FormEvent<HTMLFormElement>) => void
  onSubmitMood: (event: FormEvent<HTMLFormElement>) => void
}

export function ActivityPage({
  pageStyle,
  navNode,
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
  onWaterAmountChange,
  onMoodChange,
  onSubmitWater,
  onSubmitMood,
}: ActivityPageProps) {
  return (
    <div className="dashboard-page screen-fade-in" style={pageStyle}>
      {navNode}

      <main className="activity-main">
        <section className="greeting-banner">
          <h1>Good Morning, {greetingName}!</h1>
          <p>Track your activity and water, then watch your plant react as you progress.</p>
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
            <p>Log what you do now. Calendar interactions and extra activities can be layered in next.</p>

            <form className="activity-form" onSubmit={onSubmitWater}>
              <label htmlFor="water-amount">Water Amount (oz)</label>
              <input
                id="water-amount"
                type="number"
                min={1}
                step={1}
                value={waterAmountInput}
                onChange={(event) => onWaterAmountChange(event.target.value)}
              />
              <button className="primary-action" type="submit" disabled={isLoggingWater}>
                {isLoggingWater ? 'Saving...' : 'Log Water'}
              </button>
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