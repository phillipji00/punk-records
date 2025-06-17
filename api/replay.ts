import { NextApiRequest, NextApiResponse } from 'next';
import pool, { initializeDatabase, getCasoStatus } from '../lib/dbClient';

// Função auxiliar para criar resumo baseado no tipo de registro
function criarResumo(tipo_registro: string, dados: any): string {
  try {
    switch (tipo_registro) {
      case 'hipotese':
        return dados.hipotese || 'Hipótese registrada';
      
      case 'evidencia':
        return dados.descricao || dados.evidencia || 'Evidência coletada';
      
      case 'perfil_personagem':
        const nome = dados.nome || 'Personagem';
        const motivacoes = dados.motivacoes ? ` - ${dados.motivacoes}` : '';
        return `Perfil de ${nome}${motivacoes}`;
      
      case 'entrada_timeline':
        const horario = dados.horario ? `[${dados.horario}] ` : '';
        return `${horario}${dados.descricao || 'Evento registrado'}`;
      
      case 'registro_misc':
        return dados.conteudo || dados.descricao || 'Registro adicional';
      
      default:
        // Tentar extrair qualquer texto relevante
        if (typeof dados === 'string') return dados;
        return dados.descricao || dados.conteudo || dados.texto || 'Registro salvo';
    }
  } catch (error) {
    return 'Registro processado';
  }
}

// Função para agrupar registros por categoria
function agruparRegistros(registros: any[]) {
  const grupos = {
    hipoteses: [] as any[],
    evidencias: [] as any[],
    personagens: [] as any[],
    timeline: [] as any[],
    outros: [] as any[]
  };

  registros.forEach(registro => {
    const item = {
      timestamp: registro.timestamp,
      autor: registro.autor,
      tipo_registro: registro.tipo_registro,
      resumo: criarResumo(registro.tipo_registro, registro.dados),
      probabilidade: registro.probabilidade
    };

    switch (registro.tipo_registro) {
      case 'hipotese':
        grupos.hipoteses.push(item);
        break;
      case 'evidencia':
        grupos.evidencias.push(item);
        break;
      case 'perfil_personagem':
        grupos.personagens.push(item);
        break;
      case 'entrada_timeline':
        grupos.timeline.push(item);
        break;
      default:
        grupos.outros.push(item);
    }
  });

  return grupos;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Aceitar apenas GET
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      erro: 'Método não permitido. Use GET.' 
    });
  }

  try {
    await initializeDatabase();           // ← Acorda o banco
    const pool = getDbPool();             // ← Cria pool seguro


    // Extrair idCaso
    const { idCaso } = req.query;

    if (!idCaso || typeof idCaso !== 'string') {
      return res.status(400).json({ 
        erro: 'Parâmetro "idCaso" é obrigatório' 
      });
    }

    // Verificar se o caso existe (aceita aliases)
    const casoInfo = await getCasoStatus(idCaso);
    
    if (!casoInfo) {
      return res.status(404).json({ 
        erro: 'Caso não encontrado',
        idCaso: idCaso
      });
    }

    // Buscar todos os registros do caso usando o id_caso real
    const query = `
      SELECT 
        id,
        id_caso,
        tipo_registro,
        autor,
        dados,
        timestamp,
        probabilidade,
        especialista,
        etapa
      FROM registros
      WHERE id_caso = $1
      ORDER BY timestamp ASC
    `;

    const result = await client.query(query, [casoInfo.id_caso]);

    if (result.rows.length === 0) {
      return res.status(200).json({
        id_caso: casoInfo.id_caso,
        status_caso: {
          etapa: casoInfo.etapa,
          especialista: casoInfo.especialista,
          probabilidade: casoInfo.probabilidade
        },
        narrativa: [],
        grupos: {
          hipoteses: [],
          evidencias: [],
          personagens: [],
          timeline: [],
          outros: []
        },
        mensagem: 'Caso registrado mas sem investigações ainda'
      });
    }

    // Criar narrativa linear
    const narrativa = result.rows.map(registro => ({
      timestamp: registro.timestamp,
      autor: registro.autor,
      tipo_registro: registro.tipo_registro,
      resumo: criarResumo(registro.tipo_registro, registro.dados),
      probabilidade: registro.probabilidade
    }));

    // Agrupar registros por tipo
    const grupos = agruparRegistros(result.rows);

    // Estatísticas do caso
    const estatisticas = {
      total_registros: result.rows.length,
      total_hipoteses: grupos.hipoteses.length,
      total_evidencias: grupos.evidencias.length,
      total_personagens: grupos.personagens.length,
      total_timeline: grupos.timeline.length,
      primeira_entrada: result.rows[0]?.timestamp,
      ultima_entrada: result.rows[result.rows.length - 1]?.timestamp,
      autores_unicos: [...new Set(result.rows.map(r => r.autor))],
      especialistas_envolvidos: [...new Set(result.rows.map(r => r.especialista).filter(Boolean))]
    };

    // Retornar resposta estruturada
    return res.status(200).json({
      id_caso: casoInfo.id_caso,
      status_caso: {
        etapa: casoInfo.etapa,
        especialista: casoInfo.especialista,
        probabilidade: casoInfo.probabilidade,
        timestamp_caso: casoInfo.timestamp
      },
      narrativa: narrativa,
      grupos: grupos,
      estatisticas: estatisticas
    });

  } catch (error) {
    console.error('Erro ao reencenar caso:', error);
    
    return res.status(500).json({ 
      erro: 'Erro interno ao processar reencenação',
      detalhes: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  } finally {
    client.release();
  }
}