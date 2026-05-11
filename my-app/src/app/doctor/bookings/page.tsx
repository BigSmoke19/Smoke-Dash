'use client'

import { useState } from 'react'
import DashboardHead from '@/components/layout/DashBoardHead'
import {
  PageHeader, SectionCard, StatusBadge,
  Spinner, EmptyState, ConfirmModal,
} from '@/components/ui/Ui'
import {
  useDoctorBookings,
  useUpdateBookingStatus,
} from '@/hooks/useBooking'
import type { Booking, BookingStatus } from '@/types'
import styles from './bookings.module.css'

// ─── Filter tabs ──────────────────────────────────────────────

const STATUS_FILTERS: { label: string; value: string }[] = [
  { label: 'All',       value: ''          },
  { label: 'Pending',   value: 'PENDING'   },
  { label: 'Confirmed', value: 'CONFIRMED' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Cancelled', value: 'CANCELLED' },
  { label: 'No-Show',   value: 'NO_SHOW'   },
]

// ─── Action menu ──────────────────────────────────────────────

interface BookingActionsProps {
  booking: Booking
  onAccept:   (id: string) => void
  onReject:   (id: string) => void
  onComplete: (id: string) => void
  onNoShow:   (id: string) => void
  loading: boolean
}

function BookingActions({ booking, onAccept, onReject, onComplete, onNoShow, loading }: BookingActionsProps) {
  const { status, id } = booking
  return (
    <div className={styles.actionGroup}>
      {status === 'PENDING' && (
        <>
          <button
            className="btn btn-primary"
            style={{ fontSize: 12, padding: '4px 10px' }}
            onClick={() => onAccept(id)}
            disabled={loading}
          >
            ✓ Accept
          </button>
          <button
            className="btn btn-danger"
            style={{ fontSize: 12, padding: '4px 10px' }}
            onClick={() => onReject(id)}
            disabled={loading}
          >
            ✗ Reject
          </button>
        </>
      )}
      {status === 'CONFIRMED' && (
        <>
          <button
            className="btn btn-secondary"
            style={{ fontSize: 12, padding: '4px 10px' }}
            onClick={() => onComplete(id)}
            disabled={loading}
          >
            ◉ Complete
          </button>
          <button
            className="btn btn-warning"
            style={{ fontSize: 12, padding: '4px 10px' }}
            onClick={() => onNoShow(id)}
            disabled={loading}
          >
            ◌ No-Show
          </button>
        </>
      )}
      {(status === 'COMPLETED' || status === 'CANCELLED' || status === 'NO_SHOW') && (
        <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>—</span>
      )}
    </div>
  )
}

// ─── Patient info drawer ──────────────────────────────────────

function PatientDrawer({ booking, onClose }: { booking: Booking; onClose: () => void }) {
  const u = booking.user
  if (!u) return null
  return (
    <div className={styles.drawerBackdrop} onClick={onClose}>
      <div className={styles.drawer} onClick={(e) => e.stopPropagation()}>
        <div className={styles.drawerHeader}>
          <h3 className={styles.drawerTitle}>Patient Info</h3>
          <button className={styles.drawerClose} onClick={onClose}>✕</button>
        </div>
        <div className={styles.drawerAvatar}>
          {u.firstName?.[0]}{u.lastName?.[0]}
        </div>
        <div className={styles.drawerName}>{u.firstName} {u.lastName}</div>
        <div className={styles.drawerEmail}>{u.email}</div>
        <div className={styles.drawerDivider} />
        <div className={styles.drawerRow}>
          <span className={styles.drawerLabel}>Booking ID</span>
          <span className={styles.drawerMono}>{booking.id.slice(0, 8)}…</span>
        </div>
        <div className={styles.drawerRow}>
          <span className={styles.drawerLabel}>Status</span>
          <StatusBadge status={booking.status} />
        </div>
        {booking.slot && (
          <>
            <div className={styles.drawerRow}>
              <span className={styles.drawerLabel}>Scheduled</span>
              <span>{new Date(booking.slot.startsAt).toLocaleString()}</span>
            </div>
            <div className={styles.drawerRow}>
              <span className={styles.drawerLabel}>Ends</span>
              <span>{new Date(booking.slot.endsAt).toLocaleString()}</span>
            </div>
          </>
        )}
        <div className={styles.drawerRow}>
          <span className={styles.drawerLabel}>Booked on</span>
          <span>{new Date(booking.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────

export default function DoctorBookingsPage() {
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage]                 = useState(1)
  const [viewing, setViewing]           = useState<Booking | null>(null)
  const [rejectTarget, setRejectTarget] = useState<{id: string, status: BookingStatus} | null>(null)

  const { data, isLoading, isFetching } = useDoctorBookings({
    page,
    limit: 20,
    status: statusFilter || undefined,
  })

  const updateStatus   = useUpdateBookingStatus()
  const bookingStatuses:  Record<string,BookingStatus> =
    {"pending":"PENDING" , "confirmed":"CONFIRMED" , "cancelled":"CANCELLED" , "completed":"COMPLETED" , "noShow":"NO_SHOW"} 

  const bookings   = data?.data ?? []
  const totalPages = data?.totalPages ?? 1
  const anyPending = (data as any)?.isPending

  const isMutating =
    updateStatus.isPending 

  return (
    <DashboardHead>
      <PageHeader
        title="Bookings"
        subtitle={`${data?.total ?? 0} total appointments`}
      />

      {/* ── Filter tabs ── */}
      <div className={styles.filterBar}>
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            className={`${styles.filterTab} ${statusFilter === f.value ? styles.filterTabActive : ''}`}
            onClick={() => { setStatusFilter(f.value); setPage(1) }}
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
          <EmptyState
            icon="◈"
            title="No bookings found"
            description={statusFilter ? `No ${statusFilter.toLowerCase()} bookings.` : 'Your booking list is empty.'}
          />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Date & Time</th>
                  <th>Status</th>
                  <th>Booked On</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id}>
                    <td>
                      <button
                        className={styles.patientBtn}
                        onClick={() => setViewing(b)}
                      >
                        <div className={styles.avatarSmall}>
                          {b.user?.firstName?.[0]}{b.user?.lastName?.[0]}
                        </div>
                        <span>{b.user?.firstName} {b.user?.lastName}</span>
                      </button>
                    </td>
                    <td style={{ fontSize: 13 }}>
                      {b.slot
                        ? new Date(b.slot.startsAt).toLocaleString(undefined, {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })
                        : '—'}
                    </td>
                    <td><StatusBadge status={b.status} /></td>
                    <td style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>
                      {new Date(b.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <BookingActions
                        booking={b}
                        onAccept={(id) => updateStatus.mutate({id: id,status: bookingStatuses.confirmed})}
                        onReject={(id) => setRejectTarget({id: id,status: bookingStatuses.cancelled})}
                        onComplete={(id) => updateStatus.mutate({id: id,status: bookingStatuses.completed})}
                        onNoShow={(id) => updateStatus.mutate({id: id,status: bookingStatuses.noShow})}
                        loading={isMutating}
                      />
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

      {/* ── Reject confirm ── */}
      {rejectTarget && (
        <ConfirmModal
          title="Reject Booking"
          description="This will cancel the booking and notify the patient."
          confirmLabel="Reject"
          variant="danger"
          loading={updateStatus.isPending}
          onConfirm={() =>
            updateStatus.mutate(rejectTarget, { onSettled: () => setRejectTarget(null) })
          }
          onCancel={() => setRejectTarget(null)}
        />
      )}

      {/* ── Patient drawer ── */}
      {viewing && (
        <PatientDrawer booking={viewing} onClose={() => setViewing(null)} />
      )}
    </DashboardHead>
  )
}