'use client'

import { useState } from 'react'
import DashboardShell from '@/components/layout/DashboardShell'
import {
  PageHeader, SectionCard, StatusBadge,
  Spinner, EmptyState, ConfirmModal,
} from '@/components/ui/Ui'
import { useAllBookings, useUpdateBookingStatus } from '@/hooks/useBooking'
import { usePagination } from '@/hooks/usePagination'
import type { Booking, BookingStatus } from '@/types'
import styles from './bookings.module.css'

const STATUS_FILTERS = [
  { label: 'All',       value: '' },
  { label: 'Pending',   value: 'PENDING' },
  { label: 'Confirmed', value: 'CONFIRMED' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Cancelled', value: 'CANCELLED' },
  { label: 'No-Show',   value: 'NO_SHOW' },
]

function BookingDetailDrawer({ booking, onClose }: { booking: Booking; onClose: () => void }) {
  return (
    <div className={styles.drawerBackdrop} onClick={onClose}>
      <div className={styles.drawer} onClick={(e) => e.stopPropagation()}>
        <div className={styles.drawerHeader}>
          <h3 className={styles.drawerTitle}>Booking Details</h3>
          <button className={styles.drawerClose} onClick={onClose}>✕</button>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionLabel}>Patient</div>
          <div className={styles.drawerAvatar}>
            {booking.user?.firstName?.[0]}{booking.user?.lastName?.[0]}
          </div>
          <div className={styles.drawerName}>{booking.user?.firstName} {booking.user?.lastName}</div>
          <div className={styles.drawerEmail}>{booking.user?.email}</div>
        </div>

        <div className={styles.drawerDivider} />

        {[
          { label: 'Booking ID',  value: <span className={styles.mono}>{booking.id.slice(0,8)}…</span> },
          { label: 'Status',      value: <StatusBadge status={booking.status} /> },
          { label: 'Scheduled',   value: booking.slot ? new Date(booking.slot.startsAt).toLocaleString() : '—' },
          { label: 'Ends',        value: booking.slot ? new Date(booking.slot.endsAt).toLocaleString() : '—' },
          { label: 'Booked On',   value: new Date(booking.createdAt).toLocaleString() },
        ].map(({ label, value }) => (
          <div key={label} className={styles.drawerRow}>
            <span className={styles.drawerLabel}>{label}</span>
            <span>{value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AdminBookingsPage() {
  const [statusFilter, setStatusFilter] = useState('')
  const [viewing, setViewing]           = useState<Booking | null>(null)
  const [actionTarget, setActionTarget] = useState<{ id: string; status: BookingStatus; label: string } | null>(null)

  const { page, limit, next, prev, reset } = usePagination({ initialLimit: 20 })

  const { data, isLoading, isFetching } = useAllBookings({
    page, limit,
    status: statusFilter || undefined,
  })
  const updateStatus = useUpdateBookingStatus()

  const bookings   = data?.data ?? []
  const totalPages = data?.totalPages ?? 1

  return (
    <DashboardShell>
      <PageHeader
        title="All Bookings"
        subtitle={`${data?.total ?? 0} total bookings`}
      />

      {/* ── Filter tabs ── */}
      <div className={styles.filterBar}>
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            className={`${styles.filterTab} ${statusFilter === f.value ? styles.filterTabActive : ''}`}
            onClick={() => { setStatusFilter(f.value); reset() }}
          >
            {f.label}
          </button>
        ))}
        {isFetching && !isLoading && (
          <span className={styles.updating}>Updating…</span>
        )}
      </div>

      <SectionCard noPad>
        {isLoading ? (
          <div className={styles.center}><Spinner /></div>
        ) : bookings.length === 0 ? (
          <EmptyState icon="◈" title="No bookings found" description={statusFilter ? `No ${statusFilter.toLowerCase()} bookings.` : 'No bookings yet.'} />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Scheduled</th>
                  <th>Status</th>
                  <th>Booked On</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id}>
                    <td>
                      <button className={styles.patientBtn} onClick={() => setViewing(b)}>
                        <div className={styles.avatarSmall}>
                          {b.user?.firstName?.[0]}{b.user?.lastName?.[0]}
                        </div>
                        <span>{b.user?.firstName} {b.user?.lastName}</span>
                      </button>
                    </td>
                    <td style={{ fontSize: 13 }}>
                      {b.slot ? new Date(b.slot.startsAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—'}
                    </td>
                    <td><StatusBadge status={b.status} /></td>
                    <td style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>
                      {new Date(b.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <div className={styles.actionGroup}>
                        {b.status === 'PENDING' && (
                          <button
                            className="btn btn-primary"
                            style={{ fontSize: 12, padding: '4px 10px' }}
                            onClick={() => setActionTarget({ id: b.id, status: 'CONFIRMED', label: 'Confirm' })}
                          >
                            ✓ Confirm
                          </button>
                        )}
                        {(b.status === 'PENDING' || b.status === 'CONFIRMED') && (
                          <button
                            className="btn btn-danger"
                            style={{ fontSize: 12, padding: '4px 10px' }}
                            onClick={() => setActionTarget({ id: b.id, status: 'CANCELLED', label: 'Cancel' })}
                          >
                            ✗ Cancel
                          </button>
                        )}
                        {(b.status === 'CANCELLED' || b.status === 'COMPLETED' || b.status === 'NO_SHOW') && (
                          <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>—</span>
                        )}
                      </div>
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

      {viewing && <BookingDetailDrawer booking={viewing} onClose={() => setViewing(null)} />}

      {actionTarget && (
        <ConfirmModal
          title={`${actionTarget.label} Booking`}
          description={`This will force ${actionTarget.label.toLowerCase()} this booking.`}
          confirmLabel={actionTarget.label}
          variant={actionTarget.status === 'CANCELLED' ? 'danger' : 'warning'}
          loading={updateStatus.isPending}
          onConfirm={() =>
            updateStatus.mutate({ id: actionTarget.id, status: actionTarget.status }, {
              onSettled: () => setActionTarget(null),
            })
          }
          onCancel={() => setActionTarget(null)}
        />
      )}
    </DashboardShell>
  )
}