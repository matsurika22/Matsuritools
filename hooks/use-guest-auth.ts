'use client'

import { create } from 'zustand'
import { GuestSession, getGuestSession, saveGuestSession, clearGuestSession } from '@/lib/guest-session'

interface GuestAuthState {
  guestSession: GuestSession | null
  isGuest: boolean
  initialized: boolean
  setGuestSession: (session: GuestSession) => void
  clearGuest: () => void
  initializeGuest: () => void
}

export const useGuestAuth = create<GuestAuthState>((set, get) => ({
  guestSession: null,
  isGuest: false,
  initialized: false,
  
  setGuestSession: (session) => {
    saveGuestSession(session)
    set({ guestSession: session, isGuest: true, initialized: true })
  },
  
  clearGuest: () => {
    clearGuestSession()
    set({ guestSession: null, isGuest: false, initialized: true })
  },
  
  initializeGuest: () => {
    const state = get()
    if (state.initialized) return // 既に初期化済みの場合は何もしない
    
    const session = getGuestSession()
    set({ guestSession: session, isGuest: !!session, initialized: true })
  }
}))