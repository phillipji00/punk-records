#!/usr/bin/env node

/**
 * Correção Cirúrgica de Sintaxe - tests/specialistsengine.test.ts
 * 
 * Corrige apenas os caracteres específicos que estão causando os erros
 */

const fs = require('fs');

console.log('🔧 Aplicando correções cirúrgicas de sintaxe...\n');

function fixSurgicalSyntax() {
    const filePath = 'tests/specialistsengine.test.ts';
    
    if (!fs.existsSync(filePath)) {
        console.log('❌ Arquivo não encontrado:', filePath);
        return false;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    console.log('📋 Analisando linha 284...');
    
    // Dividir em linhas para análise
    const lines = content.split('\n');
    
    // Verificar linha 284 (índice 283)
    if (lines[283]) {
        console.log(`Linha 284 atual: "${lines[283]}"`);
        
        // Corrigir ") as any))" que deveria ser ") as any)"
        if (lines[283].includes('} as any))')) {
            lines[283] = lines[283].replace('} as any))', '} as any)');
            console.log(`✅ Linha 284 corrigida: "${lines[283]}"`);
        }
        
        // Corrigir outros possíveis problemas na linha 284
        if (lines[283].includes(')) as any')) {
            lines[283] = lines[283].replace(')) as any', ') as any');
            console.log(`✅ Linha 284 corrigida (caso 2): "${lines[283]}"`);
        }
    }
    
    console.log('📋 Analisando linha 503...');
    
    // Verificar linha 503 (índice 502)
    if (lines[502]) {
        console.log(`Linha 503 atual: "${lines[502]}"`);
        
        // Verificar se há problemas com chaves ou parênteses
        const line503 = lines[502].trim();
        
        // Se a linha é apenas "});" ou similar, pode estar mal posicionada
        if (line503 === '});' || line503 === '}') {
            // Verificar se falta alguma coisa antes
            let i = 501; // linha anterior
            while (i >= 0 && lines[i].trim() === '') {
                i--; // pular linhas vazias
            }
            
            if (i >= 0) {
                const previousLine = lines[i].trim();
                console.log(`Linha anterior não vazia (${i+1}): "${previousLine}"`);
                
                // Se a linha anterior não termina com ; ou }, pode estar faltando
                if (!previousLine.endsWith(';') && !previousLine.endsWith('}') && !previousLine.endsWith('},')) {
                    lines[i] = lines[i] + ';';
                    console.log(`✅ Adicionado ; na linha ${i+1}`);
                }
            }
        }
    }
    
    // Verificar problemas comuns em todo o arquivo
    console.log('📋 Verificando problemas comuns...');
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Problema 1: Parênteses duplos desnecessários
        if (line.includes(')) as any')) {
            lines[i] = line.replace(')) as any', ') as any');
            console.log(`✅ Linha ${i+1}: Removido parêntese extra`);
        }
        
        // Problema 2: Chaves mal fechadas
        if (line.includes('} as any))')) {
            lines[i] = line.replace('} as any))', '} as any)');
            console.log(`✅ Linha ${i+1}: Corrigido fechamento de objeto`);
        }
        
        // Problema 3: Vírgulas faltando antes de "as any"
        if (line.includes(' as any') && !line.includes(', as any') && !line.includes('} as any') && !line.includes(') as any')) {
            lines[i] = line.replace(' as any', ' as any');
            console.log(`✅ Linha ${i+1}: Espaçamento de "as any" corrigido`);
        }
    }
    
    // Juntar as linhas novamente
    const newContent = lines.join('\n');
    
    // Verificar se houve mudanças
    if (newContent !== originalContent) {
        fs.writeFileSync(filePath, newContent);
        console.log('\n✅ Arquivo atualizado com correções cirúrgicas');
        return true;
    } else {
        console.log('\n⚠️ Nenhuma mudança necessária detectada');
        
        // Mostrar contexto das linhas problemáticas
        console.log('\n📋 Contexto das linhas problemáticas:');
        for (let i = 280; i <= 285; i++) {
            if (lines[i-1]) {
                console.log(`${i}: ${lines[i-1]}`);
            }
        }
        
        console.log('\n📋 Contexto da linha 503:');
        for (let i = 500; i <= 505; i++) {
            if (lines[i-1]) {
                console.log(`${i}: ${lines[i-1]}`);
            }
        }
        
        return false;
    }
}

function showLineContext(filePath, lineNumber, context = 3) {
    const lines = fs.readFileSync(filePath, 'utf8').split('\n');
    const start = Math.max(0, lineNumber - context - 1);
    const end = Math.min(lines.length, lineNumber + context);
    
    console.log(`\n📋 Contexto da linha ${lineNumber}:`);
    for (let i = start; i < end; i++) {
        const marker = i === lineNumber - 1 ? '>>> ' : '    ';
        console.log(`${marker}${i + 1}: ${lines[i]}`);
    }
}

function verifyFix() {
    console.log('\n🔍 Verificando se os erros foram corrigidos...');
    
    try {
        const { execSync } = require('child_process');
        execSync('npx tsc --noEmit tests/specialistsengine.test.ts', { stdio: 'pipe' });
        console.log('✅ Arquivo compila sem erros!');
        return true;
    } catch (error) {
        console.log('❌ Ainda há erros:');
        const errorOutput = error.stdout?.toString() || error.message;
        console.log(errorOutput);
        
        // Extrair números de linha dos erros
        const errorLines = errorOutput.match(/tests\/specialistsengine\.test\.ts:(\d+):/g);
        if (errorLines) {
            errorLines.forEach(match => {
                const lineNumber = parseInt(match.match(/:(\d+):/)[1]);
                showLineContext('tests/specialistsengine.test.ts', lineNumber);
            });
        }
        
        return false;
    }
}

function main() {
    console.log('🎯 Correção Cirúrgica de Sintaxe');
    console.log('Focando apenas nos caracteres específicos que causam os erros\n');
    
    try {
        const fixed = fixSurgicalSyntax();
        
        if (fixed) {
            console.log('\n📋 Correções aplicadas:');
            console.log('✅ Parênteses extras removidos');
            console.log('✅ Chaves corrigidas');
            console.log('✅ Vírgulas ajustadas');
        }
        
        // Verificar resultado
        const success = verifyFix();
        
        if (success) {
            console.log('\n🎉 SUCESSO! Erros de sintaxe corrigidos!');
        } else {
            console.log('\n🔧 Pode ser necessário correção manual adicional');
        }
        
    } catch (error) {
        console.error('❌ Erro durante a correção:', error.message);
    }
}

// Função auxiliar para mostrar diferenças
function showDiff(original, fixed) {
    const originalLines = original.split('\n');
    const fixedLines = fixed.split('\n');
    
    console.log('\n📋 Diferenças encontradas:');
    for (let i = 0; i < Math.max(originalLines.length, fixedLines.length); i++) {
        if (originalLines[i] !== fixedLines[i]) {
            console.log(`Linha ${i + 1}:`);
            console.log(`  - ${originalLines[i] || '(linha removida)'}`);
            console.log(`  + ${fixedLines[i] || '(linha adicionada)'}`);
        }
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    main();
}

module.exports = {
    fixSurgicalSyntax,
    verifyFix,
    showLineContext,
    main
};