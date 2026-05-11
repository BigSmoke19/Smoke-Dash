'use client'

import { useAuthStore, selectUser, selectRole } from '@/store/authStore'
import { useAuth } from '@/hooks/useAuth'
import styles from './DashboardShell.module.css'
import { ROUTES } from '@/lib/constants'
import Link from 'next/link'
import { usePathname} from 'next/navigation'

const DOCTOR_NAV = [
        { href: ROUTES.doctorDashboard, label: 'Dashboard',   icon: '⬡' },
        { href: ROUTES.doctorBookings,    label: 'Bookings',     icon: '◈' },
      ]
const CLIENT_NAV = [
  { href: ROUTES.dashboard,       label: 'Dashboard',   icon: '⬡' },
  { href: ROUTES.userProfile,     label: 'Profile',      icon: '◉' },
]

function getNav(role?: string) {
  return (role === "DOCTOR")?DOCTOR_NAV:CLIENT_NAV
}

export default function DashboardHead({ children }: { children: React.ReactNode }){
      const user      = useAuthStore(selectUser)
      const role      = useAuthStore(selectRole)
      const { logout } = useAuth()
      const pathname  = usePathname()

      const nav = getNav(role)
    
    return (
        <div>
            <div>
                <div className={styles.brand}>
                    <span className={styles.brandMark}>⬡</span>
                    <span className={styles.brandName}>Smoke Dash</span>
                </div>
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
                    <button
                        className={styles.logoutBtn}
                        onClick={() => logout.mutate()}
                        >
                        ⏻
                    </button>
                </div>
            </div>
            <main className={styles.content}>
                {children}
            </main>
        </div>
    )
}