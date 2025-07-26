// 一時的なスクリプト：usersテーブルにroleカラムを追加
import { supabase } from './client'

export async function addRoleColumn() {
  try {
    // SQLを実行してroleカラムを追加
    const { error } = await supabase.rpc('execute_sql', {
      query: `
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'friend'));
      `
    })

    if (error) {
      console.error('Error adding role column:', error)
      // 代替方法：直接SQLクエリを実行
      console.log('代替SQLクエリ:')
      console.log(`
        -- Supabase SQL Editorで実行してください
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'friend'));
      `)
    } else {
      console.log('Role column added successfully')
    }
  } catch (err) {
    console.error('Error:', err)
  }
}

// 実行
addRoleColumn()