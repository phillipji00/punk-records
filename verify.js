#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('🔍 Verificando compilação TypeScript...\n');

const configs = [
    { name: 'Produção (strict)', config: 'tsconfig.json' },
    { name: 'Desenvolvimento (flexível)', config: 'tsconfig.dev.json' }
];

let allPassed = true;

configs.forEach(({ name, config }) => {
    try {
        console.log(`📋 Testando ${name}...`);
        execSync(`npx tsc --noEmit -p ${config}`, { stdio: 'pipe' });
        console.log(`✅ ${name}: OK\n`);
    } catch (error) {
        console.log(`❌ ${name}: FALHOU`);
        console.log(error.stdout?.toString() || error.message);
        console.log('\n');
        allPassed = false;
    }
});

if (allPassed) {
    console.log('🎉 Todas as verificações passaram!');
} else {
    console.log('⚠️ Algumas verificações falharam. Use tsconfig.dev.json para desenvolvimento.');
}
