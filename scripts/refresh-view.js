require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function refreshView() {
  console.log('Refreshing pack_rarity_details view...');
  
  // Drop and recreate the view
  const { error: dropError } = await supabase.rpc('exec_sql', {
    sql: 'DROP VIEW IF EXISTS pack_rarity_details;'
  });
  
  if (dropError) {
    console.error('Error dropping view:', dropError);
  } else {
    console.log('View dropped successfully');
  }
  
  const createViewSQL = `
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
  
  const { error: createError } = await supabase.rpc('exec_sql', {
    sql: createViewSQL
  });
  
  if (createError) {
    console.error('Error creating view:', createError);
  } else {
    console.log('View created successfully');
    
    // Test the view
    const { data: testData } = await supabase
      .from('pack_rarity_details')
      .select('rarity_name, total_types, total_types_new, total_types_reprint')
      .eq('pack_id', 'DM25-RP1')
      .in('rarity_name', ['SR', 'VR']);
      
    console.log('Test results:');
    testData?.forEach(row => {
      console.log(`${row.rarity_name}: total=${row.total_types}, new=${row.total_types_new}, reprint=${row.total_types_reprint}`);
    });
  }
}

refreshView().catch(console.error);