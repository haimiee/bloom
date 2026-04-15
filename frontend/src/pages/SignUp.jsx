import { useState } from 'react'
import './SignUp.css'

function SignUp({ onGoSignIn, onSignUp }) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = () => {
    const result = onSignUp({ fullName: fullName.trim(), email: email.trim(), password })
    if (!result?.ok) {
      setError(result?.message || 'Unable to sign up.')
      return
    }
    setError('')
  }

  return (
    <main>
      <div className="section">
        <div className="box">
          <h1>Sign Up</h1>
          <p>Create your Bloom account.</p>
        </div>

        <div className="box">
          <label htmlFor="signup-name">Full Name</label>
          <input
            id="signup-name"
            type="text"
            placeholder="Your name"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
          />

          <label htmlFor="signup-email">Email</label>
          <input
            id="signup-email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />

          <label htmlFor="signup-password">Password</label>
          <input
            id="signup-password"
            type="password"
            placeholder="Create password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />

          <button className="btn" type="button" onClick={handleSubmit}>Create Account</button>
          {error && <p>{error}</p>}
        </div>

        <div className="box">
          <p>
            Already have an account?{' '}
            <button
              type="button"
              onClick={onGoSignIn}
              style={{ border: 'none', background: 'none', padding: 0, textDecoration: 'underline', cursor: 'pointer', font: 'inherit' }}
            >
              Sign in
            </button>
            .
          </p>
        </div>
      </div>
    </main>
  )
}

export default SignUp
