import { Pool } from 'pg';

// Configuração do pool de conexões para o Neon
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
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
  } finally {
    client.release();
  }
}

// Função para buscar o status de um caso
export async function getCasoStatus(idCaso: string) {
  const client = await pool.connect();
  try {
    const query = `
      SELECT 
        id_caso,
        etapa,
        especialista,
        probabilidade,
        timestamp
      FROM casos 
      WHERE id_caso = $1
    `;
    const result = await client.query(query, [idCaso]);
    return result.rows[0] || null;
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
  } finally {
    client.release();
  }
}

// Exporta o pool para uso direto se necessário
export default pool;