import ProtectedLayout from "@/components/auth/protectedLayout"

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedLayout roles={['DOCTOR']}>
      {children}
    </ProtectedLayout>
  )
}