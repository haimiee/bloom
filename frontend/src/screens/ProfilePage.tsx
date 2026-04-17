import type { ReactNode } from 'react'
import type { AvatarSelection } from '../avatar'
import AvatarPreview from '../components/AvatarPreview'

type ProfilePageProps = {
  navNode: ReactNode
  displayName: string
  username: string
  friendsCount: number
  longestStreak: number
  bioText: string
  bioIsDefault: boolean
  avatar: AvatarSelection
  onEditAvatar: () => void
  onEditBio: () => void
}

export default function ProfilePage({
  navNode,
  displayName,
  username,
  friendsCount,
  longestStreak,
  bioText,
  bioIsDefault,
  avatar,
  onEditAvatar,
  onEditBio,
}: ProfilePageProps) {
  return (
    <div className="dashboard-page screen-fade-in profile-page-root">
      {navNode}

      <main className="profile-main">
        <section className="profile-banner" aria-label="Profile banner">
          <h1>{displayName}</h1>
          <p>{username}</p>
          <div className="profile-status-bubble" aria-hidden="true">
            <span>+</span>
          </div>
        </section>

        <section className="profile-stats-row" aria-label="Profile statistics">
          <article className="profile-stat-box">
            <h2>Friends</h2>
            <p>{friendsCount}</p>
          </article>

          <article className="profile-stat-box wide">
            <h2>Longest Streak</h2>
            <p>{longestStreak}</p>
          </article>
        </section>

        <section className="profile-avatar-panel" aria-label="Avatar panel">
          <div className="profile-panel-header">
            <h2>Your Avatar</h2>
          </div>
          <div className="profile-avatar-thumbnail">
            <AvatarPreview avatar={avatar} className="avatar-preview-profile-thumb" />
            <button type="button" className="profile-edit-btn floating" onClick={onEditAvatar} aria-label="Edit avatar">
              ✎
            </button>
          </div>
        </section>

        <section className="profile-bio-panel" aria-label="Bio panel">
          <div className="profile-panel-header">
            <h2>Bio</h2>
          </div>
          <div className="profile-bio-box">
            <p className={bioIsDefault ? 'profile-bio-text is-default' : 'profile-bio-text'}>{bioText}</p>
            <button type="button" className="profile-edit-btn floating" onClick={onEditBio} aria-label="Edit bio">
              ✎
            </button>
          </div>
        </section>
      </main>
    </div>
  )
}
