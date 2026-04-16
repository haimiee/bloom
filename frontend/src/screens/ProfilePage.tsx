import { useRef, type ReactNode } from 'react'
import type { AvatarSelection } from '../avatar'
import AvatarPreview from '../components/AvatarPreview'

type ProfilePageProps = {
  navNode: ReactNode
  displayName: string
  username: string
  friendsCount: number
  longestStreak: number
  bioText: string
  avatar: AvatarSelection
  profilePhotoUrl: string | null
  onEditAvatar: () => void
  onUploadProfilePhoto: (file: File) => void
}

export default function ProfilePage({
  navNode,
  displayName,
  username,
  friendsCount,
  longestStreak,
  bioText,
  avatar,
  profilePhotoUrl,
  onEditAvatar,
  onUploadProfilePhoto,
}: ProfilePageProps) {
  const profilePhotoInputRef = useRef<HTMLInputElement | null>(null)

  function triggerProfilePhotoPicker() {
    profilePhotoInputRef.current?.click()
  }

  function handleProfilePhotoFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (file) {
      onUploadProfilePhoto(file)
    }
    event.target.value = ''
  }

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

        <section className="profile-photo-card" aria-label="Profile photo">
          <button
            type="button"
            className="profile-edit-btn floating-top-left"
            onClick={triggerProfilePhotoPicker}
            aria-label="Change profile photo"
          >
            ✎
          </button>

          <input
            ref={profilePhotoInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="profile-photo-input"
            onChange={handleProfilePhotoFileChange}
          />

          {profilePhotoUrl ? (
            <img src={profilePhotoUrl} alt="Your profile" className="profile-photo-image" />
          ) : (
            <div className="profile-kawaii-face profile-kawaii-face-large" aria-hidden="true">
              <span className="profile-kawaii-eye left" />
              <span className="profile-kawaii-eye right" />
              <span className="profile-kawaii-mouth" />
            </div>
          )}
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
            <p>{bioText}</p>
            <button type="button" className="profile-edit-btn floating" aria-label="Edit bio" disabled>
              ✎
            </button>
          </div>
        </section>
      </main>
    </div>
  )
}
