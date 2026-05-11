'use client'

import { useState } from 'react'
import DashboardHead from '@/components/layout/DashBoardHead'
import {
  PageHeader, SectionCard, StatCard,
  Spinner, EmptyState, ConfirmModal, StatusBadge,
} from '@/components/ui/Ui'
import { useDoctors } from '@/hooks/useDoctor'
import { useDoctorTimeSlots } from '@/hooks/useTimeSlot'
import { useMyBookings, useUpdateBookingStatus, useCreateBooking,useDeleteBooking } from '@/hooks/useBooking'
import { useMe } from '@/hooks/useUser'
import type { BookingStatus, Doctor, TimeSlot } from '@/types'
import styles from '@/components/ui/Ui.module.css'
import pageStyles from './page.module.css'
// ─── Book slot modal ──────────────────────────────────────────

function BookSlotModal({
  doctor,
  onClose,
}: {
  doctor: Doctor
  onClose: () => void
}) {
  const { data: timeslots, isLoading } = useDoctorTimeSlots(doctor.id)

  const createBooking = useCreateBooking()

  const available = timeslots?.filter((s) => !s.isBooked) ?? []

  function handleBook(slot: TimeSlot) {
    createBooking.mutate(slot.id, { onSuccess: onClose })
  }

  return (
    <div className={pageStyles.modalBackdrop}>

      <div className={`card ${pageStyles.bookModal}`}>

        {/* HEADER */}
        <div className={pageStyles.bookModalHeader}>

          <div className={pageStyles.bookDoctorInfo}>

            <div className={pageStyles.bookDoctorAvatar}>
              {doctor.user?.firstName?.[0]}
              {doctor.user?.lastName?.[0]}
            </div>

            <div>
              <h3 className={pageStyles.bookModalTitle}>
                Dr. {doctor.user?.firstName} {doctor.user?.lastName}
              </h3>

              <p className={pageStyles.bookModalSub}>
                {doctor.specialty}
              </p>
            </div>

          </div>

        </div>

        {/* CONTENT */}
        <div className={pageStyles.bookModalBody}>

          {isLoading ? (
            <div className={pageStyles.center}>
              <Spinner />
            </div>
          ) : available.length === 0 ? (
            <EmptyState
              icon="◷"
              title="No available slots"
              description="This doctor has no open slots right now."
            />
          ) : (
            <div className={pageStyles.slotGrid}>

              {available.map((slot) => (
                <button
                  key={slot.id}
                  className={pageStyles.slotBtn}
                  onClick={() => handleBook(slot)}
                  disabled={createBooking.isPending}
                >

                  <div className={pageStyles.slotDate}>
                    {new Date(slot.startsAt).toLocaleDateString(undefined, {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </div>

                  <div className={pageStyles.slotTime}>
                    {new Date(slot.startsAt).toLocaleTimeString(undefined, {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}

                    {" — "}

                    {new Date(slot.endsAt).toLocaleTimeString(undefined, {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>

                </button>
              ))}

            </div>
          )}

        </div>

        {/* FOOTER */}
        <div  className={pageStyles.bookModalFooter}>
          <button
            className="btn btn-secondary"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>

      </div>

    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────

export default function UserDashboardPage() {
  const [search, setSearch]         = useState('')
  const [bookingDoctor, setBookingDoctor] = useState<Doctor | null>(null)
  const [cancelTarget, setCancelTarget]   = useState<{id: string,status: BookingStatus} | null>(null)
  const [deleteTarget, setDeleteTarget]   = useState<{id: string}| null>(null)

  const { data: me }                         = useMe()
  const { data: doctorsData, isLoading: loadingDoctors } = useDoctors({ search: search || undefined, limit: 20 })
  const { data: myBookings, isLoading: loadingBookings } = useMyBookings()
  const cancelBooking = useUpdateBookingStatus()
  const deleteBooking = useDeleteBooking()

  const upcomingBookings = myBookings?.filter(
    (b) => b.status === 'PENDING' || b.status === 'CONFIRMED'
  ) ?? []


  return (
    <DashboardHead>
      <PageHeader
        title={`Welcome back, ${me?.firstName ?? '…'}`}
        subtitle="Find a doctor and manage your appointments"
      />

      {/* ── Stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16, marginBottom: 28 }}>
        <StatCard
          label="Upcoming"
          value={upcomingBookings.length}
          icon="◷"
          accent="primary"
        />
        <StatCard
          label="Total Bookings"
          value={myBookings?.length ?? '—'}
          icon="◈"
          accent="neutral"
        />
        <StatCard
          label="Available Doctors"
          value={doctorsData?.total ?? '—'}
          icon="✦"
          accent="warning"
        />
      </div>

      {/* ── Find a Doctor ── */}
      <SectionCard
        title="Find a Doctor"
        action={
          <input
            className="input"
            placeholder="Search specialty…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: 220, padding: '6px 12px', fontSize: 13 }}
          />
        }
      >
        {loadingDoctors ? (
          <div className={styles.center}><Spinner /></div>
        ) : (doctorsData?.data?.length ?? 0) === 0 ? (
          <EmptyState icon="✦" title="No doctors found" description="Try a different search." />
        ) : (
          <div className={styles.doctorsGrid}>
            <table className="table">
               <thead>
                <tr>
                  <th>Doctor</th>
                  <th>Specialty</th>
                  <th>Bio</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {doctorsData!.data.map((doctor) => (
                  <tr key={doctor.id}>

                    <td>
                      Dr. {doctor.user?.firstName} {doctor.user?.lastName}
                    </td>

                    <td>
                      {doctor.specialty}
                    </td>

                    <td>
                      {doctor.bio ? doctor.bio : "No bio"}
                    </td>

                    <td>
                      <span className={styles.available}>
                        ● Available
                      </span>
                    </td>

                    <td>
                      <button
                        className="btn btn-primary"
                        onClick={() => {setBookingDoctor(doctor)}}
                      >
                        Book Appointment
                      </button>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
            
          </div>
        )}
      </SectionCard>

      {/* ── My Bookings ── */}
      <SectionCard
        title="My Bookings"
        action={
          <input
            className="input"
            placeholder="Search Doctors"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: 220, padding: '6px 12px', fontSize: 13 }}
          />
        }
        noPad
      >
        {loadingBookings ? (
          <div className={styles.center} style={{ padding: 32 }}><Spinner /></div>
        ) : (myBookings?.length ?? 0) === 0 ? (
          <EmptyState
            icon="◈"
            title="No bookings yet"
            description="Book your first appointment above."
          />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Doctor</th>
                  <th>Date & Time</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(myBookings ?? []).slice(0, 8).map((b) => (
                  <tr key={b.id}>
                    <td style={{ fontWeight: 500 }}>
                      {b.slot?.doctor?.user?.firstName ?? '—'} {b.slot?.doctor?.user?.lastName ?? '—'}
                    </td>
                    <td style={{ fontSize: 13 }}>
                      {b.slot
                        ? new Date(b.slot.startsAt).toLocaleString(undefined, {
                            dateStyle: 'medium', timeStyle: 'short',
                          })
                        : '—'}
                    </td>
                    <td><StatusBadge status={b.status} /></td>
                    <td>
                      {(b.status === 'CONFIRMED') ? (
                        <button
                          className="btn btn-danger"
                          style={{ fontSize: 12, padding: '4px 10px' }}
                          onClick={() => setCancelTarget({id: b.id,status: "CANCELLED"})}
                        >
                          Cancel
                        </button>
                      ) :
                      (b.status === 'PENDING') ? (
                        <button
                          className="btn btn-danger"
                          style={{ fontSize: 12, padding: '4px 10px' }}
                          onClick={() => setDeleteTarget({id: b.id})}
                        >
                          Delete
                        </button>
                      ): (
                        <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* ── Book modal ── */}
      {bookingDoctor && (
        <BookSlotModal
          doctor={bookingDoctor}
          onClose={() => setBookingDoctor(null)}
        />
      )}

      {/* ── Cancel confirm ── */}
      {(cancelTarget) && (
        <ConfirmModal
          title="Cancel Booking"
          description="Are you sure you want to cancel this appointment?"
          confirmLabel="Cancel Booking"
          variant="danger"
          loading={cancelBooking.isPending}
          onConfirm={() =>
            cancelBooking.mutate(cancelTarget, { onSettled: () => setCancelTarget(null) })
          }
          onCancel={() => setCancelTarget(null)}
        />
      )}
      {(deleteTarget) && (
        <ConfirmModal
          title="Delete Booking"
          description="Are you sure you want to delete this appointment?"
          confirmLabel="delete Booking"
          variant="danger"
          loading={deleteBooking.isPending}
          onConfirm={() =>
            deleteBooking.mutate(deleteTarget, { onSettled: () => setDeleteTarget(null) })
          }
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </DashboardHead>
  )
}