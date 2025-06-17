import { Pool, PoolClient } from 'pg';

let pool: Pool | null = null;

export function getDbPool(): Pool {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is required');
    }

    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 15000,
      idleTimeoutMillis: 10000,
    });

    pool.on('error', (err) => {
      console.error('Erro inesperado no pool de conexões:', err);
    });
  }

  return pool;
}

// Interface para o registro
export interface RegistroData {
  tipo_registro: 'hipotese' | 'evidencia' | 'perfil_personagem' | 'entrada_timeline' | 'registro_misc';
  autor: string;
  dados: Record<string, any>;
  timestamp?: string;
  id_caso: string;
  etapa: string;
  especialista: string;
  probabilidade?: number;
}

// Função helper para executar queries com retry
async function executeQueryWithRetry(
  query: string, 
  params: any[] = [], 
  maxRetries: number = 2
): Promise<any> {
  let lastError: Error | undefined;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const dbPool = getDbPool();
    let client: PoolClient | undefined;
    
    try {
      client = await dbPool.connect();
      const result = await client.query(query, params);
      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      console.error(`Tentativa ${attempt + 1} falhou:`, error);
      
      // Se não for erro de timeout ou conexão, não tentar novamente
      if (error instanceof Error && 
          !error.message.includes('timeout') && 
          !error.message.includes('connection')) {
        throw error;
      }
      
      // Aguardar antes de tentar novamente
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    } finally {
      if (client) {
        client.release();
      }
    }
  }
  
  throw lastError || new Error('Query failed after all retries');
}

// Função para criar as tabelas se não existirem
export async function initializeDatabase(): Promise<void> {
  const createTablesQuery = `
    -- Criar tabela de registros
    CREATE TABLE IF NOT EXISTS registros (
      id SERIAL PRIMARY KEY,
      id_registro UUID DEFAULT gen_random_uuid() UNIQUE,
      tipo_registro VARCHAR(50) NOT NULL,
      autor VARCHAR(255) NOT NULL,
      dados JSONB NOT NULL,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      id_caso VARCHAR(255) NOT NULL,
      etapa VARCHAR(255) NOT NULL,
      especialista VARCHAR(255) NOT NULL,
      probabilidade DECIMAL(3,2),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE INDEX IF NOT EXISTS idx_registros_id_caso ON registros(id_caso);
    CREATE INDEX IF NOT EXISTS idx_registros_tipo ON registros(tipo_registro);
    CREATE INDEX IF NOT EXISTS idx_registros_timestamp ON registros(timestamp);

    -- Criar tabela de casos
    CREATE TABLE IF NOT EXISTS casos (
      id_caso TEXT PRIMARY KEY,
      etapa TEXT NOT NULL,
      especialista TEXT NOT NULL,
      probabilidade REAL,
      timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE INDEX IF NOT EXISTS idx_casos_id_caso ON casos(id_caso);

    -- Criar tabela de aliases
    CREATE TABLE IF NOT EXISTS caso_aliases (
      id SERIAL PRIMARY KEY,
      id_caso TEXT NOT NULL,
      alias TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(id_caso, alias),
      FOREIGN KEY (id_caso) REFERENCES casos(id_caso) ON DELETE CASCADE
    );
    
    CREATE INDEX IF NOT EXISTS idx_caso_aliases_alias ON caso_aliases(alias);
    CREATE INDEX IF NOT EXISTS idx_caso_aliases_id_caso ON caso_aliases(id_caso);
  `;

  try {
    await executeQueryWithRetry(createTablesQuery);
  } catch (error) {
    console.error('Erro ao inicializar banco de dados:', error);
    throw error;
  }
}

// Função unificada para promover caso
export async function promoverCaso(
  id_caso: string,
  etapa: string,
  especialista: string,
  probabilidade: number | null = null
): Promise<'criado' | 'atualizado'> {
  try {
    const existingQuery = 'SELECT id_caso FROM casos WHERE id_caso = $1 LIMIT 1';
    const existing = await executeQueryWithRetry(existingQuery, [id_caso]);

    if (existing.rowCount && existing.rowCount > 0) {
      const updateQuery = `
        UPDATE casos
        SET etapa = $1,
            especialista = $2,
            probabilidade = $3,
            timestamp = NOW(),
            updated_at = NOW()
        WHERE id_caso = $4
      `;
      await executeQueryWithRetry(updateQuery, [etapa, especialista, probabilidade, id_caso]);
      return 'atualizado';
    } else {
      const insertQuery = `
        INSERT INTO casos (id_caso, etapa, especialista, probabilidade)
        VALUES ($1, $2, $3, $4)
      `;
      await executeQueryWithRetry(insertQuery, [id_caso, etapa, especialista, probabilidade]);
      
      // Salvar aliases após criar o caso
      try {
        const { salvarAliases } = await import('./aliasUtils');
        await salvarAliases(id_caso, id_caso);
      } catch (err) {
        console.error('Erro ao salvar aliases:', err);
      }
      
      return 'criado';
    }
  } catch (error) {
    console.error('Erro ao promover caso:', error);
    throw error;
  }
}

