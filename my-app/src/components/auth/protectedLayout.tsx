'use client'

import { useEffect,useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore, selectIsAuthenticated } from '@/store/authStore'

export default function ProtectedLayout({
  children,
  roles,
}: {
  children: React.ReactNode
  roles?: string[]
}) {
  const router = useRouter()
  const isAuthenticated = useAuthStore(selectIsAuthenticated)
  const user = useAuthStore((state) => state.user)
  const [route,setRoute] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login')
      return
    }
    else if(!roles || !user){
      setRoute(false);
    }
    else if (!roles.includes(user?.role)) {
      router.replace('/403')
      return 
    }
    else {
      setRoute(true)
    }
  }, [isAuthenticated, user, roles, router])

  return (route)? <>{children}</> : <></>
}