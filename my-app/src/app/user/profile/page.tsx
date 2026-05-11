'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import DashboardHead from '@/components/layout/DashBoardHead'
import {
  PageHeader, SectionCard, Spinner, StatCard,
} from '@/components/ui/Ui'
import { useMe, useUpdateProfile } from '@/hooks/useUser'
import { updateProfileSchema, type UpdateProfileFormData } from '@/lib/validators'
import { ROUTES } from '@/lib/constants'
import styles from './profile.module.css'
import uiStyles from '@/components/ui/Ui.module.css'

export default function ProfilePage() {
  const { data: user, isLoading } = useMe()
  const updateProfile             = useUpdateProfile()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<UpdateProfileFormData>({
    resolver: zodResolver(updateProfileSchema),
  })

  // Populate form once user loads
  useEffect(() => {
    if (user) {
      reset({
        firstName: user.firstName,
        lastName:  user.lastName,
        phone:     user.phone     ?? '',
        address:   user.address   ?? '',
      })
    }
  }, [user, reset])

  const onSubmit = (data: UpdateProfileFormData) => {
    updateProfile.mutate({
      ...data,
      phone:   data.phone   || undefined,
      address: data.address || undefined,
    })
  }

  if (isLoading) {
    return (
      
        <div className={styles.loadingCenter}><Spinner size="lg" /></div>
      
    )
  }

  return (
    <DashboardHead>
      <PageHeader
        title="My Profile"
        subtitle="Manage your personal information"
        action={
          <button onClick={()=>{}} className="btn btn-danger" style={{ fontSize: 13 }}>
            ◉ Reset Password
          </button>
        }
      />

      {/* ── Overview strip ── */}
      <div className={uiStyles.statsGrid} style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', marginBottom: 28 }}>
        <StatCard
          label="Account Role"
          value={user?.role ?? '—'}
          icon="⬡"
          accent="primary"
        />
        <StatCard
          label="Email"
          value={user?.emailVerified ? 'Verified' : 'Unverified'}
          icon="✦"
          accent={user?.emailVerified ? 'neutral' : 'danger'}
        />
        <StatCard
          label="Member since"
          value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—'}
          icon="◷"
          accent="neutral"
        />
      </div>

      <div className={styles.layout}>

        {/* ── Avatar + quick info ── */}
        <SectionCard title="Account">
          <div className={styles.avatarBlock}>
            <div className={styles.avatarLarge}>
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div className={styles.avatarMeta}>
              <div className={styles.avatarName}>
                {user?.firstName} {user?.lastName}
              </div>
              <div className={styles.avatarEmail}>{user?.email}</div>
              {user?.phone && (
                <div className={styles.avatarDetail}>☏ {user.phone}</div>
              )}
              {user?.address && (
                <div className={styles.avatarDetail}>⌖ {user.address}</div>
              )}
            </div>
          </div>
        </SectionCard>

        {/* ── Edit form ── */}
        <SectionCard
          title="Edit Profile"
          action={
            isDirty && (
              <span className={styles.unsavedBadge}>Unsaved changes</span>
            )
          }
        >
          <div className={styles.form}>

            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label}>First name</label>
                <input
                  {...register('firstName')}
                  className="input"
                  placeholder="John"
                />
                {errors.firstName && (
                  <span className={styles.error}>{errors.firstName.message}</span>
                )}
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Last name</label>
                <input
                  {...register('lastName')}
                  className="input"
                  placeholder="Doe"
                />
                {errors.lastName && (
                  <span className={styles.error}>{errors.lastName.message}</span>
                )}
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>
                Phone number
                <span className={styles.optional}>optional</span>
              </label>
              <input
                {...register('phone')}
                className="input"
                type="tel"
                placeholder="+1 555 000 0000"
              />
              {errors.phone && (
                <span className={styles.error}>{errors.phone.message}</span>
              )}
            </div>

            <div className={styles.field}>
              <label className={styles.label}>
                Address
                <span className={styles.optional}>optional</span>
              </label>
              <input
                {...register('address')}
                className="input"
                placeholder="123 Main St, City, Country"
              />
              {errors.address && (
                <span className={styles.error}>{errors.address.message}</span>
              )}
            </div>

            {/* Read-only fields */}
            <div className={styles.field}>
              <label className={styles.label}>Email address</label>
              <input
                className="input"
                value={user?.email ?? ''}
                readOnly
                disabled
                style={{ opacity: 0.5, cursor: 'not-allowed' }}
              />
              <span className={styles.hint}>Email cannot be changed here.</span>
            </div>

            <div className={styles.formFooter}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => reset()}
                disabled={!isDirty || updateProfile.isPending}
              >
                Discard
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSubmit(onSubmit)}
                disabled={!isDirty || updateProfile.isPending}
                aria-busy={updateProfile.isPending}
              >
                {updateProfile.isPending
                  ? <><span className={styles.btnSpinner} /> Saving…</>
                  : 'Save Changes'
                }
              </button>
            </div>

          </div>
        </SectionCard>

      </div>
    </DashboardHead>
  )
}