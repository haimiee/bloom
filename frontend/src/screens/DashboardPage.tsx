import { useEffect, useState, type ChangeEvent, type CSSProperties, type FormEvent, type ReactNode } from 'react'

type WaterSummary = {
  amount_logged: number
  goal: number
  plant_stage: number
  water_logs: Array<{ id: number; amount: number; created_at: string }>
} | null

type MoodLog = {
  id: number
  mood: string
  text: string | null
  created_at: string
}

type SummaryData = {
  userid: number
  date: string
  goal: number
  amount_logged: number
  percentage: number
  plant_stage: number
  water_logs: Array<{ id: number; amount: number; created_at: string }>
  moods_logged: number
  moods: MoodLog[]
}

const moodOptions = [
  { value: '😊 Happy', label: '😊 Happy' },
  { value: '😌 Calm', label: '😌 Calm' },
  { value: '😴 Tired', label: '😴 Tired' },
  { value: '😟 Anxious', label: '😟 Anxious' },
  { value: '💪 Energized', label: '💪 Energized' },
]

type DashboardPageProps = {
  pageStyle?: CSSProperties
  navNode: ReactNode
  greetingName: string
  plantNode: ReactNode
  selectedWaterDate: string
  waterSummary: WaterSummary
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

function formatMonthHeader(dateValue: string) {
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
  selectedWaterDate,
  waterSummary,
  waterError,
  hydrationRatio,
  moodRatio,
  onGoActivity,
}: DashboardPageProps) {
  return (
    <div className="dashboard-page" style={pageStyle}>
      {navNode}

      <main className="dashboard-main">
        <section className="greeting-banner">
          <h1>Good Morning, {greetingName}!</h1>
          <p>Small daily actions build long-term wellness. Your progress is updated from your latest logs.</p>
        </section>

        {plantNode}

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
  selectedWaterDate: string
  waterSummary: WaterSummary
  summaryData: SummaryData | null
  moodEntry: string
  moodLogs: MoodLog[]
  moodMessage: string
  moodError: string
  waterError: string
  activityMessage: string
  activityError: string
  isLoggingWater: boolean
  isLoggingMood: boolean
  waterAmountInput: string
  isLoadingWater: boolean
  hydrationPercentage: number
  onWaterAmountChange: (value: string) => void
  onMoodChange: (value: string) => void
  onSubmitWater: (event: FormEvent<HTMLFormElement>) => void
  onSubmitMood: (event: FormEvent<HTMLFormElement>) => void
  onRefreshWater: () => void
  onSelectedDateChange: (value: string) => void
}

export function ActivityPage({
  pageStyle,
  navNode,
  greetingName,
  plantNode,
  selectedWaterDate,
  waterSummary,
  waterError,
  summaryData,
  moodEntry,
  moodLogs,
  moodMessage,
  moodError,
  activityMessage,
  activityError,
  isLoggingWater,
  isLoggingMood,
  waterAmountInput,
  isLoadingWater,
  hydrationPercentage,
  onWaterAmountChange,
  onMoodChange,
  onSubmitWater,
  onSubmitMood,
  onRefreshWater,
  onSelectedDateChange,
}: ActivityPageProps) {
  const [selectedMoodOption, setSelectedMoodOption] = useState<string>(
    moodOptions.some((option) => option.value === moodEntry) ? moodEntry : moodEntry ? 'custom' : ''
  )
  const [customMoodText, setCustomMoodText] = useState<string>(
    moodOptions.some((option) => option.value === moodEntry) ? '' : moodEntry
  )

  useEffect(() => {
    if (moodOptions.some((option) => option.value === moodEntry)) {
      setSelectedMoodOption(moodEntry)
      setCustomMoodText('')
      return
    }

    if (moodEntry) {
      setSelectedMoodOption('custom')
      setCustomMoodText(moodEntry)
      return
    }

    setSelectedMoodOption('')
    setCustomMoodText('')
  }, [moodEntry])

  function handleMoodSelect(event: React.ChangeEvent<HTMLSelectElement>) {
    const value = event.target.value
    setSelectedMoodOption(value)

    if (value === 'custom') {
      setCustomMoodText('')
      onMoodChange('')
      return
    }

    setCustomMoodText('')
    onMoodChange(value)
  }

  function handleCustomMoodChange(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.target.value
    setCustomMoodText(input)
    onMoodChange(input)
  }

  return (
    <div className="dashboard-page" style={pageStyle}>
      {navNode}

      <main className="activity-main">
        <section className="greeting-banner">
          <h1>Good Morning, {greetingName}!</h1>
          <p>Track your activity and water, then watch your plant react as you progress.</p>
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

            <form className="activity-form" onSubmit={onSubmitMood}>
              <label htmlFor="mood-choice">Select your mood</label>
              <select id="mood-choice" value={selectedMoodOption} onChange={handleMoodSelect}>
                <option value="">Choose a mood</option>
                {moodOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
                <option value="custom">Create new mood</option>
              </select>

              {selectedMoodOption === 'custom' && (
                <label htmlFor="custom-mood">Describe your mood</label>
              )}

              {selectedMoodOption === 'custom' ? (
                <input
                  id="custom-mood"
                  type="text"
                  value={customMoodText}
                  onChange={handleCustomMoodChange}
                  placeholder="Type your custom mood"
                />
              ) : null}

              <button className="secondary-action" type="submit" disabled={isLoggingMood}>
                {isLoggingMood ? 'Saving...' : 'Log Mood'}
              </button>
            </form>

            {activityMessage && <p className="success-text">{activityMessage}</p>}
            {activityError && <p className="error-text">{activityError}</p>}
            {moodMessage && <p className="success-text">{moodMessage}</p>}
            {moodError && <p className="error-text">{moodError}</p>}

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
                {moodLogs.length ? (
                  <ul>
                    {moodLogs.map((log) => (
                      <li key={log.id}>
                        <span>{log.mood}</span>
                        <span>{new Date(log.created_at).toLocaleTimeString()}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No mood entries for this date yet.</p>
                )}
              </article>
              <article>
                <h3>Daily Summary</h3>
                {summaryData ? (
                  <>
                    <p>
                      Plant Stage: <strong>{summaryData.plant_stage}</strong>
                    </p>
                    <p>
                      Hydration: {summaryData.amount_logged} / {summaryData.goal} oz
                    </p>
                    <p>Mood entries: {summaryData.moods.length}</p>
                    <ProgressBar label="Hydration" percentage={summaryData.percentage} variant="blue" />
                    <ProgressBar
                      label="Mood Activity"
                      percentage={Math.min(1, summaryData.moods.length / 3)}
                      variant="green"
                    />
                    <ProgressBar
                      label="Consistency Score"
                      percentage={(summaryData.percentage + Math.min(1, summaryData.moods.length / 3)) / 2}
                      variant="gold"
                    />
                  </>
                ) : (
                  <p>No summary available yet.</p>
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