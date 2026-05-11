'use client'

import { useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import AuthLayout from '@/components/auth/AuthLayout'
import {
  AuthCard, AlertBanner, AuthLink, SubmitButton,
} from '@/components/auth/AuthForm'
import { useAuth } from '@/hooks/useAuth'
import { ROUTES } from '@/lib/constants'
import styles from './verify.module.css'

function VerifyForm() {
  const searchParams    = useSearchParams()
  const userId          = searchParams.get('userId') ?? ''
  const token           = searchParams.get('token')  ?? ''
  const { verifyEmail } = useAuth()
  const attempted       = useRef(false)

  // Auto-trigger once on mount if both params are present
  useEffect(() => {
    if (userId && token && !attempted.current) {
      attempted.current = true
      verifyEmail.mutate({ userId, token })
    }
  }, [userId, token]) // eslint-disable-line react-hooks/exhaustive-deps

  const missingParams = !userId || !token

  return (
    <AuthCard
      title="Email verification"
      subtitle={
        missingParams
          ? 'This verification link is incomplete.'
          : verifyEmail.isPending
            ? 'Verifying your email address…'
            : verifyEmail.isSuccess
              ? 'Your email has been verified!'
              : 'Verification failed'
      }
    >
      {/* ── States ── */}

      {verifyEmail.isPending && (
        <div className={styles.pending}>
          <div className={styles.pendingSpinner} />
          <span>Please wait…</span>
        </div>
      )}

      {verifyEmail.isSuccess && (
        <>
          <div className={styles.successIcon}>✓</div>
          <AlertBanner
            message="You can now sign in with your account."
            variant="success"
          />
          <AuthLink label="Go to sign in" href={ROUTES.login} />
        </>
      )}

      {verifyEmail.isError && (
        <>
          <AlertBanner
            message={
              (verifyEmail.error as any)?.response?.data?.message ??
              'This link may have expired or already been used.'
            }
          />
          <SubmitButton
            label="Retry verification"
            loadingLabel="Retrying…"
            loading={verifyEmail.isPending}
            onClick={() => verifyEmail.mutate({ userId, token })}
          />
          <AuthLink
            prefix="Need a new link?"
            label="Contact support"
            href="/contact"
          />
        </>
      )}

      {missingParams && (
        <>
          <AlertBanner
            message="The verification link is missing required parameters."
            variant="error"
          />
          <AuthLink label="Back to sign in" href={ROUTES.login} />
        </>
      )}
    </AuthCard>
  )
}

export default function VerifyEmailPage() {
  return (
    <AuthLayout>
      <Suspense fallback={null}>
        <VerifyForm />
      </Suspense>
    </AuthLayout>
  )
}
