import './Friends.css'

function Friends({ onBack }) {
  return (
    <main className="friends-page">
      <div className="friends-header">
        <button className="friends-btn" type="button" onClick={onBack} aria-label="Go back">
          ←
        </button>
        <h1>Friends</h1>
      </div>

      <div className="friends-box">
        <p>This is the Friends page.</p>
      </div>
    </main>
  )
}

export default Friends
