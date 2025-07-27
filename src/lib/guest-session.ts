// ゲストセッション管理用のユーティリティ

export interface GuestSession {
  accessCode: string
  packId: string
  packName: string
  validUntil: string
  createdAt: string
}

const GUEST_SESSION_KEY = 'matsuritools_guest_session'

// ゲストセッションを保存
export function saveGuestSession(session: GuestSession): void {
  sessionStorage.setItem(GUEST_SESSION_KEY, JSON.stringify(session))
}

// ゲストセッションを取得
export function getGuestSession(): GuestSession | null {
  if (typeof window === 'undefined') return null
  
  const sessionData = sessionStorage.getItem(GUEST_SESSION_KEY)
  if (!sessionData) return null
  
  try {
    const session = JSON.parse(sessionData) as GuestSession
    
    // 有効期限チェック
    if (new Date(session.validUntil) < new Date()) {
      clearGuestSession()
      return null
    }
    
    return session
  } catch {
    clearGuestSession()
    return null
  }
}

// ゲストセッションをクリア
export function clearGuestSession(): void {
  sessionStorage.removeItem(GUEST_SESSION_KEY)
}

// ゲストセッションが有効かチェック
export function hasValidGuestSession(): boolean {
  return getGuestSession() !== null
}