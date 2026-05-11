'use client'

import DashboardShell from '@/components/layout/DashboardShell'
import { PageHeader, StatCard, SectionCard, StatusBadge, Spinner, EmptyState } from '@/components/ui/Ui'
import { useUsers } from '@/hooks/useUser'
import { useDoctors } from '@/hooks/useDoctor'
import styles from '@/components/ui/Ui.module.css'
import { useAuthStore, selectIsAuthenticated, selectIsHydrated, selectRole } from "@/store/authStore";

export default function AdminDashboardPage() {
  const { data: usersData,   isLoading: loadingUsers }   = useUsers()
  const { data: doctorsData, isLoading: loadingDoctors } = useDoctors()
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const isHydrated      = useAuthStore(selectIsHydrated);

  const totalUsers   = usersData?.total   ?? 0
  const totalDoctors = doctorsData?.total ?? 0
  const recentUsers  = usersData?.data?.slice(0, 5) ?? []


  //if (!isHydrated) return null;

  // Already logged in — redirect effect is running, render nothing
  if (!isAuthenticated) return null;

  return (
    <DashboardShell>
      <PageHeader
        title="Admin Dashboard"
        subtitle="Platform overview and quick actions"
      />

      {/* ── Stats ── */}
      <div className={styles.statsGrid}>
        <StatCard
          label="Total Users"
          value={loadingUsers ? '—' : totalUsers}
          icon="◈"
          accent="primary"
        />
        <StatCard
          label="Doctors"
          value={loadingDoctors ? '—' : totalDoctors}
          icon="✦"
          accent="neutral"
        />
        <StatCard
          label="Roles"
          value="3"
          icon="⬡"
          accent="warning"
          sub="Admin · Doctor · Client"
        />
      </div>

      {/* ── Recent Users ── */}
      <SectionCard
        title="Recent Users"
        action={
          <a href="/admin/users" className="btn btn-secondary" style={{ fontSize: 13 }}>
            View All →
          </a>
        }
        noPad
      >
        {loadingUsers ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <Spinner />
          </div>
        ) : recentUsers.length === 0 ? (
          <EmptyState icon="◈" title="No users yet" />
        ) : (
          <div className={styles.tableWrap}>
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Verified</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.map((u) => (
                  <tr key={u.id}>
                    <td>{u.firstName} {u.lastName}</td>
                    <td style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>{u.email}</td>
                    <td><StatusBadge status={u.role} /></td>
                    <td>
                      <span style={{ color: u.emailVerified ? '#4ade80' : 'var(--text-tertiary)', fontSize: 12 }}>
                        {u.emailVerified ? '✓ Yes' : '✗ No'}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* ── Recent Doctors ── */}
      <SectionCard
        title="Recent Doctors"
        action={
          <a href="/admin/doctors" className="btn btn-secondary" style={{ fontSize: 13 }}>
            View All →
          </a>
        }
        noPad
      >
        {loadingDoctors ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <Spinner />
          </div>
        ) : (doctorsData?.data?.length ?? 0) === 0 ? (
          <EmptyState icon="✦" title="No doctors yet" />
        ) : (
          <div className={styles.tableWrap}>
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Specialty</th>
                  <th>Email</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {doctorsData!.data.slice(0, 5).map((d) => (
                  <tr key={d.id}>
                    <td>{d.user?.firstName} {d.user?.lastName}</td>
                    <td style={{ color: 'var(--colorA-900)', fontSize: 13 }}>{d.specialty}</td>
                    <td style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>{d.user?.email}</td>
                    <td style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>
                      {new Date(d.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </DashboardShell>
  )
}