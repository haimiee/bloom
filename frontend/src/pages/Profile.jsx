import './Profile.css'

function Profile({ user, onBack, onGoFriends }) {
  const name = user?.fullName || user?.email?.split('@')[0] || 'User'

  return (
    <main className="profile-page">
      <div className="profile-header">
        <div className="profile-header-left">
          <button className="profile-btn profile-back-btn" type="button" aria-label="Go back" onClick={onBack}>
            ←
          </button>
          <div className="profile-pfp" aria-label="profile image" role="img">PFP</div>
        </div>
        <h1>{name}</h1>
      </div>

      <div className="profile-box">
        <h2>Bio</h2>
        <p>Your bio goes here.</p>
      </div>

      <div className="profile-bottom-row">
        <div className="profile-box profile-link-box" role="button" tabIndex={0} onClick={onGoFriends} onKeyDown={(event) => (event.key === 'Enter' || event.key === ' ') && onGoFriends()}>
          <button className="profile-btn" type="button" onClick={onGoFriends}>Friends</button>
        </div>

        <div className="profile-box">
          <h2>Longest Streak</h2>
          <p>0 days</p>
        </div>
      </div>
    </main>
  )
}

export default Profile
