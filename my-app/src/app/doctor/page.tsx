'use client'

import { useState } from 'react'
import DashboardHead from '@/components/layout/DashBoardHead'
import {
  PageHeader, StatCard, SectionCard, StatusBadge,
  Spinner, EmptyState, ConfirmModal,
} from '@/components/ui/Ui'
import { useMyDoctorProfile } from '@/hooks/useDoctor'
import { useDoctorTimeSlots, useCreateTimeSlot, useDeleteTimeSlot } from '@/hooks/useTimeSlot'
import { useMe } from '@/hooks/useUser'
import type { CreateTimeSlotPayload, Doctor } from '@/types'
import styles from '@/components/ui/Ui.module.css'
import { DoctorEditModal } from './components/editDoctor'

// ─── Add Slot Form ────────────────────────────────────────────

function AddSlotForm({ doctorId, onClose }: { doctorId: string; onClose: () => void }) {
  const [startsAt, setStartsAt] = useState('')
  const [endsAt,   setEndsAt]   = useState('')
  const create = useCreateTimeSlot()

  function handleSubmit() {
    if (!startsAt || !endsAt) return
    create.mutate({ doctorId, startsAt, endsAt } as CreateTimeSlotPayload, { onSuccess: onClose })
  }

  return (
    <div className={styles.modalBackdrop}>
      <div className={`card ${styles.modal}`}>
        <h3 className={styles.modalTitle}>Add Availability Slot</h3>

        <div className={styles.field}>
          <label className={styles.label}>Starts At</label>
          <input className="input" type="datetime-local" value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)} />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Ends At</label>
          <input className="input" type="datetime-local" value={endsAt}
            onChange={(e) => setEndsAt(e.target.value)} />
        </div>

        <div className={styles.modalActions}>
          <button className="btn btn-secondary" onClick={onClose} disabled={create.isPending}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={create.isPending}>
            {create.isPending ? '…' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────

export default function DoctorDashboardPage() {
  const [showAddSlot, setShowAddSlot]   = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; doctorId: string } | null>(null)

  const { data: me }      = useMe()
  const { data: profile } = useMyDoctorProfile()
  const { data: slots, isLoading: loadingSlots } = useDoctorTimeSlots(profile?.id ?? '')
  const deleteSlot = useDeleteTimeSlot()

  const availableSlots = slots?.filter((s) => !s.isBooked) ?? []
  const bookedSlots    = slots?.filter((s) =>  s.isBooked) ?? []

  const [openEdit, setOpenEdit] = useState(false)


  return (
    <DashboardHead>
      {/* ── Stats ── */}
      <div className={styles.statsGrid}>
        <StatCard
          label="Total Slots"
          value={slots?.length ?? '—'}
          icon="◷"
          accent="primary"
        />
        <StatCard
          label="Available"
          value={availableSlots.length}
          icon="○"
          accent="neutral"
          sub="Ready to book"
        />
        <StatCard
          label="Booked"
          value={bookedSlots.length}
          icon="●"
          accent="warning"
          sub="Confirmed appointments"
        />
      </div>

      {/* ── Profile card ── */}
      {profile && (
        <SectionCard title="My Profile">
          <div className={styles.profileGrid}>
            <div>
              <div className={styles.profileLabel}>Doctor</div>
              <div className={styles.profileValue}>{me?.firstName} { me?.lastName}</div>
            </div>
            <div>
              <div className={styles.profileLabel}>Specialty</div>
              <div className={styles.profileValue}>{profile.specialty}</div>
            </div>
            <div>
              <div className={styles.profileLabel}>Email</div>
              <div className={styles.profileValue}>{me?.email}</div>
            </div>
            {me?.phone && 
            (<div>
              <div className={styles.profileLabel}>Phone</div>
              <div className={styles.profileValue}>{me?.phone}</div>
            </div>)}
            {me?.address && 
            (<div>
              <div className={styles.profileLabel}>Address</div>
              <div className={styles.profileValue}>{me?.address}</div>
            </div>)}
            {profile.bio && (
              <div>
                <div className={styles.profileLabel}>Bio</div>
                <div className={styles.profileValue}>{profile.bio}</div>
              </div>
            )}
            <div>
              <div className={styles.profileLabel}>Doctor ID</div>
              <div className={styles.profileId}>{profile.id}</div>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"center"}}>
            <button className='btn btn-secondary' onClick={() => setOpenEdit(true)}>Edit</button>
          </div>
        </SectionCard>
        
      )}

      {/* ── Slots table ── */}
      <SectionCard title="My Time Slots" noPad>
        {loadingSlots ? (
          <div className={styles.center}><Spinner /></div>
        ) : !slots?.length ? (
          <EmptyState
            icon="◷"
            title="No slots yet"
            description="Add your first availability slot."
            action={
              profile && (
                <button className="btn btn-primary" onClick={() => setShowAddSlot(true)}>
                  + Add Slot
                </button>
              )
            }
          />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Starts</th>
                  <th>Ends</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {slots.map((s) => (
                  <tr key={s.id}>
                    <td>
                      {new Date(s.startsAt).toLocaleString()}
                    </td>
                    <td>
                      {new Date(s.endsAt).toLocaleString()}
                    </td>
                    <td>
                      <span className={s.isBooked ? styles.booked : styles.available}>
                        {s.isBooked ? '● Booked' : '○ Available'}
                      </span>
                    </td>
                    <td >
                      {(!s.isBooked && profile)?  (
                        <span
                          style={{padding:0,width:'60%'}}
                          className='btn btn-danger'
                          onClick={() => setDeleteTarget({ id: s.id, doctorId: profile.id })}
                        >
                          Remove
                        </span>
                      ) : <span>None</span>
                    
                    }
                    </td>
                  </tr>
                ))}
                <tr>
                  <td>
                    <button style={{padding:"5px"}} onClick={() => setShowAddSlot(true)} className='btn btn-secondary'>
                      Add new Slot
                      </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* ── Modals ── */}
      {showAddSlot && profile && (
        <AddSlotForm doctorId={profile.id} onClose={() => setShowAddSlot(false)} />
      )}

      {deleteTarget && (
        <ConfirmModal
          title="Remove Slot"
          description="This will permanently delete this availability slot."
          confirmLabel="Remove"
          variant="danger"
          loading={deleteSlot.isPending}
          onConfirm={() =>
            deleteSlot.mutate(deleteTarget, { onSettled: () => setDeleteTarget(null) })
          }
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      

    <DoctorEditModal
      doctor={{...profile,user:me,} as Doctor}
      open={openEdit}
      onClose={() => setOpenEdit(false)}
    />
    </DashboardHead>
  )
}