require('dotenv').config({ path: '.env.local' });
const { GoogleSheetsService } = require('../lib/services/google-sheets.ts');

async function checkSheetsData() {
  console.log('Checking reprint flags directly from Google Sheets...');
  
  const sheetsService = new GoogleSheetsService();
  const cards = await sheetsService.fetchCardData('DM25-RP1');
  
  console.log(`Found ${cards.length} cards for DM25-RP1`);
  
  // SR and VR cards with reprint flags
  const srVrCards = cards.filter(card => card.rarity === 'SR' || card.rarity === 'VR');
  console.log(`\nSR/VR cards (${srVrCards.length} total):`);
  
  srVrCards.forEach(card => {
    console.log(`${card.card_number}: ${card.name} (${card.rarity})`);
    console.log(`  reprint_flag: ${card.reprint_flag}`);
  });
  
  // Count reprint vs new
  const reprintCards = srVrCards.filter(card => card.reprint_flag);
  const newCards = srVrCards.filter(card => !card.reprint_flag);
  
  console.log(`\nSummary for DM25-RP1:`);
  console.log(`- Reprint cards: ${reprintCards.length}`);
  console.log(`- New cards: ${newCards.length}`);
  
  if (reprintCards.length > 0) {
    console.log('\nReprint cards:');
    reprintCards.forEach(card => {
      console.log(`  ${card.card_number}: ${card.name} (${card.rarity})`);
    });
  }
}

checkSheetsData().catch(console.error);