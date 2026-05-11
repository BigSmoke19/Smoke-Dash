'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import AuthLayout from '@/components/auth/AuthLayout'
import {
  AuthCard, Field, SubmitButton, AuthLink, AlertBanner,
} from '@/components/auth/AuthForm'
import { useAuth } from '@/hooks/useAuth'
import { resetPasswordSchema } from '@/lib/validators'
import { z } from 'zod'
import { ROUTES } from '@/lib/constants'
import styles from './reset.module.css'

type ResetFormData = z.infer<typeof resetPasswordSchema>

function ResetForm() {
  const searchParams      = useSearchParams()
  const token             = searchParams.get('token') ?? ''
  const { resetPassword } = useAuth()
  const [showPw, setShowPw] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetFormData>({
    resolver: zodResolver(resetPasswordSchema),
  })

  const onSubmit = (data: ResetFormData) => {
    resetPassword.mutate({ token, newPassword: data.newPassword })
  }

  // Guard: missing token in URL
  if (!token) {
    return (
      <AuthCard
        title="Invalid link"
        subtitle="This reset link is missing or malformed."
      >
        <AlertBanner
          message="Please request a new password reset link."
          variant="error"
        />
        <AuthLink label="Request new link" href={ROUTES.forgotPassword} />
      </AuthCard>
    )
  }

  return (
    <AuthCard
      title="Reset password"
      subtitle="Choose a new password for your account"
    >
      {resetPassword.isError && (
        <AlertBanner
          message={
            (resetPassword.error as any)?.response?.data?.message ??
            'This link may have expired. Please request a new one.'
          }
        />
      )}

      <Field label="New password" error={errors.newPassword?.message}>
        <div className={styles.passwordWrap}>
          <input
            {...register('newPassword')}
            className="input"
            type={showPw ? 'text' : 'password'}
            placeholder="Min 8 characters"
            autoComplete="new-password"
          />
          <button
            type="button"
            className={styles.togglePw}
            onClick={() => setShowPw((v) => !v)}
            aria-label={showPw ? 'Hide password' : 'Show password'}
          >
            {showPw ? '○' : '●'}
          </button>
        </div>
      </Field>

      <Field label="Confirm new password" error={errors.confirmPassword?.message}>
        <input
          {...register('confirmPassword')}
          className="input"
          type="password"
          placeholder="Repeat password"
          autoComplete="new-password"
        />
      </Field>

      <SubmitButton
        label="Reset Password"
        loadingLabel="Resetting…"
        loading={resetPassword.isPending}
        variant="warning"
        onClick={handleSubmit(onSubmit)}
      />

      <AuthLink
        prefix="Remembered it?"
        label="Back to sign in"
        href={ROUTES.login}
      />
    </AuthCard>
  )
}

export default function ResetPasswordPage() {
  return (
    <AuthLayout>
      <Suspense fallback={null}>
        <ResetForm />
      </Suspense>
    </AuthLayout>
  )
}