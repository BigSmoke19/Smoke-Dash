'use client'

import { useState } from 'react'
import DashboardShell from '@/components/layout/DashboardShell'
import {
  PageHeader,
  SectionCard,
  Spinner,
  EmptyState,
} from '@/components/ui/Ui'
import { useAuditLogs } from '@/hooks/useUser'
import { usePagination } from '@/hooks/usePagination'
import type { AuditLog } from '@/types'
import styles from './audit.module.css'

function JsonBlock({ value }: { value: unknown }) {
  if (!value) {
    return <span style={{ color: 'var(--text-tertiary)' }}>—</span>
  }

  return (
    <pre className={styles.changesPre}>
      {JSON.stringify(value, null, 2)}
    </pre>
  )
}

function ChangesDrawer({
  log,
  onClose,
}: {
  log: AuditLog
  onClose: () => void
}) {
  return (
    <div className={styles.drawerBackdrop} onClick={onClose}>
      <div
        className={styles.drawer}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.drawerHeader}>
          <h3 className={styles.drawerTitle}>Audit Details</h3>

          <button
            className={styles.drawerClose}
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className={styles.drawerContent}>
          <div className={styles.drawerRow}>
            <span className={styles.drawerLabel}>Log ID</span>
            <span className={styles.mono}>{log.id}</span>
          </div>

          <div className={styles.drawerRow}>
            <span className={styles.drawerLabel}>Action</span>

            <span
              className={styles.actionBadge}
              style={{
                color: getActionColor(log.action),
              }}
            >
              {log.action}
            </span>
          </div>

          <div className={styles.drawerRow}>
            <span className={styles.drawerLabel}>Entity Type</span>
            <span>{log.entityType ?? '—'}</span>
          </div>

          <div className={styles.drawerRow}>
            <span className={styles.drawerLabel}>Entity ID</span>

            <span className={styles.mono}>
              {log.entityId ?? '—'}
            </span>
          </div>

          <div className={styles.drawerRow}>
            <span className={styles.drawerLabel}>User ID</span>

            <span className={styles.mono}>
              {log.userId ?? 'System'}
            </span>
          </div>

          <div className={styles.drawerRow}>
            <span className={styles.drawerLabel}>IP Address</span>
            <span>{log.ipAddress ?? '—'}</span>
          </div>

          <div className={styles.drawerRow}>
            <span className={styles.drawerLabel}>Timestamp</span>

            <span>
              {new Date(log.createdAt).toLocaleString()}
            </span>
          </div>

          {log.note && (
            <div className={styles.changesBlock}>
              <div className={styles.changesTitle}>Note</div>

              <div className={styles.noteBlock}>
                {log.note}
              </div>
            </div>
          )}

          <div className={styles.changesBlock}>
            <div className={styles.changesTitle}>
              Old Value
            </div>

            <JsonBlock value={log.oldValue} />
          </div>

          <div className={styles.changesBlock}>
            <div className={styles.changesTitle}>
              New Value
            </div>

            <JsonBlock value={log.newValue} />
          </div>
        </div>
      </div>
    </div>
  )
}

const ACTION_COLORS: Record<string, string> = {
  CREATE: '#4ade80',
  UPDATE: '#f59e0b',
  DELETE: '#ef4444',
  LOGIN: '#3b82f6',
  LOGOUT: '#94a3b8',
}

function getActionColor(action: string) {
  const key = Object.keys(ACTION_COLORS).find((k) =>
    action.toUpperCase().includes(k)
  )

  return key
    ? ACTION_COLORS[key]
    : 'var(--text-secondary)'
}

export default function AdminAuditPage() {
  const [userFilter, setUserFilter] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [entityFilter, setEntityFilter] = useState('')

  const [viewing, setViewing] =
    useState<AuditLog | null>(null)

  const { page, limit, next, prev, reset } =
    usePagination({
      initialLimit: 20,
    })

  const { data, isLoading, isFetching } =
    useAuditLogs({
      page,
      limit,
      userId: userFilter || undefined,
      action: actionFilter || undefined,
      entityType: entityFilter || undefined,
    })

  const logs = data?.data ?? []
  const totalPages = data?.totalPages ?? 1

  function handleFilterChange(
    setter: (v: string) => void
  ) {
    return (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement
      >
    ) => {
      setter(e.target.value)
      reset()
    }
  }

  return (
    <DashboardShell>
      <PageHeader
        title="Audit Logs"
        subtitle={`${data?.total ?? 0} total events`}
      />

      <SectionCard>
        <div className={styles.filterRow}>
          <div className={styles.filterField}>
            <label className={styles.filterLabel}>
              User ID
            </label>

            <input
              className="input"
              placeholder="Filter by user ID..."
              value={userFilter}
              onChange={handleFilterChange(setUserFilter)}
            />
          </div>

          <div className={styles.filterField}>
            <label className={styles.filterLabel}>
              Action
            </label>

            <input
              className="input"
              placeholder="CREATE, UPDATE..."
              value={actionFilter}
              onChange={handleFilterChange(setActionFilter)}
            />
          </div>

          <div className={styles.filterField}>
            <label className={styles.filterLabel}>
              Entity
            </label>

            <input
              className="input"
              placeholder="doctor, booking..."
              value={entityFilter}
              onChange={handleFilterChange(setEntityFilter)}
            />
          </div>

          {(userFilter ||
            actionFilter ||
            entityFilter) && (
            <button
              className="btn btn-danger"
              style={{
                marginTop: 20,
                padding: '8px 16px',
                alignSelf: 'flex-end',
              }}
              onClick={() => {
                setUserFilter('')
                setActionFilter('')
                setEntityFilter('')
                reset()
              }}
            >
              Clear
            </button>
          )}
        </div>
      </SectionCard>

      <SectionCard noPad>
        {isFetching && !isLoading && (
          <div className={styles.updatingBar}>
            Refreshing...
          </div>
        )}

        {isLoading ? (
          <div className={styles.center}>
            <Spinner />
          </div>
        ) : logs.length === 0 ? (
          <EmptyState
            icon="◉"
            title="No audit logs found"
            description="Try adjusting your filters."
          />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>User ID</th>
                  <th>IP Address</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td
                      style={{
                        fontSize: 12,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {new Date(
                        log.createdAt
                      ).toLocaleString()}
                    </td>

                    <td>
                      <span
                        className={styles.actionBadge}
                        style={{
                          color: getActionColor(
                            log.action
                          ),
                        }}
                      >
                        {log.action}
                      </span>
                    </td>

                    <td
                      style={{
                        textTransform: 'capitalize',
                      }}
                    >
                      {log.entityType ?? '—'}
                    </td>

                    <td>
                      <span className={styles.mono}>
                        {log.userId ?? 'System'}
                      </span>
                    </td>

                    <td>
                      {log.ipAddress ?? '—'}
                    </td>

                    <td>
                      <button
                        className="btn btn-secondary"
                        style={{
                          fontSize: 12,
                          padding: '4px 10px',
                        }}
                        onClick={() => setViewing(log)}
                      >
                        View
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
            <button
              className="btn btn-secondary"
              disabled={page === 1}
              onClick={prev}
            >
              ← Prev
            </button>

            <span className={styles.pageInfo}>
              Page {page} of {totalPages}
            </span>

            <button
              className="btn btn-secondary"
              disabled={page === totalPages}
              onClick={next}
            >
              Next →
            </button>
          </div>
        )}
      </SectionCard>

      {viewing && (
        <ChangesDrawer
          log={viewing}
          onClose={() => setViewing(null)}
        />
      )}
    </DashboardShell>
  )
}