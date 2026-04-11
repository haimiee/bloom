import { useState } from 'react'
import './Dashboard.css'

function Dashboard({ user, onGoProfile, onGoFriends, onSignOut }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <main className={`dashboard-layout ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-title">Dashboard</div>
        </div>
        <nav className="sidebar-nav sidebar-nav-top">
          <button className="nav-item nav-item-active" type="button">{isSidebarOpen ? 'Dashboard' : 'D'}</button>
          <button className="nav-item" type="button" onClick={onGoFriends}>{isSidebarOpen ? 'Friends' : 'F'}</button>
        </nav>
        <nav className="sidebar-nav sidebar-nav-bottom">
          <button className="nav-item" type="button" onClick={onSignOut}>{isSidebarOpen ? 'Logout' : 'L'}</button>
        </nav>
      </aside>

      <section className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="icon-btn sidebar-toggle"
              type="button"
              aria-label="Toggle sidebar"
              onClick={() => setIsSidebarOpen((prev) => !prev)}
            >
              <span />
              <span />
              <span />
            </button>
            <input className="search" type="text" placeholder="Search..." />
          </div>
          <div className="top-icons">
            <button className="icon-btn" type="button" onClick={onGoProfile}>Profile</button>
          </div>
        </header>

        <div className="content-box">
          <h1>Good morning, {user?.fullName || user?.email?.split('@')[0] || 'User'}!</h1>
          <div className="calendar-box">Calendar</div>
        </div>
      </section>

      <aside className="right-panel">
        <div className="right-box">Water Log</div>
        <div className="right-box">Social Posts</div>
      </aside>
    </main>
  )
}

export default Dashboard
