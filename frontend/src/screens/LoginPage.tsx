import type { FormEvent, ReactNode } from 'react'

type FieldErrors = {
  email?: string
  password?: string
}

type LoginPageProps = {
  topBarNode: ReactNode
  email: string
  password: string
  loginErrors: FieldErrors
  statusMessage: string
  isErrorMessage: boolean
  isSubmittingLogin: boolean
  showPassword: boolean
  onEmailChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onTogglePassword: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onGoSignup: () => void
}

export default function LoginPage({
  topBarNode,
  email,
  password,
  loginErrors,
  statusMessage,
  isErrorMessage,
  isSubmittingLogin,
  showPassword,
  onEmailChange,
  onPasswordChange,
  onTogglePassword,
  onSubmit,
  onGoSignup,
}: LoginPageProps) {
  return (
    <div className="auth-page">
      <div className="auth-layout single-column">
        <section className="form-shell" aria-labelledby="login-title">
          {topBarNode}
          <form className="signup-form" onSubmit={onSubmit} noValidate>
            <div className="field-wrap">
              <label htmlFor="login-email">Email</label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => onEmailChange(event.target.value)}
                placeholder="Email"
                aria-invalid={Boolean(loginErrors.email)}
                aria-describedby={loginErrors.email ? 'login-email-error' : undefined}
              />
              {loginErrors.email && (
                <p className="field-error" id="login-email-error" role="alert">
                  {loginErrors.email}
                </p>
              )}
            </div>

            <div className="field-wrap">
              <label htmlFor="login-password">Password</label>
              <div className="password-row">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => onPasswordChange(event.target.value)}
                  placeholder="Password"
                  aria-invalid={Boolean(loginErrors.password)}
                  aria-describedby={loginErrors.password ? 'login-password-error' : undefined}
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
              {loginErrors.password && (
                <p className="field-error" id="login-password-error" role="alert">
                  {loginErrors.password}
                </p>
              )}
            </div>

            <button className="primary-action" type="submit" disabled={isSubmittingLogin}>
              {isSubmittingLogin ? 'Logging In...' : 'Enter Bloom'}
            </button>
          </form>

          <p className={`status-message ${isErrorMessage ? 'error' : ''}`} role="status" aria-live="polite">
            {statusMessage}
          </p>

          <div className="login-row">
            <p>Need an account?</p>
            <button className="secondary-action" type="button" onClick={onGoSignup}>
              Create Account
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}