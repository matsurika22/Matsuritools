export interface User {
  id: string
  email: string
  handleName: string
  role: 'user' | 'editor' | 'admin'
  createdAt: string
  updatedAt: string
}

export interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
}

export interface LoginFormData {
  email: string
  password: string
}

