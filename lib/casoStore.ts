// lib/casoStore.ts — usando pool manager singleton

import poolManager from './database/poolManager';

export interface CasoStatus {
  etapa: string;
  especialista: string;
  probabilidade?: number; // Nunca null, sempre number ou undefined
  timestamp: string;
}

export async function getCaseStatus(idCaso: string): Promise<CasoStatus | null> {
  try {
    const { rows } = await poolManager.query<CasoStatus>(
      `SELECT etapa, especialista, probabilidade, timestamp
         FROM casos
        WHERE id_caso = $1
     ORDER BY timestamp DESC
        LIMIT 1`,
      [idCaso]
    );
    
    return rows[0] ?? null;
  } catch (error) {
    console.error('❌ Erro ao buscar status do caso:', error);
    throw error;
  }
}

export async function saveCaseStatus(idCaso: string, status: CasoStatus): Promise<void> {
  const { etapa, especialista, probabilidade, timestamp } = status;
  
  // Validar probabilidade se fornecida
  if (probabilidade !== undefined && (probabilidade < 0 || probabilidade > 100)) {
    throw new Error(`Probabilidade inválida: ${probabilidade}. Deve estar entre 0 e 100.`);
  }
  
  try {
    await poolManager.query(
      `INSERT INTO casos (id_caso, etapa, especialista, probabilidade, timestamp)
           VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id_caso, timestamp) 
       DO UPDATE SET 
           etapa = EXCLUDED.etapa,
           especialista = EXCLUDED.especialista,
           probabilidade = EXCLUDED.probabilidade`,
      [idCaso, etapa, especialista, probabilidade ?? null, timestamp]
    );
  } catch (error) {
    console.error('❌ Erro ao salvar status do caso:', error);
    throw error;
  }
}

/**
 * Salva um novo registro bruto (hipótese, evidência, etc.)
 */
export async function saveRegistro(
  tipo_registro: string,
  autor: string,
  dados: Record<string, any>,
  trace_id?: string
): Promise<number> {
  // Validações
  const tiposValidos = ['hipotese', 'evidencia', 'perfil_personagem', 'entrada_timeline', 'registro_misc', 'cross_validation_result'];
  if (!tiposValidos.includes(tipo_registro)) {
    throw new Error(`Tipo de registro inválido: ${tipo_registro}`);
  }
  
  try {
    const result = await poolManager.query<{ id: number }>(
      `INSERT INTO registros (tipo_registro, autor, dados, trace_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [tipo_registro, autor, dados, trace_id || null]
    );
    
    return result.rows[0].id;
  } catch (error) {
    console.error('❌ Erro ao salvar registro:', error);
    throw error;
  }
}

/**
 * Busca registros por trace_id
 */
export async function getRegistrosByTraceId(trace_id: string): Promise<any[]> {
  try {
    const { rows } = await poolManager.query(
      `SELECT * FROM registros 
       WHERE trace_id = $1 
       ORDER BY timestamp ASC`,
      [trace_id]
    );
    
    return rows;
  } catch (error) {
    console.error('❌ Erro ao buscar registros por trace_id:', error);
    throw error;
  }
}

/**
 * Busca o histórico completo de um caso
 */
export async function getCaseHistory(idCaso: string): Promise<CasoStatus[]> {
  try {
    const { rows } = await poolManager.query<CasoStatus>(
      `SELECT etapa, especialista, probabilidade, timestamp
         FROM casos
        WHERE id_caso = $1
     ORDER BY timestamp ASC`,
      [idCaso]
    );
    
    return rows;
  } catch (error) {
    console.error('❌ Erro ao buscar histórico do caso:', error);
    throw error;
  }
}

/**
 * Atualiza a probabilidade de um caso
 */
export async function updateCaseProbability(
  idCaso: string, 
  probabilidade: number
): Promise<void> {
  if (probabilidade < 0 || probabilidade > 100) {
    throw new Error(`Probabilidade inválida: ${probabilidade}. Deve estar entre 0 e 100.`);
  }
  
  try {
    const result = await poolManager.query(
      `UPDATE casos 
       SET probabilidade = $1, 
           timestamp = CURRENT_TIMESTAMP
       WHERE id_caso = $2 
         AND timestamp = (
           SELECT MAX(timestamp) 
           FROM casos 
           WHERE id_caso = $2
         )`,
      [probabilidade, idCaso]
    );
    
    if (result.rowCount === 0) {
      throw new Error(`Caso ${idCaso} não encontrado`);
    }
  } catch (error) {
    console.error('❌ Erro ao atualizar probabilidade:', error);
    throw error;
  }
}
