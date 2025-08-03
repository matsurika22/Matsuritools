require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkSpecificCards() {
  console.log('Checking all SR and VR cards in DM25-EX1 for reprint flags...');
  
  const { data: cards } = await supabase
    .from('cards')
    .select('id, name, card_number, parameters, rarities(name)')
    .eq('pack_id', 'DM25-EX1')
    .in('rarity_id', [9, 10]) // VR=9, SR=10
    .order('card_number');
    
  console.log(`Found ${cards?.length || 0} SR/VR cards:`);
  
  cards?.forEach(card => {
    const rarityName = card.rarities?.name;
    if (rarityName === 'SR' || rarityName === 'VR') {
      console.log(`${card.card_number}: ${card.name} (${rarityName})`);
      console.log(`  reprint_flag: ${card.parameters?.reprint_flag}`);
      console.log(`  parameters: ${JSON.stringify(card.parameters)}`);
      console.log('');
    }
  });
  
  // レアリティテーブルも確認
  console.log('\n=== Rarities table ===');
  const { data: rarities } = await supabase
    .from('rarities')
    .select('*')
    .order('display_order');
    
  rarities?.forEach(r => {
    console.log(`ID ${r.id}: ${r.name}`);
  });
}

checkSpecificCards().catch(console.error);