type FriendsPageProps = {
  onBack: () => void
}

export default function FriendsPage({ onBack }: FriendsPageProps) {
  return (
    <main>
      <div>
        <button type="button" onClick={onBack} aria-label="Go back">
          ←
        </button>
        <h1>Friends</h1>
      </div>

      <div>
        <p>This is the Friends page.</p>
      </div>
    </main>
  )
}