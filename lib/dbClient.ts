import { Pool } from 'pg';

// Configuração do pool de conexões para o Neon
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : undefined,
  // Configurações otimizadas para serverless
  max: 1,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 10000
});

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

// Função para criar as tabelas se não existirem
export async function initializeDatabase() {
  const client = await pool.connect();
  try {
    // Criar tabela de registros
    await client.query(`
      CREATE TABLE IF NOT EXISTS registros (
        id_registro UUID DEFAULT gen_random_uuid() PRIMARY KEY,
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
    `);

    // Criar tabela de casos
    await client.query(`
      CREATE TABLE IF NOT EXISTS casos (
        id SERIAL PRIMARY KEY,
        id_caso TEXT UNIQUE NOT NULL,
        etapa TEXT NOT NULL,
        especialista TEXT NOT NULL,
        probabilidade REAL,
        timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_casos_id_caso ON casos(id_caso);
    `);

    // Criar tabela de aliases
    await client.query(`
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
    `);
  } catch (error) {
    console.error('Erro ao inicializar banco de dados:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Função unificada para promover caso
export async function promoverCaso(
  id_caso: string,
  etapa: string,
  especialista: string,
  probabilidade: number | null = null
): Promise<'criado' | 'atualizado'> {
  const client = await pool.connect();
  try {
    const existingQuery = 'SELECT id FROM casos WHERE id_caso = $1 LIMIT 1';
    const existing = await client.query(existingQuery, [id_caso]);

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
      await client.query(updateQuery, [etapa, especialista, probabilidade, id_caso]);
      return 'atualizado';
    } else {
      const insertQuery = `
        INSERT INTO casos (id_caso, etapa, especialista, probabilidade)
        VALUES ($1, $2, $3, $4)
      `;
      await client.query(insertQuery, [id_caso, etapa, especialista, probabilidade]);
      
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
  } finally {
    client.release();
  }
}

// Função para inserir um novo registro
export async function insertRegistro(data: RegistroData): Promise<string> {
  const client = await pool.connect();
  try {
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
    
    const result = await client.query(query, values);
    return result.rows[0].id_registro;
  } catch (error) {
    console.error('Erro ao inserir registro:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Função para buscar registros por caso
export async function getRegistrosPorCaso(id_caso: string) {
  const client = await pool.connect();
  try {
    const query = `
      SELECT * FROM registros 
      WHERE id_caso = $1 
      ORDER BY timestamp DESC
    `;
    const result = await client.query(query, [id_caso]);
    return result.rows;
  } catch (error) {
    console.error('Erro ao buscar registros por caso:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Função para buscar um registro específico
export async function getRegistroPorId(id_registro: string) {
  const client = await pool.connect();
  try {
    const query = `SELECT * FROM registros WHERE id_registro = $1`;
    const result = await client.query(query, [id_registro]);
    return result.rows[0] || null;
  } catch (error) {
    console.error('Erro ao buscar registro por ID:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Função para buscar o status de um caso
export async function getCasoStatus(idCaso: string) {
  const client = await pool.connect();
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
    let result = await client.query(query, [idCaso]);
    
    // Se não encontrar, tenta buscar por alias
    if (result.rowCount === 0) {
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
      result = await client.query(query, [idCaso]);
    }
    
    return result.rows[0] || null;
  } catch (error) {
    console.error('Erro ao buscar status do caso:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Função para atualizar ou criar status de caso
export async function upsertCasoStatus(
  idCaso: string,
  etapa: string,
  especialista: string,
  probabilidade?: number
) {
  const client = await pool.connect();
  try {
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
    const result = await client.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error('Erro ao atualizar/criar status do caso:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Função para buscar casos recentes
export async function getCasosRecentes(limit: number = 10) {
  const client = await pool.connect();
  try {
    const query = `
      SELECT id_caso, etapa, especialista, probabilidade, timestamp
      FROM casos
      ORDER BY timestamp DESC
      LIMIT $1
    `;
    const result = await client.query(query, [limit]);
    return result.rows;
  } catch (error) {
    console.error('Erro ao buscar casos recentes:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Exporta o pool para uso direto se necessário
export default pool;