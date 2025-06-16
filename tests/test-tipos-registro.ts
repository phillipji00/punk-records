import { RuntimeOrchestrator } from '../lib/runtimeOrchestrator';
import { IngestEvent } from '../lib/types/common';

async function testarTipos() {
  console.log('🧪 Testando cada tipo de registro:\n');
  
  const orchestrator = new RuntimeOrchestrator(true);
  
  const tipos = [
    'hipotese',
    'evidencia', 
    'perfil_personagem',
    'entrada_timeline',
    'registro_misc',
    'cross_validation_result',
    'ingest',
    'hypothesis_created',
    'analysis_validated',
    'task_assigned',
    'contradiction_detected',
    'analysis_completed'
  ];

  for (const tipo of tipos) {
    const evento: IngestEvent = {
      id: `test-${tipo}`,
      timestamp: new Date().toISOString(),
      tipo_registro: tipo as any,
      autor: 'sistema',
      dados: { descricao: `Teste tipo ${tipo}` },
      etapa: 'intake_analysis',
      id_caso: 'CASO-TEST',
      trace_id: 'trace-test'
    };

    try {
      const resultado = await orchestrator.orchestrate(evento);
      console.log(`${tipo}: ${resultado.success ? '✅' : '❌'}`);
      
      if (!resultado.success && resultado.errors) {
        console.log(`  Erro: ${resultado.errors[0]}`);
      }
    } catch (error) {
      console.log(`${tipo}: ❌ ERRO FATAL`);
      console.log(`  ${error}`);
    }
  }
}

testarTipos();