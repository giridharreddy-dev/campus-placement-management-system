import { useState } from 'react';
import { useAuth } from '../context/useAuth';
import Icon from '../workspace/Icon';
import '../workspace/workspace.css';

function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await login(email, password);
    } catch (err) {
      setErrorMessage(
        err.message || 'Login failed. Please check your credentials.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFillDemo = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('');
    setErrorMessage(null);
  };

  return (
    <div className="ws-login">
      <section className="ws-login-story">
        <a className="ws-login-brand" href="/">
          <span className="ws-brand-mark">
            <Icon name="briefcase" size={23} />
          </span>
          <span>
            CPMS<small>Campus careers</small>
          </span>
        </a>
        <div className="ws-login-intro">
          <p className="ws-login-eyebrow">A BETTER BEGINNING</p>
          <h1>
            From campus <br />
            to your next <br />
            <em>chapter.</em>
          </h1>
          <p>
            Your opportunities, applications and interviews.
            <br />A clearer path from where you are to where you want to be.
          </p>
          <div
            className="ws-login-preview"
            aria-label="Career workspace features"
          >
            <span className="ws-login-preview-icon">
              <Icon name="briefcase" size={23} />
            </span>
            <div>
              <strong>A workspace for your future.</strong>
              <small>Discover opportunities. Follow your progress.</small>
            </div>
            <Icon name="arrow" size={20} />
          </div>
          <div className="ws-login-features">
            <span>
              <Icon name="check" size={14} />
              Explore campus roles
            </span>
            <span>
              <Icon name="check" size={14} />
              Track every step
            </span>
            <span>
              <Icon name="check" size={14} />
              Prepare with confidence
            </span>
          </div>
        </div>
        <p className="ws-login-story-footer">
          BUILT FOR STUDENTS. CONNECTED TO OPPORTUNITY.
        </p>
      </section>
      <section className="ws-login-access">
        <div className="ws-login-top">
          <span>Your campus. Your next move.</span>
          <a href="/demo">
            Explore demo
            <Icon name="arrow" size={15} />
          </a>
        </div>
        <div className="ws-login-card">
          <p className="ws-kicker">WELCOME TO YOUR WORKSPACE</p>
          <h2>Good to see you again.</h2>
          <p className="ws-login-subtitle">
            Sign in to continue your placement journey.
          </p>

          {errorMessage && (
            <div className="login-error-alert" role="alert">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="ws-login-form">
            <div className="form-group">
              <label htmlFor="login-email">Email Address</label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@campus.edu"
                required
                autoComplete="username"
                disabled={isSubmitting}
              />
            </div>

            <div className="form-group">
              <label htmlFor="login-password">Password</label>
              <div className="ws-password-field">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your secure password"
                  required
                  autoComplete="current-password"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="ws-button full"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Signing you in…' : 'Sign in to your workspace'}
              <Icon name="arrow" size={17} />
            </button>
          </form>

          <div className="ws-login-presets">
            <p>Choose your account</p>
            <div>
              <button
                type="button"
                className="ws-account-preset"
                onClick={() => handleFillDemo('rahul.sharma@university.edu')}
              >
                <Icon name="user" size={15} />
                Student
              </button>
              <button
                type="button"
                className="ws-account-preset"
                onClick={() =>
                  handleFillDemo('recruiter.techcorp@placement.edu')
                }
              >
                <Icon name="briefcase" size={15} />
                Recruiter
              </button>
              <button
                type="button"
                className="ws-account-preset"
                onClick={() => handleFillDemo('admin@placement.edu')}
              >
                <Icon name="people" size={15} />
                Officer
              </button>
            </div>
            <small>
              Fills your account email. Enter your configured password.
            </small>
          </div>
          <div className="ws-login-divider">
            <span>JUST EXPLORING?</span>
          </div>
          <a className="ws-demo-entry" href="/demo">
            <span className="ws-demo-entry-icon">
              <Icon name="play" size={18} />
            </span>
            <span>
              <strong>Take the interactive tour</strong>
              <small>
                Try all three roles with sample data. No login needed.
              </small>
            </span>
            <Icon name="arrow" size={18} />
          </a>
        </div>
        <footer className="ws-login-resources">
          <a className="cpms-lab-link" href="/syllabus">
            FSD syllabus lab
          </a>
          <span>·</span>
          <a href="/case-study">Five case studies</a>
          <span>·</span>
          <a href="/project-files">Programs & source</a>
        </footer>
      </section>
    </div>
  );
}

export default Login;
