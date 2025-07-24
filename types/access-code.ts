export interface AccessCode {
  code: string
  packId: string | null
  validFrom: string
  validUntil: string
  maxUses: number | null
  currentUses: number
  createdBy: string
  createdAt: string
}

export interface UserCode {
  userId: string
  code: string
  activatedAt: string
}

export interface Pack {
  id: string
  name: string
  releaseDate: string | null
  boxPrice: number | null
  packsPerBox: number | null
  cardsPerPack: number | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}