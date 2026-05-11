'use client'

import { useState } from 'react'
import DashboardShell from '@/components/layout/DashboardShell'
import {
  PageHeader, SectionCard, StatusBadge,
  Spinner, EmptyState, ConfirmModal,
} from '@/components/ui/Ui'
import {
  useUsers, useDeleteUser, useAdminResetPassword,
} from '@/hooks/useUser'
import { useUiStore } from '@/store/uiStore'
import styles from './users.module.css'

export default function AdminUsersPage() {
  const [search, setSearch]         = useState('')
  const [page, setPage]             = useState(1)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [resetTarget, setResetTarget]   = useState<string | null>(null)
  const [newPassword, setNewPassword]   = useState('')

  const { data, isLoading, isFetching } = useUsers({ page, limit: 20, search: search || undefined })
  const deleteUser    = useDeleteUser(deleteTarget ?? '')
  const resetPassword = useAdminResetPassword(resetTarget ?? '')
  const { toastError } = useUiStore()

  const users      = data?.data ?? []
  const totalPages = data?.totalPages ?? 1

  function handleDeleteConfirm() {
    deleteUser.mutate(undefined, { onSettled: () => setDeleteTarget(null) })
  }

  function handleResetConfirm() {
    if (newPassword.length < 8) {
      toastError('Password too short', 'Minimum 8 characters')
      return
    }
    resetPassword.mutate(newPassword, {
      onSettled: () => { setResetTarget(null); setNewPassword('') },
    })
  }

  return (
    <DashboardShell>
      <PageHeader
        title="Users"
        subtitle={`${data?.total ?? 0} total users`}
      />

      <SectionCard noPad>
        {/* ── Toolbar ── */}
        <div className={styles.toolbar}>
          <input
            className="input"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            style={{ maxWidth: 320 }}
          />
          {isFetching && !isLoading && (
            <span style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>Updating…</span>
          )}
        </div>

        {/* ── Table ── */}
        {isLoading ? (
          <div className={styles.center}><Spinner /></div>
        ) : users.length === 0 ? (
          <EmptyState icon="◈" title="No users found" description="Try a different search term." />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Email Verified</th>
                  <th>Joined</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className={styles.nameCell}>
                      <div className={styles.avatarSmall}>
                        {u.firstName[0]}{u.lastName[0]}
                      </div>
                      {u.firstName} {u.lastName}
                    </td>
                    <td style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>{u.email}</td>
                    <td><StatusBadge status={u.role} /></td>
                    <td>
                      <span className={u.emailVerified ? styles.verified : styles.unverified}>
                        {u.emailVerified ? '✓ Verified' : '✗ Unverified'}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <button
                          className="btn btn-secondary"
                          style={{ fontSize: 12, padding: '5px 10px' }}
                          onClick={() => setResetTarget(u.id)}
                        >
                          Reset PW
                        </button>
                        <button
                          className="btn btn-danger"
                          style={{ fontSize: 12, padding: '5px 10px' }}
                          onClick={() => setDeleteTarget(u.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className={styles.pagination}>
            <button
              className="btn btn-secondary"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              ← Prev
            </button>
            <span className={styles.pageInfo}>
              Page {page} of {totalPages}
            </span>
            <button
              className="btn btn-secondary"
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next →
            </button>
          </div>
        )}
      </SectionCard>

      {/* ── Delete Confirm ── */}
      {deleteTarget && (
        <ConfirmModal
          title="Delete User"
          description="This will permanently delete the user and all associated data. This action cannot be undone."
          confirmLabel="Delete"
          variant="danger"
          loading={deleteUser.isPending}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* ── Reset Password Modal ── */}
      {resetTarget && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)',
          zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }}>
          <div className="card" style={{ width: '100%', maxWidth: 400, padding: 28 }}>
            <h3 style={{ margin: '0 0 12px', color: 'var(--text-primary)' }}>Reset Password</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 16 }}>
              Enter a new password for this user.
            </p>
            <input
              className="input"
              type="password"
              placeholder="New password (min 8 chars)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={{ marginBottom: 20 }}
            />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => { setResetTarget(null); setNewPassword('') }}>
                Cancel
              </button>
              <button
                className="btn btn-warning"
                onClick={handleResetConfirm}
                disabled={resetPassword.isPending}
              >
                {resetPassword.isPending ? '…' : 'Reset'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  )
}