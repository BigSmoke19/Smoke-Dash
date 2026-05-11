'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import AuthLayout from '@/components/auth/AuthLayout'
import {
  AuthCard, Field, SubmitButton, AuthLink, AlertBanner,
} from '@/components/auth/AuthForm'
import { useAuth } from '@/hooks/useAuth'
import { forgotPasswordSchema } from '@/lib/validators'
import { z } from 'zod'
import { ROUTES } from '@/lib/constants'
import styles from './forgot.module.css'

type ForgotFormData = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordPage() {
  const { forgotPassword } = useAuth()
  const [sent, setSent]    = useState(false)
  const [sentEmail, setSentEmail] = useState('')

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<ForgotFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const onSubmit = (data: ForgotFormData) => {
    forgotPassword.mutate(data.email, {
      onSuccess: () => {
        setSentEmail(data.email)
        setSent(true)
      },
    })
  }

  if (sent) {
    return (
      <AuthLayout>
        <AuthCard
          title="Check your inbox"
          subtitle={`We sent a reset link to ${sentEmail}. It expires in 15 minutes.`}
        >
          <div className={styles.sentIcon}>✉</div>
          <AlertBanner
            message="If you don't see the email, check your spam folder."
            variant="info"
          />
          <AuthLink label="Back to sign in" href={ROUTES.login} />
        </AuthCard>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <AuthCard
        title="Forgot password?"
        subtitle="Enter your email and we'll send you a reset link"
      >
        {forgotPassword.isError && (
          <AlertBanner
            message={
              (forgotPassword.error as any)?.response?.data?.message ??
              'Unable to send reset link. Please try again.'
            }
          />
        )}

        <Field label="Email address" error={errors.email?.message}>
          <input
            {...register('email')}
            className="input"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
          />
        </Field>

        <SubmitButton
          label="Send Reset Link"
          loadingLabel="Sending…"
          loading={forgotPassword.isPending}
          onClick={handleSubmit(onSubmit)}
        />

        <AuthLink
          prefix="Remembered it?"
          label="Back to sign in"
          href={ROUTES.login}
        />
      </AuthCard>
    </AuthLayout>
  )
}