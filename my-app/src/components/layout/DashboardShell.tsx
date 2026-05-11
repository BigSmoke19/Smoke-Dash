'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthStore, selectUser, selectRole } from '@/store/authStore'
import { useUiStore } from '@/store/uiStore'
import { useAuth } from '@/hooks/useAuth'
import { ROUTES } from '@/lib/constants'
import styles from './DashboardShell.module.css'

// ─── Nav config per role ──────────────────────────────────────

const ADMIN_NAV = [
  { href: ROUTES.adminDashboard,  label: 'Dashboard',   icon: '⬡' },
  { href: ROUTES.adminUsers,      label: 'Users',        icon: '◈' },
  { href: ROUTES.adminDoctors,       label: 'Doctors',      icon: '✦' },
  { href: ROUTES.adminSlots,     label: 'Time Slots',   icon: '◷' },
  { href: ROUTES.adminAuditLogs,  label: 'Audit Logs',   icon: '◉' },
]

const DOCTOR_NAV = [
  { href: ROUTES.doctorDashboard, label: 'Dashboard',   icon: '⬡' },
  { href: '/doctor/slots',        label: 'My Slots',     icon: '◷' },
  { href: '/doctor/bookings',     label: 'Bookings',     icon: '◈' },
]

const CLIENT_NAV = [
  { href: ROUTES.dashboard,       label: 'Dashboard',   icon: '⬡' },
  { href: '/doctors',             label: 'Find a Doctor',icon: '✦' },
  { href: '/bookings',            label: 'My Bookings',  icon: '◈' },
  { href: ROUTES.userProfile,     label: 'Profile',      icon: '◉' },
]

function getNav(role?: string) {
  if (role === 'ADMIN')  return ADMIN_NAV
  if (role === 'DOCTOR') return DOCTOR_NAV
  return CLIENT_NAV
}

// ─── Component ────────────────────────────────────────────────

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname  = usePathname()
  const user      = useAuthStore(selectUser)
  const role      = useAuthStore(selectRole)
  const { logout } = useAuth()
  const { sidebarOpen, toggleSidebar } = useUiStore()

  const nav = getNav(role)

  return (
    <div className={styles.shell}>

      {/* ── Sidebar ── */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.brand}>
          <span className={styles.brandMark}>⬡</span>
          <span className={styles.brandName}>Smoke Dash</span>
        </div>

        <nav className={styles.nav}>
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navLink} ${pathname === item.href ? styles.navLinkActive : ''}`}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.userChip}>
            <div className={styles.avatar}>
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div className={styles.userInfo}>
              <span className={styles.userName}>{user?.firstName} {user?.lastName}</span>
              <span className={styles.userRole}>{role}</span>
            </div>
          </div>
          <button
            className={styles.logoutBtn}
            onClick={() => logout.mutate()}
          >
            ⏻
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className={styles.main}>
        <header className={styles.header}>
          <button className={styles.menuBtn} onClick={toggleSidebar}>☰</button>
          <div className={styles.headerRight}>
            <span className={styles.roleBadge}>{role}</span>
          </div>
        </header>
        <main className={styles.content}>
          {children}
        </main>
      </div>

      {/* ── Mobile overlay ── */}
      {sidebarOpen && (
        <div className={styles.overlay} onClick={toggleSidebar} />
      )}
    </div>
  )
}
