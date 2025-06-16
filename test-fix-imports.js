const fs = require('fs');

// Arquivos para corrigir
const files = [
  'api/analisar.ts',
  'api/obi.ts', 
  'api/pipeline.ts',
  'api/refine.ts',
  'api/retry.ts',
  'api/review.ts'
];

// Mudanças necessárias
const replacements = [
  // De ../moduloX para ../src/moduloX
  { from: /from '\.\.\/(specialistAgent|obiStateManager|pipelineEngine|qaRefiner|retryEngine|reviewEngine)'/g, to: "from '../src/$1'" },
  { from: /from "\.\.\/(specialistAgent|obiStateManager|pipelineEngine|qaRefiner|retryEngine|reviewEngine)"/g, to: 'from "../src/$1"' },
  
  // lib/types/common - de ../../lib para ../lib (um nível acima apenas)
  { from: /from '\.\.\/\.\.\/lib\//g, to: "from '../lib/" },
  { from: /from "\.\.\/\.\.\/lib\//g, to: 'from "../lib/"' }
];

// Processar cada arquivo
files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;
    
    replacements.forEach(({ from, to }) => {
      const newContent = content.replace(from, to);
      if (newContent !== content) {
        content = newContent;
        changed = true;
      }
    });
    
    if (changed) {
      fs.writeFileSync(file, content);
      console.log(`✅ Corrigido: ${file}`);
    } else {
      console.log(`⏭️  Sem mudanças: ${file}`);
    }
  } else {
    console.log(`❌ Arquivo não encontrado: ${file}`);
  }
});

console.log('\n🎉 Pronto! Imports ajustados.');