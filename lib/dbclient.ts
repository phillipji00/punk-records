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

// Função para criar a tabela se não existir
export async function initializeDatabase() {
  const client = await pool.connect();
  try {
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

// Exporta o pool para uso direto se necessário
export default pool;