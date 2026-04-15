import { useState } from 'react'
import './SignIn.css'

function SignIn({ onGoSignUp, onSignIn }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = () => {
    const result = onSignIn({ email: email.trim(), password })
    if (!result?.ok) {
      setError(result?.message || 'Unable to sign in.')
      return
    }
    setError('')
  }

  return (
    <main>
      <div className="section">
        <div className="box">
          <h1>Sign In</h1>
          <p>Welcome back to Bloom.</p>
        </div>

        <div className="box">
          <label htmlFor="login-email">Email</label>
          <input
            id="login-email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />

          <label htmlFor="login-password">Password</label>
          <input
            id="login-password"
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />

          <button className="btn" type="button" onClick={handleSubmit}>Sign In</button>
          {error && <p>{error}</p>}
        </div>

        <div className="box">
          <p>
            Don't have an account?{' '}
            <button
              type="button"
              onClick={onGoSignUp}
              style={{ border: 'none', background: 'none', padding: 0, textDecoration: 'underline', cursor: 'pointer', font: 'inherit' }}
            >
              Sign up
            </button>
            .
          </p>
        </div>
      </div>
    </main>
  )
}

export default SignIn