// Função para inserir um novo registro
export async function insertRegistro(data: RegistroData): Promise<string> {
  const query = `
    INSERT INTO registros (
      tipo_registro, autor, dados, timestamp, 
      id_caso, etapa, especialista, probabilidade
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING id_registro
  `;
  
  const values = [
    data.tipo_registro,
    data.autor,
    JSON.stringify(data.dados),
    data.timestamp || new Date().toISOString(),
    data.id_caso,
    data.etapa,
    data.especialista,
    data.probabilidade || null
  ];
  
  try {
    const result = await executeQueryWithRetry(query, values);
    if (!result.rows || result.rows.length === 0) {
      throw new Error('Failed to insert registro: no id_registro returned');
    }
    return result.rows[0].id_registro;
  } catch (error) {
    console.error('Erro ao inserir registro:', error);
    throw error;
  }
}

// Função para buscar registros por caso
export async function getRegistrosPorCaso(id_caso: string) {
  const query = `
    SELECT * FROM registros 
    WHERE id_caso = $1 
    ORDER BY timestamp DESC
  `;
  
  try {
    const result = await executeQueryWithRetry(query, [id_caso]);
    return result.rows || [];
  } catch (error) {
    console.error('Erro ao buscar registros por caso:', error);
    throw error;
  }
}

// Função para buscar um registro específico
export async function getRegistroPorId(id_registro: string) {
  const query = `SELECT * FROM registros WHERE id_registro = $1`;
  
  try {
    const result = await executeQueryWithRetry(query, [id_registro]);
    return result.rows?.[0] || null;
  } catch (error) {
    console.error('Erro ao buscar registro por ID:', error);
    throw error;
  }
}

// Função para buscar o status de um caso
export async function getCasoStatus(idCaso: string) {
  try {
    // Primeiro tenta buscar direto pelo id_caso
    let query = `
      SELECT 
        id_caso,
        etapa,
        especialista,
        probabilidade,
        timestamp
      FROM casos 
      WHERE id_caso = $1
    `;
    let result = await executeQueryWithRetry(query, [idCaso]);
    
    // Se não encontrar, tenta buscar por alias
    if (!result.rowCount || result.rowCount === 0) {
      query = `
        SELECT 
          c.id_caso,
          c.etapa,
          c.especialista,
          c.probabilidade,
          c.timestamp
        FROM casos c
        INNER JOIN caso_aliases ca ON c.id_caso = ca.id_caso
        WHERE ca.alias = $1
        LIMIT 1
      `;
      result = await executeQueryWithRetry(query, [idCaso]);
    }
    
    return result.rows?.[0] || null;
  } catch (error) {
    console.error('Erro ao buscar status do caso:', error);
    throw error;
  }
}

// Função para atualizar ou criar status de caso
export async function upsertCasoStatus(
  idCaso: string,
  etapa: string,
  especialista: string,
  probabilidade?: number
) {
  const query = `
    INSERT INTO casos (id_caso, etapa, especialista, probabilidade, timestamp)
    VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
    ON CONFLICT (id_caso) 
    DO UPDATE SET 
      etapa = EXCLUDED.etapa,
      especialista = EXCLUDED.especialista,
      probabilidade = EXCLUDED.probabilidade,
      timestamp = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
    RETURNING *
  `;
  
  const values = [idCaso, etapa, especialista, probabilidade || null];
  
  try {
    const result = await executeQueryWithRetry(query, values);
    return result.rows?.[0] || null;
  } catch (error) {
    console.error('Erro ao atualizar/criar status do caso:', error);
    throw error;
  }
}

// Função para buscar casos recentes
export async function getCasosRecentes(limit: number = 10) {
  const query = `
    SELECT id_caso, etapa, especialista, probabilidade, timestamp
    FROM casos
    ORDER BY timestamp DESC
    LIMIT $1
  `;
  
  try {
    const result = await executeQueryWithRetry(query, [limit]);
    return result.rows || [];
  } catch (error) {
    console.error('Erro ao buscar casos recentes:', error);
    throw error;
  }
}