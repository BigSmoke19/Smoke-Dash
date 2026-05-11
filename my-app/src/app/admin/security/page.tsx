'use client'

import { useState } from 'react'
import DashboardShell from '@/components/layout/DashboardShell'
import { PageHeader, SectionCard, StatusBadge, Spinner, EmptyState, ConfirmModal } from '@/components/ui/Ui'
import { useUsers, useLoginHistory, useActiveSessions, useRevokeSession } from '@/hooks/useUser'
import { usePagination } from '@/hooks/usePagination'
import type { User, LoginHistory, ActiveSession } from '@/types'
import styles from './security.module.css'

// ─── Session panel for one user ──────────────────────────────

function UserSessionPanel({ user, onClose }: { user: User; onClose: () => void }) {
  const [tab, setTab] = useState<'sessions' | 'history'>('sessions')
  const [revokeTarget, setRevokeTarget] = useState<string | null>(null)

  const { page: hPage, next: hNext, prev: hPrev } = usePagination({ initialLimit: 10 })
  const { data: sessionsData, isLoading: loadingSessions } = useActiveSessions(user.id)
  const { data: historyData,  isLoading: loadingHistory }  = useLoginHistory(user.id, { page: hPage, limit: 10 })
  const revokeSession = useRevokeSession(user.id)

  const sessions   = sessionsData ?? []
  const history    = historyData?.data ?? []
  const totalPages = historyData?.totalPages ?? 1

  return (
    <div className={styles.drawerBackdrop} onClick={onClose}>
      <div className={styles.drawer} onClick={(e) => e.stopPropagation()}>
        <div className={styles.drawerHeader}>
          <div>
            <h3 className={styles.drawerTitle}>Security: {user.firstName} {user.lastName}</h3>
            <div className={styles.drawerSub}>{user.email}</div>
          </div>
          <button className={styles.drawerClose} onClick={onClose}>✕</button>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button className={`${styles.tab} ${tab === 'sessions' ? styles.tabActive : ''}`} onClick={() => setTab('sessions')}>
            Active Sessions ({sessions.length})
          </button>
          <button className={`${styles.tab} ${tab === 'history' ? styles.tabActive : ''}`} onClick={() => setTab('history')}>
            Login History
          </button>
        </div>

        {tab === 'sessions' && (
          <div>
            {loadingSessions ? (
              <div className={styles.center}><Spinner /></div>
            ) : sessions.length === 0 ? (
              <EmptyState icon="◉" title="No active sessions" />
            ) : (
              sessions.map((s) => (
                <div key={s.id} className={styles.sessionCard}>
                  <div className={styles.sessionInfo}>
                    <div className={styles.sessionIp}>{s.ipAddress ?? 'Unknown IP'}</div>
                    <div className={styles.sessionMeta}>
                      Created: {new Date(s.createdAt).toLocaleString()}
                    </div>
                    {s.lastUsedAt && (
                      <div className={styles.sessionMeta}>
                        Last used: {new Date(s.lastUsedAt).toLocaleString()}
                      </div>
                    )}
                    <div className={styles.sessionMeta}>
                      Expires: {new Date(s.expiresAt).toLocaleString()}
                    </div>
                    {s.userAgent && (
                      <div className={styles.sessionUa}>{s.userAgent}</div>
                    )}
                  </div>
                  <button
                    className="btn btn-danger"
                    style={{ fontSize: 11, padding: '4px 10px', flexShrink: 0 }}
                    onClick={() => setRevokeTarget(s.id)}
                  >
                    Revoke
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'history' && (
          <div>
            {loadingHistory ? (
              <div className={styles.center}><Spinner /></div>
            ) : history.length === 0 ? (
              <EmptyState icon="◷" title="No login history" />
            ) : (
              <>
                {history.map((h) => (
                  <div key={h.id} className={`${styles.historyRow} ${h.success ? styles.historySuccess : styles.historyFail}`}>
                    <div className={styles.historyIcon}>{h.success ? '✓' : '✗'}</div>
                    <div className={styles.historyInfo}>
                      <div className={styles.historyIp}>{h.ipAddress ?? 'Unknown IP'}</div>
                      <div className={styles.historyTime}>{new Date(h.createdAt).toLocaleString()}</div>
                      {!h.success && h.failureReason && (
                        <div className={styles.historyReason}>{h.failureReason}</div>
                      )}
                    </div>
                  </div>
                ))}
                {totalPages > 1 && (
                  <div className={styles.miniPagination}>
                    <button className="btn btn-secondary" disabled={hPage === 1} onClick={hPrev} style={{ fontSize: 11 }}>←</button>
                    <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{hPage} / {totalPages}</span>
                    <button className="btn btn-secondary" disabled={hPage === totalPages} onClick={hNext} style={{ fontSize: 11 }}>→</button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {revokeTarget && (
        <ConfirmModal
          title="Revoke Session"
          description="This will immediately log the user out of this session."
          confirmLabel="Revoke"
          variant="danger"
          loading={revokeSession.isPending}
          onConfirm={() =>
            revokeSession.mutate(revokeTarget, { onSettled: () => setRevokeTarget(null) })
          }
          onCancel={() => setRevokeTarget(null)}
        />
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────

export default function AdminSecurityPage() {
  const [search, setSearch]   = useState('')
  const [viewing, setViewing] = useState<User | null>(null)

  const { page, limit, next, prev, reset } = usePagination({ initialLimit: 20 })

  const { data, isLoading, isFetching } = useUsers({
    page, limit, search: search || undefined,
  })

  const users      = data?.data ?? []
  const totalPages = data?.totalPages ?? 1

  return (
    <DashboardShell>
      <PageHeader
        title="Security Controls"
        subtitle="Manage sessions, login history, and IP activity"
      />

      <SectionCard noPad>
        <div className={styles.toolbar}>
          <input
            className="input"
            placeholder="Search users…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); reset() }}
            style={{ maxWidth: 300 }}
          />
          {isFetching && !isLoading && (
            <span style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>Updating…</span>
          )}
        </div>

        {isLoading ? (
          <div className={styles.center}><Spinner /></div>
        ) : users.length === 0 ? (
          <EmptyState icon="◈" title="No users found" />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Email Verified</th>
                  <th>Joined</th>
                  <th>Security</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className={styles.userCell}>
                        <div className={styles.avatarSmall}>{u.firstName[0]}{u.lastName[0]}</div>
                        <div>
                          <div style={{ fontWeight: 500 }}>{u.firstName} {u.lastName}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td><StatusBadge status={u.role} /></td>
                    <td>
                      <span style={{ color: u.emailVerified ? '#4ade80' : 'var(--danger-600)', fontSize: 12, fontWeight: 600 }}>
                        {u.emailVerified ? '✓ Verified' : '✗ Unverified'}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary"
                        style={{ fontSize: 12, padding: '5px 10px' }}
                        onClick={() => setViewing(u)}
                      >
                        ◉ Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className={styles.pagination}>
            <button className="btn btn-secondary" disabled={page === 1} onClick={prev}>← Prev</button>
            <span className={styles.pageInfo}>Page {page} of {totalPages}</span>
            <button className="btn btn-secondary" disabled={page === totalPages} onClick={next}>Next →</button>
          </div>
        )}
      </SectionCard>

      {viewing && <UserSessionPanel user={viewing} onClose={() => setViewing(null)} />}
    </DashboardShell>
  )
}