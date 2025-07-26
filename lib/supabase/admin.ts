import { supabase } from './client'

export interface AdminUser {
  id: string
  email: string
  role: 'user' | 'admin' | 'friend'
  created_at: string
}

export interface AdminPack {
  id: string
  name: string
  release_date: string | null
  box_price: number | null
  packs_per_box: number | null
  cards_per_pack: number | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AdminCard {
  id: string
  pack_id: string
  rarity_id: string | number
  name: string
  card_number?: string
  box_rate?: number | null
  parameters?: {
    buyback_price?: number
    reference_price?: number
  } | null
  created_at: string
  updated_at: string
  pack?: { name: string }
  rarity?: { name: string, color: string }
}

// ユーザー管理
export async function getAllUsers(): Promise<AdminUser[]> {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, role, created_at')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching users:', error)
    throw error
  }
  
  return data || []
}

export async function updateUserRole(userId: string, role: 'user' | 'admin' | 'friend') {
  const { error } = await supabase
    .from('users')
    .update({ role })
    .eq('id', userId)
  
  if (error) {
    console.error('Error updating user role:', error)
    throw error
  }
}

// 弾管理
export async function getAllPacks(): Promise<AdminPack[]> {
  const { data, error } = await supabase
    .from('packs')
    .select('*')
    .order('release_date', { ascending: false })
  
  if (error) {
    console.error('Error fetching packs:', error)
    throw error
  }
  
  return data || []
}

export async function createPack(pack: {
  name: string
  release_date?: string
  box_price?: number
  packs_per_box?: number
  cards_per_pack?: number
}) {
  const { error } = await supabase
    .from('packs')
    .insert({
      ...pack,
      is_active: true
    })
  
  if (error) {
    console.error('Error creating pack:', error)
    throw error
  }
}

export async function updatePack(packId: string, updates: Partial<AdminPack>) {
  const { error } = await supabase
    .from('packs')
    .update(updates)
    .eq('id', packId)
  
  if (error) {
    console.error('Error updating pack:', error)
    throw error
  }
}

export async function deletePack(packId: string) {
  const { error } = await supabase
    .from('packs')
    .delete()
    .eq('id', packId)
  
  if (error) {
    console.error('Error deleting pack:', error)
    throw error
  }
}

// カード管理
export async function getAllCards(): Promise<AdminCard[]> {
  const { data, error } = await supabase
    .from('cards')
    .select(`
      *,
      pack:packs(name),
      rarity:rarities(name, color)
    `)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching cards:', error)
    throw error
  }
  
  return data || []
}

export async function getCardsByPack(packId: string): Promise<AdminCard[]> {
  const { data, error } = await supabase
    .from('cards')
    .select(`
      *,
      pack:packs(name),
      rarity:rarities(name, color)
    `)
    .eq('pack_id', packId)
    .order('card_number')
  
  if (error) {
    console.error('Error fetching cards by pack:', error)
    throw error
  }
  
  return data || []
}

export async function createCard(card: {
  pack_id: string
  rarity_id: string
  name: string
  card_number: string
  box_rate: number
}) {
  const { error } = await supabase
    .from('cards')
    .insert(card)
  
  if (error) {
    console.error('Error creating card:', error)
    throw error
  }
}

export async function updateCard(cardId: string, updates: Partial<AdminCard>) {
  const { error } = await supabase
    .from('cards')
    .update(updates)
    .eq('id', cardId)
  
  if (error) {
    console.error('Error updating card:', error)
    throw error
  }
}

export async function deleteCard(cardId: string) {
  const { error } = await supabase
    .from('cards')
    .delete()
    .eq('id', cardId)
  
  if (error) {
    console.error('Error deleting card:', error)
    throw error
  }
}

// レアリティ管理
export async function getAllRarities() {
  const { data, error } = await supabase
    .from('rarities')
    .select('*')
    .order('sort_order')
  
  if (error) {
    console.error('Error fetching rarities:', error)
    throw error
  }
  
  return data || []
}

// アクセスコード管理
export async function getAllAccessCodes() {
  const { data, error } = await supabase
    .from('access_codes')
    .select(`
      *,
      pack:packs(name)
    `)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching access codes:', error)
    throw error
  }
  
  return data || []
}

export async function createAccessCode(accessCode: {
  code: string
  pack_id?: string
  valid_from: string
  valid_until?: string
  max_uses?: number
}) {
  const { error } = await supabase
    .from('access_codes')
    .insert({
      ...accessCode,
      current_uses: 0,
      created_by: (await supabase.auth.getUser()).data.user?.id
    })
  
  if (error) {
    console.error('Error creating access code:', error)
    throw error
  }
}