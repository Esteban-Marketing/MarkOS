'use client';

import styles from '../page.module.css';

export type LoginCardProps = {
  useTenantChrome: boolean;
  displayName: string;
  logo: string | null;
};

export default function LoginCard({ useTenantChrome, displayName, logo }: LoginCardProps) {
  return (
    <section className={`c-card c-card--feature ${styles.authCard}`} aria-labelledby="login-heading">
      {useTenantChrome && logo && (
        <img src={logo} alt={`${displayName} logo`} className={styles.logo} />
      )}
      <h1 id="login-heading">
        {useTenantChrome ? `Sign in to ${displayName}` : 'Sign in'}
      </h1>
      <form className={styles.form} method="POST" action="/api/auth/signup">
        <div className="c-field">
          <label htmlFor="email" className="c-field__label">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="c-input"
          />
          <p className="c-field__help">
            We send a magic link instead of asking for a password.
          </p>
        </div>
        <button type="submit" className="c-button c-button--primary">
          Send magic link
        </button>
      </form>
      {useTenantChrome && (
        <a
          href="https://markos.dev"
          className={styles.poweredBy}
          aria-label="Powered by MarkOS — open markos.dev"
        >
          Powered by MarkOS
        </a>
      )}
    </section>
  );
}
