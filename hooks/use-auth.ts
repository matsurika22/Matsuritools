'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { create } from 'zustand'
import { supabase } from '@/lib/supabase/client'
import { getCurrentUser } from '@/lib/supabase/auth'
import type { User } from '@/types/auth'

interface AuthStore {
  user: User | null
  loading: boolean
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  checkAuth: () => Promise<void>
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  checkAuth: async () => {
    try {
      set({ loading: true })
      const user = await getCurrentUser()
      set({ user })
    } catch (error) {
      console.error('Auth check error:', error)
      set({ user: null })
    } finally {
      set({ loading: false })
    }
  },
}))

export function useAuth() {
  const { user, loading, checkAuth } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    // 初回認証チェック
    checkAuth()

    // 認証状態の変更を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          await checkAuth()
        } else if (event === 'SIGNED_OUT') {
          useAuthStore.getState().setUser(null)
          router.push('/login')
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return { user, loading, checkAuth }
}

export function useRequireAuth(redirectTo = '/login') {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      console.log('[useRequireAuth] No user, redirecting to:', redirectTo)
      router.push(redirectTo)
    }
  }, [user, loading, router, redirectTo])

  return { user, loading }
}