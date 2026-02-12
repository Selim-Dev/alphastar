const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying UI Components...\n');

const componentsToCheck = [
  'button.tsx',
  'card.tsx',
  'input.tsx',
  'label.tsx',
  'select.tsx',
  'progress.tsx'
];

const uiPath = path.join(__dirname, 'frontend', 'src', 'components', 'ui');

let allExist = true;

componentsToCheck.forEach(component => {
  const filePath = path.join(uiPath, component);
  const exists = fs.existsSync(filePath);
  
  if (exists) {
    const stats = fs.statSync(filePath);
    console.log(`✅ ${component} - ${stats.size} bytes`);
  } else {
    console.log(`❌ ${component} - MISSING`);
    allExist = false;
  }
});

console.log('\n' + '='.repeat(50));

if (allExist) {
  console.log('✅ All UI components are in place!');
  console.log('\n📝 Next steps:');
  console.log('1. Stop the Vite dev server (Ctrl+C)');
  console.log('2. Clear Vite cache: npm run clean (or delete node_modules/.vite)');
  console.log('3. Restart dev server: npm run dev');
} else {
  console.log('❌ Some components are missing. Please create them.');
}

console.log('='.repeat(50));
