'use client'

import { useState } from 'react'
import DashboardShell from '@/components/layout/DashboardShell'
import {
  PageHeader, SectionCard,
  Spinner, EmptyState, ConfirmModal,
} from '@/components/ui/Ui'
import {
  useDoctors, useCreateDoctor, useUpdateDoctor, useDeleteDoctor,
} from '@/hooks/useDoctor'
import { useUsers } from '@/hooks/useUser'
import type { Doctor, CreateDoctorPayload, UpdateDoctorPayload } from '@/types'
import styles from './doctors.module.css'

// ─── Create / Edit form ───────────────────────────────────────

interface DoctorFormProps {
  initial?: Doctor
  onClose: () => void
}

function DoctorForm({ initial, onClose }: DoctorFormProps) {
  const [userId,    setUserId]    = useState(initial?.userId    ?? '')
  const [specialty, setSpecialty] = useState(initial?.specialty ?? '')
  const [bio,       setBio]       = useState(initial?.bio       ?? '')

  const { data: usersData } = useUsers({ limit: 100 })
  const create = useCreateDoctor()
  const update = useUpdateDoctor(initial?.id ?? '')

  const isPending = create.isPending || update.isPending

  function handleSubmit() {
    if (initial) {
      const payload: UpdateDoctorPayload = {}
      if (specialty) payload.specialty = specialty
      if (bio)       payload.bio       = bio
      update.mutate(payload, { onSuccess: onClose })
    } else {
      if (!userId || !specialty) return
      create.mutate({ userId, specialty, bio } as CreateDoctorPayload, { onSuccess: onClose })
    }
  }

  return (
    <div className={styles.modalBackdrop}>
      <div className={`card ${styles.formModal}`}>
        <h3 className={styles.formTitle}>{initial ? 'Edit Doctor' : 'Add Doctor'}</h3>

        {!initial && (
          <div className={styles.field}>
            <label className={styles.label}>User</label>
            <select
              className="input"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            >
              <option value="">Select a user…</option>
              {usersData?.data?.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.firstName} {u.lastName} — {u.email}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className={styles.field}>
          <label className={styles.label}>Specialty</label>
          <input
            className="input"
            placeholder="e.g. Cardiology"
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Bio <span style={{ color: 'var(--text-tertiary)' }}>(optional)</span></label>
          <textarea
            className="input"
            placeholder="Short professional bio…"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            style={{ resize: 'vertical' }}
          />
        </div>

        <div className={styles.formActions}>
          <button className="btn btn-secondary" onClick={onClose} disabled={isPending}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={isPending}>
            {isPending ? '…' : initial ? 'Save Changes' : 'Add Doctor'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────

export default function AdminDoctorsPage() {
  const [search, setSearch]           = useState('')
  const [page, setPage]               = useState(1)
  const [showForm, setShowForm]       = useState(false)
  const [editing, setEditing]         = useState<Doctor | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const { data, isLoading, isFetching } = useDoctors({ page, limit: 20, search: search || undefined })
  const deleteDoctor = useDeleteDoctor(deleteTarget ?? '')

  const doctors    = data?.data ?? []
  const totalPages = data?.totalPages ?? 1

  return (
    <DashboardShell>
      <PageHeader
        title="Doctors"
        subtitle={`${data?.total ?? 0} registered doctors`}
        action={
          <button className="btn btn-primary" onClick={() => { setEditing(null); setShowForm(true) }}>
            + Add Doctor
          </button>
        }
      />

      <SectionCard noPad>
        <div className={styles.toolbar}>
          <input
            className="input"
            placeholder="Search by specialty…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            style={{ maxWidth: 300 }}
          />
          {isFetching && !isLoading && (
            <span style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>Updating…</span>
          )}
        </div>

        {isLoading ? (
          <div className={styles.center}><Spinner /></div>
        ) : doctors.length === 0 ? (
          <EmptyState
            icon="✦"
            title="No doctors found"
            description="Add a doctor to get started."
            action={
              <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                + Add Doctor
              </button>
            }
          />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Doctor</th>
                  <th>Specialty</th>
                  <th>Bio</th>
                  <th>Joined</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {doctors.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <div className={styles.doctorCell}>
                        <div className={styles.avatarSmall}>
                          {d.user?.firstName?.[0]}{d.user?.lastName?.[0]}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>
                            {d.user?.firstName} {d.user?.lastName}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                            {d.user?.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ color: 'var(--colorA-900)', fontSize: 13, fontWeight: 600 }}>
                      {d.specialty}
                    </td>
                    <td style={{ color: 'var(--text-tertiary)', fontSize: 13, maxWidth: 220 }}>
                      <div className={styles.bioClamp}>{d.bio ?? '—'}</div>
                    </td>
                    <td style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>
                      {new Date(d.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <button
                          className="btn btn-secondary"
                          style={{ fontSize: 12, padding: '5px 10px' }}
                          onClick={() => { setEditing(d); setShowForm(true) }}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-danger"
                          style={{ fontSize: 12, padding: '5px 10px' }}
                          onClick={() => setDeleteTarget(d.id)}
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

        {totalPages > 1 && (
          <div className={styles.pagination}>
            <button className="btn btn-secondary" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
              ← Prev
            </button>
            <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
              Page {page} of {totalPages}
            </span>
            <button className="btn btn-secondary" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
              Next →
            </button>
          </div>
        )}
      </SectionCard>

      {/* ── Form Modal ── */}
      {showForm && (
        <DoctorForm
          initial={editing ?? undefined}
          onClose={() => { setShowForm(false); setEditing(null) }}
        />
      )}

      {/* ── Delete Confirm ── */}
      {deleteTarget && (
        <ConfirmModal
          title="Delete Doctor"
          description="This will remove the doctor profile. The user account will remain. This cannot be undone."
          confirmLabel="Delete"
          variant="danger"
          loading={deleteDoctor.isPending}
          onConfirm={() => deleteDoctor.mutate(undefined, { onSettled: () => setDeleteTarget(null) })}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </DashboardShell>
  )
}