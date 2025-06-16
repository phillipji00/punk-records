#!/usr/bin/env node

/**
 * Script para executar todos os testes do Syndicate v3
 * Uso: node run-all-tests.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 EXECUTANDO SUITE COMPLETA DE TESTES - SYNDICATE v3\n');
console.log('=' .repeat(60));
console.log('Data:', new Date().toLocaleString());
console.log('=' .repeat(60));

const tests = [
  { 
    name: 'Pipeline Engine', 
    file: 'pipelineEngine.test.ts',
    description: 'Gerenciamento das 8 etapas investigativas'
  },
  { 
    name: 'OBI State Manager', 
    file: 'obiStateManager.test.ts',
    description: 'Inteligência central do Capitão Obi'
  },
  { 
    name: 'Retry Engine', 
    file: 'retryEngine.test.ts',
    description: 'Sistema de recuperação de erros'
  },
  { 
    name: 'Specialists Engine', 
    file: 'specialistsEngine.test.ts',
    description: 'Interface dos 5 especialistas'
  },
  { 
    name: 'Review Engine', 
    file: 'reviewEngine.test.ts',
    description: 'Validação cruzada entre especialistas'
  },
  { 
    name: 'Core Runtime', 
    file: 'coreRuntime.test.ts',
    description: 'Orquestrador central do sistema'
  }
];

const results = {
  passed: [],
  failed: [],
  skipped: []
};

async function runTest(test) {
  console.log(`\n\n📁 ${test.name}`);
  console.log(`📝 ${test.description}`);
  console.log('-'.repeat(60));
  
  // Verificar se o arquivo existe
  const testPath = path.join('tests', test.file);
  if (!fs.existsSync(testPath)) {
    console.log(`⚠️  AVISO: Arquivo ${test.file} não encontrado`);
    results.skipped.push(test.name);
    return;
  }
  
  try {
    // Executar teste
    execSync(`npm test ${test.file}`, { 
      stdio: 'inherit',
      env: { ...process.env, CI: 'true' }
    });
    
    console.log(`\n✅ ${test.name} - PASSOU`);
    results.passed.push(test.name);
    
  } catch (error) {
    console.log(`\n❌ ${test.name} - FALHOU`);
    results.failed.push(test.name);
  }
}

async function runAllTests() {
  const startTime = Date.now();
  
  // Executar testes sequencialmente
  for (const test of tests) {
    await runTest(test);
  }
  
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  
  // Resumo Final
  console.log('\n\n');
  console.log('=' .repeat(60));
  console.log('📊 RESUMO DOS TESTES');
  console.log('=' .repeat(60));
  
  console.log(`\n✅ Passou: ${results.passed.length}/${tests.length}`);
  results.passed.forEach(name => console.log(`   • ${name}`));
  
  if (results.failed.length > 0) {
    console.log(`\n❌ Falhou: ${results.failed.length}/${tests.length}`);
    results.failed.forEach(name => console.log(`   • ${name}`));
  }
  
  if (results.skipped.length > 0) {
    console.log(`\n⚠️  Pulados: ${results.skipped.length}/${tests.length}`);
    results.skipped.forEach(name => console.log(`   • ${name}`));
  }
  
  console.log(`\n⏱️  Tempo total: ${duration}s`);
  
  // Cobertura de código (se disponível)
  console.log('\n📈 COBERTURA DE CÓDIGO');
  console.log('-'.repeat(40));
  
  try {
    execSync('npm run test:coverage -- --silent', { stdio: 'pipe' });
    console.log('✅ Relatório de cobertura gerado em ./coverage');
  } catch (error) {
    console.log('⚠️  Execute "npm run test:coverage" para ver a cobertura completa');
  }
  
  // Status final
  console.log('\n\n');
  if (results.failed.length === 0) {
    console.log('🎉 TODOS OS TESTES PASSARAM! Sistema pronto para produção.');
    process.exit(0);
  } else {
    console.log('⚠️  ALGUNS TESTES FALHARAM. Verifique os erros acima.');
    process.exit(1);
  }
}

// Tratamento de erros globais
process.on('unhandledRejection', (error) => {
  console.error('\n❌ Erro não tratado:', error);
  process.exit(1);
});

// Executar
console.log('\n🔧 Verificando ambiente...\n');

try {
  execSync('node --version', { stdio: 'pipe' });
  execSync('npm --version', { stdio: 'pipe' });
  console.log('✅ Node.js e npm detectados');
} catch (error) {
  console.error('❌ Node.js ou npm não encontrados. Por favor, instale primeiro.');
  process.exit(1);
}

// Instalar dependências se necessário
if (!fs.existsSync('node_modules')) {
  console.log('\n📦 Instalando dependências...\n');
  try {
    execSync('npm install', { stdio: 'inherit' });
  } catch (error) {
    console.error('❌ Falha ao instalar dependências');
    process.exit(1);
  }
}

// Executar testes
runAllTests();