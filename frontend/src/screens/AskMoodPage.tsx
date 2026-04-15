type MoodOption = {
  label: string
  emoji: string
}

type AskMoodPageProps = {
  greetingName: string
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

const MOOD_OPTIONS: MoodOption[] = [
  { label: 'Happy', emoji: '😊' },
  { label: 'Calm', emoji: '😌' },
  { label: 'Focused', emoji: '🧠' },
  { label: 'Excited', emoji: '🤩' },
  { label: 'Tired', emoji: '😴' },
  { label: 'Stressed', emoji: '😓' },
]

export default function AskMoodPage({
  greetingName,
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
  return (
    <div className="ask-mood-page screen-fade-in">
      <section className="ask-mood-card" aria-labelledby="ask-mood-title">
        <div className="leaf-frame-strip" aria-hidden="true">
          <span className="leaf-frame frame-a">🍃</span>
          <span className="leaf-frame frame-b">🌿</span>
          <span className="leaf-frame frame-c">🍀</span>
        </div>

        <p className="ask-mood-intro">Welcome back, {greetingName}</p>
        <h1 id="ask-mood-title">How Are You Feeling Right Now?</h1>
        <p className="ask-mood-copy">Pick one mood to start today&apos;s summary. You can always log more later.</p>

        <div className="mood-option-grid" role="list" aria-label="Mood options">
          {MOOD_OPTIONS.map((option) => {
            const isSelected = !customMoodEnabled && selectedMood === option.label
            return (
              <button
                key={option.label}
                type="button"
                className={`mood-option-btn ${isSelected ? 'is-selected' : ''}`}
                onClick={() => onSelectMood(option.label)}
                aria-pressed={isSelected}
              >
                <span className="mood-emoji" aria-hidden="true">
                  {option.emoji}
                </span>
                <span>{option.label}</span>
              </button>
            )
          })}

          <button
            type="button"
            className={`mood-option-btn custom-toggle ${customMoodEnabled ? 'is-selected' : ''}`}
            onClick={onToggleCustomMood}
            aria-pressed={customMoodEnabled}
          >
            <span className="mood-emoji" aria-hidden="true">
              ✏️
            </span>
            <span>Type My Mood</span>
          </button>
        </div>

        {customMoodEnabled && (
          <div className="custom-mood-wrap">
            <label htmlFor="custom-mood-input">Custom Mood</label>
            <input
              id="custom-mood-input"
              type="text"
              value={customMoodText}
              onChange={(event) => onCustomMoodTextChange(event.target.value)}
              placeholder="Write your mood"
            />
          </div>
        )}

        {errorMessage && <p className="error-text ask-mood-error">{errorMessage}</p>}

        <button className="primary-action ask-mood-continue" type="button" onClick={onContinue} disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Continue To Dashboard'}
        </button>
      </section>
    </div>
  )
}
