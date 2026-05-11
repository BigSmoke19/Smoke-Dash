'use client'

import { useState } from 'react'
import DashboardShell from '@/components/layout/DashboardShell'
import {
  PageHeader, SectionCard, Spinner, EmptyState, ConfirmModal,
} from '@/components/ui/Ui'
import { useDoctors } from '@/hooks/useDoctor'
import { useDoctorTimeSlots, useCreateTimeSlot, useDeleteTimeSlot } from '@/hooks/useTimeSlot'
import type { CreateTimeSlotPayload } from '@/types'
import styles from './timeslots.module.css'

// ─── Create form ──────────────────────────────────────────────

interface SlotFormProps {
  doctorId: string
  onClose: () => void
}

function SlotForm({ doctorId, onClose }: SlotFormProps) {
  const [startsAt, setStartsAt] = useState('')
  const [endsAt,   setEndsAt]   = useState('')
  const create = useCreateTimeSlot()

  function handleSubmit() {
    if (!startsAt || !endsAt) return
    const payload: CreateTimeSlotPayload = { doctorId, startsAt, endsAt }
    create.mutate(payload, { onSuccess: onClose })
  }

  return (
    <div className={styles.modalBackdrop}>
      <div className={`card ${styles.formModal}`}>
        <h3 className={styles.formTitle}>Add Time Slot</h3>

        <div className={styles.field}>
          <label className={styles.label}>Starts At</label>
          <input
            className="input"
            type="datetime-local"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Ends At</label>
          <input
            className="input"
            type="datetime-local"
            value={endsAt}
            onChange={(e) => setEndsAt(e.target.value)}
          />
        </div>

        <div className={styles.formActions}>
          <button className="btn btn-secondary" onClick={onClose} disabled={create.isPending}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={create.isPending}>
            {create.isPending ? '…' : 'Create Slot'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Slots table for a doctor ─────────────────────────────────

function DoctorSlots({ doctorId }: { doctorId: string }) {
  const [showForm, setShowForm]         = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; doctorId: string } | null>(null)

  const { data: slots, isLoading }  = useDoctorTimeSlots(doctorId)
  const deleteSlot = useDeleteTimeSlot()

  return (
    <div>
      <div className={styles.slotActions}>
        <button className="btn btn-primary" style={{ fontSize: 13 }} onClick={() => setShowForm(true)}>
          + Add Slot
        </button>
      </div>

      {isLoading ? (
        <div className={styles.center}><Spinner size="sm" /></div>
      ) : !slots?.length ? (
        <EmptyState icon="◷" title="No slots yet" description="Add a time slot for this doctor." />
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Starts</th>
                <th>Ends</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {slots.map((s) => (
                <tr key={s.id}>
                  <td style={{ fontSize: 13 }}>
                    {new Date(s.startsAt).toLocaleString()}
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
                    {new Date(s.endsAt).toLocaleString()}
                  </td>
                  <td>
                    <span className={s.isBooked ? styles.booked : styles.available}>
                      {s.isBooked ? '● Booked' : '○ Available'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {!s.isBooked && (
                      <button
                        className="btn btn-danger"
                        style={{ fontSize: 12, padding: '4px 10px' }}
                        onClick={() => setDeleteTarget({ id: s.id, doctorId })}
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && <SlotForm doctorId={doctorId} onClose={() => setShowForm(false)} />}

      {deleteTarget && (
        <ConfirmModal
          title="Delete Time Slot"
          description="This will remove the time slot. If it is already booked this action will fail."
          confirmLabel="Delete"
          variant="danger"
          loading={deleteSlot.isPending}
          onConfirm={() =>
            deleteSlot.mutate(deleteTarget, { onSettled: () => setDeleteTarget(null) })
          }
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────

export default function AdminTimeSlotsPage() {
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('')
  const { data: doctorsData, isLoading: loadingDoctors } = useDoctors({ limit: 100 })
  const doctors = doctorsData?.data ?? []

  return (
    <DashboardShell>
      <PageHeader
        title="Time Slots"
        subtitle="Manage availability slots per doctor"
      />

      {/* ── Doctor selector ── */}
      <SectionCard title="Select Doctor">
        {loadingDoctors ? (
          <Spinner size="sm" />
        ) : doctors.length === 0 ? (
          <EmptyState icon="✦" title="No doctors found" description="Add a doctor first." />
        ) : (
          <div className={styles.doctorPicker}>
            {doctors.map((d) => (
              <button
                key={d.id}
                className={`${styles.doctorChip} ${selectedDoctorId === d.id ? styles.doctorChipActive : ''}`}
                onClick={() => setSelectedDoctorId(d.id)}
              >
                <div className={styles.chipAvatar}>
                  {d.user?.firstName?.[0]}{d.user?.lastName?.[0]}
                </div>
                <div>
                  <div className={styles.chipName}>
                    {d.user?.firstName} {d.user?.lastName}
                  </div>
                  <div className={styles.chipSpec}>{d.specialty}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </SectionCard>

      {/* ── Slots for selected doctor ── */}
      {selectedDoctorId && (
        <SectionCard
          title={`Slots — ${doctors.find((d) => d.id === selectedDoctorId)?.user?.firstName} ${doctors.find((d) => d.id === selectedDoctorId)?.user?.lastName}`}
          noPad
        >
          <DoctorSlots doctorId={selectedDoctorId} />
        </SectionCard>
      )}
    </DashboardShell>
  )
}