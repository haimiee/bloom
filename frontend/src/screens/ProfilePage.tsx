type ProfilePageProps = {
  name: string
  onBack: () => void
  onGoFriends: () => void
}

export default function ProfilePage({ name, onBack, onGoFriends }: ProfilePageProps) {
  return (
    <main>
      <div>
        <div>
          <button type="button" aria-label="Go back" onClick={onBack}>
            ←
          </button>
          <div aria-label="profile image" role="img">
            PFP
          </div>
        </div>
        <h1>{name}</h1>
      </div>

      <div>
        <h2>Bio</h2>
        <p>Your bio goes here.</p>
      </div>

      <div>
        <div role="button" tabIndex={0} onClick={onGoFriends} onKeyDown={(event) => (event.key === 'Enter' || event.key === ' ') && onGoFriends()}>
          <button type="button" onClick={onGoFriends}>
            Friends
          </button>
        </div>

        <div>
          <h2>Longest Streak</h2>
          <p>0 days</p>
        </div>
      </div>
    </main>
  )
}