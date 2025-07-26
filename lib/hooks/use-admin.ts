'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

export function useAdmin() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAdminRole = async () => {
      try {
        // ユーザー認証チェック
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError || !user) {
          router.push('/login')
          return
        }
        
        setUser(user)
        
        // ユーザーのroleをチェック
        const { data: userData, error: roleError } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()
        
        if (roleError) {
          console.error('Error checking admin role:', roleError)
          setIsAdmin(false)
          return
        }
        
        const adminRole = userData?.role === 'admin'
        setIsAdmin(adminRole)
        
        if (!adminRole) {
          router.push('/dashboard')
        }
      } catch (error) {
        console.error('Admin check error:', error)
        setIsAdmin(false)
        router.push('/dashboard')
      } finally {
        setLoading(false)
      }
    }
    
    checkAdminRole()
  }, [router])

  return { isAdmin, user, loading }
}