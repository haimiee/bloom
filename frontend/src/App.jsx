import { useState } from 'react'
import Landing from './pages/Landing.jsx'
import SignIn from './pages/SignIn.jsx'
import SignUp from './pages/SignUp.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Profile from './pages/Profile.jsx'
import Friends from './pages/Friends.jsx'

function App() {
  const [page, setPage] = useState('landing')
  const [user, setUser] = useState(null)

  const handleSignIn = ({ email, password }) => {
    if (!email || !password) {
      return { ok: false, message: 'Email and password are required.' }
    }

    setUser({ email })
    setPage('dashboard')
    return { ok: true }
  }

  const handleSignUp = ({ fullName, email, password }) => {
    if (!fullName || !email || !password) {
      return { ok: false, message: 'All fields are required.' }
    }

    setUser({ fullName, email })
    setPage('dashboard')
    return { ok: true }
  }

  if (page === 'signin') {
    return <SignIn onGoSignUp={() => setPage('signup')} onSignIn={handleSignIn} />
  }

  if (page === 'signup') {
    return <SignUp onGoSignIn={() => setPage('signin')} onSignUp={handleSignUp} />
  }

  if (page === 'dashboard') {
    return (
      <Dashboard
        user={user}
        onGoProfile={() => setPage('profile')}
        onGoFriends={() => setPage('friends')}
        onSignOut={() => {
          setUser(null)
          setPage('landing')
        }}
      />
    )
  }

  if (page === 'profile') {
    return <Profile user={user} onBack={() => setPage('dashboard')} onGoFriends={() => setPage('friends')} />
  }

  if (page === 'friends') {
    return <Friends onBack={() => setPage('dashboard')} />
  }

  return <Landing onSignIn={() => setPage('signin')} onSignUp={() => setPage('signup')} />
}

export default App
