'use client'

import { create } from 'zustand'
import { GuestSession, getGuestSession, saveGuestSession, clearGuestSession } from '@/lib/guest-session'

interface GuestAuthState {
  guestSession: GuestSession | null
  isGuest: boolean
  setGuestSession: (session: GuestSession) => void
  clearGuest: () => void
  initializeGuest: () => void
}

export const useGuestAuth = create<GuestAuthState>((set) => ({
  guestSession: null,
  isGuest: false,
  
  setGuestSession: (session) => {
    saveGuestSession(session)
    set({ guestSession: session, isGuest: true })
  },
  
  clearGuest: () => {
    clearGuestSession()
    set({ guestSession: null, isGuest: false })
  },
  
  initializeGuest: () => {
    const session = getGuestSession()
    set({ guestSession: session, isGuest: !!session })
  }
}))