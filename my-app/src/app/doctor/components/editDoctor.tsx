'use client'

import { useEffect } from 'react'
import { useUpdateDoctor } from '@/hooks/useDoctor'
import type { Doctor } from '@/types'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { updateDocotorSchema } from '@/lib/validators'
import type { z } from 'zod'

type FormData = z.infer<typeof updateDocotorSchema>

interface Props {
  doctor: Doctor
  open: boolean
  onClose: () => void
}

export function DoctorEditModal({ doctor, open, onClose }: Props) {
  const updateDoctor = useUpdateDoctor(doctor.id)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(updateDocotorSchema),
    defaultValues: {
      firstName: doctor.user?.firstName ?? '',
      lastName: doctor.user?.lastName ?? '',
      phone: doctor.user?.phone ?? '',
      address: doctor.user?.address ?? '',
      bio: doctor.bio ?? '',
      specialty: doctor.specialty ?? '',
    },
  })

  useEffect(() => {
    if (open) reset()
  }, [open, reset])

  const onSubmit = async (data: FormData) => {
    await updateDoctor.mutateAsync({userID: doctor.userId,...data})
    reset(data)
    onClose()
  }

  if (!open) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999,
        
      }}
    >
      <div className="card"
       style={{
            width: 500,
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: 20,
         }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <h3>Edit Doctor</h3>
          <button className="btn btn-danger" onClick={onClose}>
            X
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>

          {/* First Name */}
          <div>
            <p>First Name</p>
            <input className="input" {...register('firstName')} />
            {errors.firstName && <p>{errors.firstName.message}</p>}
          </div>

          {/* Last Name */}
          <div>
            <p>Last Name</p>
            <input className="input" {...register('lastName')} />
            {errors.lastName && <p>{errors.lastName.message}</p>}
          </div>

          {/* Phone */}
          <div>
            <p>Phone</p>
            <input className="input" {...register('phone')} />
            {errors.phone && <p>{errors.phone.message}</p>}
          </div>

          {/* Address */}
          <div>
            <p>Address</p>
            <input className="input" {...register('address')} />
            {errors.address && <p>{errors.address.message}</p>}
          </div>

          {/* Specialty */}
          <div>
            <p>Specialty</p>
            <input className="input" {...register('specialty')} />
            {errors.specialty && <p>{errors.specialty.message}</p>}
          </div>

          {/* Bio */}
          <div>
            <p>Bio</p>
            <textarea className="input" rows={3} {...register('bio')} />
            {errors.bio && <p>{errors.bio.message}</p>}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => reset()}
              disabled={!isDirty || isSubmitting}
            >
              Reset
            </button>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={!isDirty || isSubmitting}
            >
              {isSubmitting ? 'Saving…' : 'Save'}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}