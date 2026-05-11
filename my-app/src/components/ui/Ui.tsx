import styles from './Ui.module.css'

// ─── Page Header ──────────────────────────────────────────────

interface PageHeaderProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className={styles.pageHeader}>
      <div>
        <h1 className={styles.pageTitle}>{title}</h1>
        {subtitle && <p className={styles.pageSubtitle}>{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

// ─── Stat Card ────────────────────────────────────────────────

interface StatCardProps {
  label: string
  value: string | number
  icon?: string
  accent?: 'primary' | 'danger' | 'warning' | 'neutral'
  sub?: string
}

export function StatCard({ label, value, icon, accent = 'primary', sub }: StatCardProps) {
  return (
    <div className={`${styles.statCard} ${styles[`statCard_${accent}`]}`}>
      {icon && <span className={styles.statIcon}>{icon}</span>}
      <div className={styles.statValue}>{value}</div>
      <div className={styles.statLabel}>{label}</div>
      {sub && <div className={styles.statSub}>{sub}</div>}
    </div>
  )
}

// ─── Status Badge ─────────────────────────────────────────────

interface StatusBadgeProps {
  status: string
}

const STATUS_MAP: Record<string, string> = {
  PENDING:   'warning',
  CONFIRMED: 'success',
  CANCELLED: 'danger',
  COMPLETED: 'success',
  NO_SHOW:   'danger',
  ACTIVE:    'success',
  SUSPENDED: 'danger',
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const variant = STATUS_MAP[status] ?? 'neutral'
  return (
    <span className={`${styles.badge} ${styles[`badge_${variant}`]}`}>
      {status}
    </span>
  )
}

// ─── Empty State ──────────────────────────────────────────────

interface EmptyStateProps {
  icon?: string
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ icon = '◈', title, description, action }: EmptyStateProps) {
  return (
    <div className={styles.emptyState}>
      <div className={styles.emptyIcon}>{icon}</div>
      <div className={styles.emptyTitle}>{title}</div>
      {description && <p className={styles.emptyDesc}>{description}</p>}
      {action && <div className={styles.emptyAction}>{action}</div>}
    </div>
  )
}

// ─── Spinner ──────────────────────────────────────────────────

export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  return <div className={`${styles.spinner} ${styles[`spinner_${size}`]}`} />
}

// ─── Section Card ─────────────────────────────────────────────

interface SectionCardProps {
  title?: string
  action?: React.ReactNode
  children: React.ReactNode
  noPad?: boolean
}

export function SectionCard({ title, action, children, noPad }: SectionCardProps) {
  return (
    <div className={`card ${styles.sectionCard}`}>
      {(title || action) && (
        <div className={styles.sectionCardHeader}>
          {title && <h2 className={styles.sectionCardTitle}>{title}</h2>}
          {action && <div>{action}</div>}
        </div>
      )}
      <div className={noPad ? '' : styles.sectionCardBody}>
        {children}
      </div>
    </div>
  )
}

// ─── Confirm Modal ────────────────────────────────────────────

interface ConfirmModalProps {
  title: string
  description: string
  confirmLabel?: string
  variant?: 'danger' | 'warning'
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
}

export function ConfirmModal({
  title, description, confirmLabel = 'Confirm',
  variant = 'danger', onConfirm, onCancel, loading,
}: ConfirmModalProps) {
  return (
    <div className={styles.modalBackdrop}>
      <div className={`card ${styles.modal}`}>
        <h3 className={styles.modalTitle}>{title}</h3>
        <p className={styles.modalDesc}>{description}</p>
        <div className={styles.modalActions}>
          <button className="btn btn-secondary" onClick={onCancel} disabled={loading}>
            Cancel
          </button>
          <button
            className={`btn ${variant === 'danger' ? 'btn-danger' : 'btn-warning'}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? '…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}