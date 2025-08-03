require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkViewData() {
  console.log('Checking pack_rarity_details view for DM25-EX1...');
  
  // ビューから直接データを取得
  const { data: viewData, error: viewError } = await supabase
    .from('pack_rarity_details')
    .select('*')
    .eq('pack_id', 'DM25-EX1')
    .in('rarity_name', ['SR', 'VR']);
    
  if (viewError) {
    console.error('View error:', viewError);
    return;
  }
  
  console.log('View data:');
  viewData?.forEach(row => {
    console.log(`${row.rarity_name}:`);
    console.log(`  total_types: ${row.total_types}`);
    console.log(`  total_types_new: ${row.total_types_new}`);
    console.log(`  total_types_reprint: ${row.total_types_reprint}`);
    console.log(`  cards_per_box: ${row.cards_per_box}`);
    console.log(`  cards_per_box_reprint: ${row.cards_per_box_reprint}`);
    console.log('');
  });
  
  // pack_raritiesテーブルの状態も確認
  console.log('=== pack_rarities table ===');
  const { data: packRarities } = await supabase
    .from('pack_rarities')
    .select('*')
    .eq('pack_id', 'DM25-EX1');
    
  console.log(`Found ${packRarities?.length || 0} pack_rarities records for DM25-EX1`);
  
  packRarities?.forEach(pr => {
    console.log(`Rarity ID ${pr.rarity_id}: cards_per_box=${pr.cards_per_box}, cards_per_box_reprint=${pr.cards_per_box_reprint}`);
  });
}

checkViewData().catch(console.error);