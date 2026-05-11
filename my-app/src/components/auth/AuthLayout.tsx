'use client'

import styles from './AuthLayout.module.css'

interface AuthLayoutProps {
  children: React.ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className={styles.root}>

      {/* ── Left: brand panel ── */}
      <aside className={styles.brand}>
        <div className={styles.brandNoise} />
        <div className={styles.brandOrb1} />
        <div className={styles.brandOrb2} />

        <div className={styles.brandContent}>
          <div className={styles.brandMark}>
            <span className={styles.brandHex}>⬡</span>
          </div>
          <h1 className={styles.brandName}>Smoke Dash</h1>
          <p className={styles.brandTagline}>
            Intelligent care,<br />expertly connected.
          </p>

          <ul className={styles.featureList}>
            {[
              ['✦', 'Find verified specialists'],
              ['◷', 'Book in seconds'],
              ['◈', 'Secure health records'],
            ].map(([icon, text]) => (
              <li key={text} className={styles.featureItem}>
                <span className={styles.featureIcon}>{icon}</span>
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* ── Right: form panel ── */}
      <main className={styles.formPanel}>
        <div className={styles.formWrap}>
          {children}
        </div>
      </main>

    </div>
  )
}
