import { Link } from 'react-router-dom'
import './LandingPage.css'

type LandingPageProps = {
  onOpenCommand: () => void
}

export default function LandingPage({ onOpenCommand }: LandingPageProps) {
  return (
    <main className="landing-page">
      <section className="landing-hero">
        <p className="landing-kicker">Example App</p>
        <h1>Simple landing page for the settings demo.</h1>
        <p className="landing-copy">
          This is intentionally generic. It gives the demo a clear start page before entering
          the settings area powered by `react-router-ai`.
        </p>

        <div className="landing-actions">
          <Link className="landing-button landing-button-primary" to="/settings">
            Open settings demo
          </Link>
          <button
            className="landing-button landing-button-secondary"
            type="button"
            onClick={onOpenCommand}
          >
            Jump to a setting
          </button>
          <a
            className="landing-button landing-button-tertiary"
            href="https://reactrouter.com/"
            target="_blank"
            rel="noreferrer"
          >
            React Router
          </a>
        </div>
      </section>

      <section className="landing-grid" aria-label="Highlights">
        <article className="landing-card">
          <h2>Intent-driven navigation</h2>
          <p>Use text or voice commands to jump directly to nested settings pages.</p>
        </article>
        <article className="landing-card">
          <h2>Plain React Router</h2>
          <p>The demo stays small and uses standard browser routing under the hood.</p>
        </article>
        <article className="landing-card">
          <h2>Minimal example</h2>
          <p>Start here, then move into the settings shell to test the provider in context.</p>
        </article>
      </section>
    </main>
  )
}
