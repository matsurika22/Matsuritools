require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkData() {
  // SRとVRカードをチェック
  const { data: cards } = await supabase
    .from('cards')
    .select('id, name, card_number, rarity_id, parameters, rarities(name)')
    .eq('pack_id', 'DM25-RP1');
    
  console.log('Cards in DM25-RP1 by rarity:');
  const cardsByRarity = {};
  cards?.forEach(card => {
    const rarityName = card.rarities?.name;
    if (!cardsByRarity[rarityName]) cardsByRarity[rarityName] = [];
    cardsByRarity[rarityName].push(card);
  });
  
  Object.entries(cardsByRarity).forEach(([rarity, cards]) => {
    console.log(`${rarity}: ${cards.length} cards`);
    if (rarity === 'SR' || rarity === 'VR') {
      const newCards = cards.filter(c => !c.parameters?.reprint_flag);
      const reprintCards = cards.filter(c => c.parameters?.reprint_flag);
      console.log(`  - New: ${newCards.length}, Reprint: ${reprintCards.length}`);
      
      // parametersフィールドの詳細を確認
      console.log(`  - Sample parameters:`, cards[0]?.parameters);
      
      if (cards.length <= 10) {
        cards.forEach(c => console.log(`    ${c.card_number}: ${c.name} (parameters: ${JSON.stringify(c.parameters)})`));
      }
    }
  });
  
  // pack_rarity_detailsビューをチェック
  console.log('\n=== pack_rarity_details view ===');
  const { data: view } = await supabase
    .from('pack_rarity_details')
    .select('*')
    .eq('pack_id', 'DM25-RP1')
    .in('rarity_name', ['SR', 'VR']);
    
  view?.forEach(row => {
    console.log(`${row.rarity_name}: total=${row.total_types}, new=${row.total_types_new}, reprint=${row.total_types_reprint}`);
  });
}

checkData().catch(console.error);