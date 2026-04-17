import { useMemo } from 'react'

type AskMoodPageProps = {
  greetingName: string
  moodOptions: string[]
  isReturningUser: boolean
  selectedMood: string
  customMoodEnabled: boolean
  customMoodText: string
  isSubmitting: boolean
  errorMessage: string
  onSelectMood: (mood: string) => void
  onToggleCustomMood: () => void
  onCustomMoodTextChange: (value: string) => void
  onContinue: () => void
}

const COPY_OPTIONS = [
  "Check in, your bloom will follow.",
  "Where you are is enough to grow from.",
  "A small pause can help your bloom grow.",
  "Take a moment, your bloom is still growing.",
]

export default function AskMoodPage({
  greetingName,
  moodOptions,
  isReturningUser,
  selectedMood,
  customMoodEnabled,
  customMoodText,
  isSubmitting,
  errorMessage,
  onSelectMood,
  onToggleCustomMood,
  onCustomMoodTextChange,
  onContinue,
}: AskMoodPageProps) {
  const randomCopy = useMemo(() => {
    return COPY_OPTIONS[Math.floor(Math.random() * COPY_OPTIONS.length)]
  }, [])
  return (
    <div className="ask-mood-page screen-fade-in">
      <section className="ask-mood-card" aria-labelledby="ask-mood-title">
        <div className="leaf-frame-strip" aria-hidden="true">
          <span className="leaf-frame frame-a">🍃</span>
          <span className="leaf-frame frame-b">🌿</span>
          <span className="leaf-frame frame-c">🍀</span>
        </div>

        <p className="ask-mood-intro">{isReturningUser ? `Welcome back, ${greetingName}` : `Welcome, ${greetingName}`}</p>
        <h1 id="ask-mood-title">How Are You Feeling Right Now?</h1>
        <p className="ask-mood-copy">{randomCopy}</p>

        <div className="mood-option-grid" role="list" aria-label="Mood options">
          {moodOptions.map((option) => {
            const isSelected = !customMoodEnabled && selectedMood === option
            return (
              <button
                key={option}
                type="button"
                className={`mood-option-btn ${isSelected ? 'is-selected' : ''}`}
                onClick={() => onSelectMood(option)}
                aria-pressed={isSelected}
              >
                <span>{option}</span>
              </button>
            )
          })}

          <button
            type="button"
            className={`mood-option-btn custom-toggle ${customMoodEnabled ? 'is-selected' : ''}`}
            onClick={() => onToggleCustomMood()}
            aria-label="Add custom mood"
          >
            <span className="mood-pencil" aria-hidden="true">
              ✎
            </span>
            <input
              type="text"
              autoFocus={customMoodEnabled}
              className="mood-expanding-input"
              value={customMoodText}
              onChange={(event) => onCustomMoodTextChange(event.target.value)}
              placeholder="Type mood"
              aria-label="Type custom mood"
            />
          </button>
        </div>

        {errorMessage && <p className="error-text ask-mood-error">{errorMessage}</p>}

        <button className="primary-action ask-mood-continue" type="button" onClick={onContinue} disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Continue To Dashboard'}
        </button>
      </section>
    </div>
  )
}
