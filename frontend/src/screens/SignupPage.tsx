import type { FormEvent, ReactNode } from 'react'
import signupLotusImage from '../../assets/images/signuppage/lotus.png'

type FieldErrors = {
  name?: string
  email?: string
  password?: string
}

type SignupPageProps = {
  topBarNode: ReactNode
  name: string
  email: string
  password: string
  signupErrors: FieldErrors
  statusMessage: string
  isErrorMessage: boolean
  isSubmittingSignup: boolean
  showPassword: boolean
  onNameChange: (value: string) => void
  onEmailChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onTogglePassword: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onGoLogin: () => void
}

export default function SignupPage({
  topBarNode,
  name,
  email,
  password,
  signupErrors,
  statusMessage,
  isErrorMessage,
  isSubmittingSignup,
  showPassword,
  onNameChange,
  onEmailChange,
  onPasswordChange,
  onTogglePassword,
  onSubmit,
  onGoLogin,
}: SignupPageProps) {
  return (
    <div className="auth-page">
      <div className="auth-layout">
        <aside className="art-panel" aria-hidden="true">
          <img className="signup-lotus-image" src={signupLotusImage} alt="" draggable={false} />
        </aside>
        <section className="form-shell" aria-labelledby="signup-title">
          {topBarNode}
          <form className="signup-form" onSubmit={onSubmit} noValidate>
            <div className="field-wrap">
              <label htmlFor="signup-name">Your Name</label>
              <input
                id="signup-name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(event) => onNameChange(event.target.value)}
                placeholder="Your Name"
                aria-invalid={Boolean(signupErrors.name)}
                aria-describedby={signupErrors.name ? 'signup-name-error' : undefined}
              />
              {signupErrors.name && (
                <p className="field-error" id="signup-name-error" role="alert">
                  {signupErrors.name}
                </p>
              )}
            </div>

            <div className="field-wrap">
              <label htmlFor="signup-email">Email</label>
              <input
                id="signup-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => onEmailChange(event.target.value)}
                placeholder="Email"
                aria-invalid={Boolean(signupErrors.email)}
                aria-describedby={signupErrors.email ? 'signup-email-error' : undefined}
              />
              {signupErrors.email && (
                <p className="field-error" id="signup-email-error" role="alert">
                  {signupErrors.email}
                </p>
              )}
            </div>

            <div className="field-wrap">
              <label htmlFor="signup-password">Password</label>
              <div className="password-row">
                <input
                  id="signup-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => onPasswordChange(event.target.value)}
                  placeholder="Password"
                  aria-invalid={Boolean(signupErrors.password)}
                  aria-describedby={signupErrors.password ? 'signup-password-error' : undefined}
                />
                <button
                  className="visibility-toggle"
                  type="button"
                  onClick={onTogglePassword}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              {signupErrors.password && (
                <p className="field-error" id="signup-password-error" role="alert">
                  {signupErrors.password}
                </p>
              )}
            </div>

            <button className="primary-action" type="submit" disabled={isSubmittingSignup}>
              {isSubmittingSignup ? 'Creating...' : 'Start Blooming'}
            </button>
          </form>

          <p className={`status-message ${isErrorMessage ? 'error' : ''}`} role="status" aria-live="polite">
            {statusMessage}
          </p>

          <div className="login-row">
            <p>Have an account?</p>
            <button className="secondary-action" type="button" onClick={onGoLogin}>
              Log In
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}