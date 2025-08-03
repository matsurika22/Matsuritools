require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function runMigration() {
  console.log('Running manual migration to add reprint columns...');
  
  try {
    // 1. pack_raritiesテーブルにカラムを追加
    console.log('Adding columns to pack_rarities table...');
    
    // 各カラムを個別に追加（既に存在する場合はエラーを無視）
    const alterCommands = [
      'ALTER TABLE pack_rarities ADD COLUMN IF NOT EXISTS cards_per_box_reprint NUMERIC DEFAULT 0;',
      'ALTER TABLE pack_rarities ADD COLUMN IF NOT EXISTS box_input_x_reprint TEXT;',
      'ALTER TABLE pack_rarities ADD COLUMN IF NOT EXISTS box_input_y_reprint TEXT;',
      'ALTER TABLE pack_rarities ADD COLUMN IF NOT EXISTS notes_reprint TEXT;'
    ];
    
    for (const command of alterCommands) {
      console.log(`Executing: ${command}`);
      const { error } = await supabase.rpc('exec_sql', { sql: command });
      if (error && !error.message.includes('already exists')) {
        console.error(`Error: ${error.message}`);
      } else {
        console.log('✓ Success');
      }
    }
    
    // 2. ビューを再作成
    console.log('\nRecreating pack_rarity_details view...');
    
    const dropView = 'DROP VIEW IF EXISTS pack_rarity_details;';
    const { error: dropError } = await supabase.rpc('exec_sql', { sql: dropView });
    if (dropError) {
      console.error('Drop view error:', dropError);
    }
    
    const createView = `
      CREATE VIEW pack_rarity_details AS
      SELECT 
        pr.id,
        pr.pack_id,
        pr.rarity_id,
        pr.cards_per_box,
        pr.cards_per_box_reprint,
        pr.notes,
        pr.notes_reprint,
        pr.box_input_x,
        pr.box_input_y,
        pr.box_input_x_reprint,
        pr.box_input_y_reprint,
        r.name as rarity_name,
        r.color as rarity_color,
        r.display_order,
        COUNT(DISTINCT CASE WHEN COALESCE((c.parameters->>'reprint_flag')::boolean, false) = false THEN c.id END) as total_types_new,
        COUNT(DISTINCT CASE WHEN COALESCE((c.parameters->>'reprint_flag')::boolean, false) = true THEN c.id END) as total_types_reprint,
        COUNT(DISTINCT c.id) as total_types,
        CASE 
          WHEN COUNT(DISTINCT CASE WHEN COALESCE((c.parameters->>'reprint_flag')::boolean, false) = false THEN c.id END) > 0 
          THEN pr.cards_per_box / COUNT(DISTINCT CASE WHEN COALESCE((c.parameters->>'reprint_flag')::boolean, false) = false THEN c.id END)::numeric
          ELSE 0
        END as rate_per_card_new,
        CASE 
          WHEN COUNT(DISTINCT CASE WHEN COALESCE((c.parameters->>'reprint_flag')::boolean, false) = true THEN c.id END) > 0 
          THEN COALESCE(pr.cards_per_box_reprint, 0) / COUNT(DISTINCT CASE WHEN COALESCE((c.parameters->>'reprint_flag')::boolean, false) = true THEN c.id END)::numeric
          ELSE 0
        END as rate_per_card_reprint,
        CASE 
          WHEN COUNT(DISTINCT c.id) > 0 
          THEN (pr.cards_per_box + COALESCE(pr.cards_per_box_reprint, 0)) / COUNT(DISTINCT c.id)::numeric
          ELSE 0
        END as rate_per_card
      FROM pack_rarities pr
      LEFT JOIN rarities r ON pr.rarity_id = r.id
      LEFT JOIN cards c ON c.pack_id = pr.pack_id AND c.rarity_id = pr.rarity_id
      GROUP BY 
        pr.id, pr.pack_id, pr.rarity_id, pr.cards_per_box, pr.cards_per_box_reprint, 
        pr.notes, pr.notes_reprint, pr.box_input_x, pr.box_input_y, 
        pr.box_input_x_reprint, pr.box_input_y_reprint,
        r.name, r.color, r.display_order;
    `;
    
    const { error: createError } = await supabase.rpc('exec_sql', { sql: createView });
    if (createError) {
      console.error('Create view error:', createError);
    } else {
      console.log('✓ View created successfully');
    }
    
    console.log('\nMigration completed!');
    
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

runMigration().catch(console.error);