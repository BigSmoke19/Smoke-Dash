'use client'

import Link from 'next/link'
import styles from './AuthForm.module.css'

// ─── AuthCard ─────────────────────────────────────────────────

interface AuthCardProps {
  title: string
  subtitle?: string
  children: React.ReactNode
}

export function AuthCard({ title, subtitle, children }: AuthCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.cardHead}>
        <h2 className={styles.title}>{title}</h2>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}

// ─── Field ────────────────────────────────────────────────────

interface FieldProps {
  label: string
  error?: string
  children: React.ReactNode
  hint?: string
}

export function Field({ label, error, children, hint }: FieldProps) {
  return (
    <div className={styles.field}>
      <label className={styles.label}>{label}</label>
      {children}
      {hint  && !error && <span className={styles.hint}>{hint}</span>}
      {error && <span className={styles.error}>{error}</span>}
    </div>
  )
}

// ─── SubmitButton ────────────────────────────────────────────

interface SubmitButtonProps {
  label: string
  loadingLabel?: string
  loading?: boolean
  disabled?: boolean
  variant?: 'primary' | 'warning'
  onClick?: () => void
}

export function SubmitButton({
  label,
  loadingLabel = 'Please wait…',
  loading = false,
  disabled = false,
  variant = 'primary',
  onClick,
}: SubmitButtonProps) {
  return (
    <button
      type="button"
      className={`${styles.submitBtn} ${styles[`submitBtn_${variant}`]}`}
      disabled={loading || disabled}
      aria-busy={loading}
      onClick={onClick}
    >
      {loading
        ? <><span className={styles.btnSpinner} />{loadingLabel}</>
        : label
      }
    </button>
  )
}

// ─── AuthLink ────────────────────────────────────────────────

interface AuthLinkProps {
  prefix?: string
  label: string
  href: string
}

export function AuthLink({ prefix, label, href }: AuthLinkProps) {
  return (
    <p className={styles.authLink}>
      {prefix && <span>{prefix} </span>}
      <Link href={href} className={styles.link}>{label}</Link>
    </p>
  )
}

// ─── Divider ─────────────────────────────────────────────────

export function Divider() {
  return <div className={styles.divider} />
}

// ─── AlertBanner ─────────────────────────────────────────────

interface AlertBannerProps {
  message: string
  variant?: 'error' | 'success' | 'info'
}

export function AlertBanner({ message, variant = 'error' }: AlertBannerProps) {
  return (
    <div className={`${styles.alert} ${styles[`alert_${variant}`]}`}>
      <span className={styles.alertIcon}>
        {variant === 'success' ? '✓' : variant === 'info' ? 'ℹ' : '✕'}
      </span>
      {message}
    </div>
  )
}
