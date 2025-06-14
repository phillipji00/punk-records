import { Pool, PoolConfig } from 'pg';

// Validar configuração antes de criar pool
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL não configurada!');
  if (process.env.NODE_ENV === 'production') {
    throw new Error('DATABASE_URL é obrigatória em produção');
  }
  // Em desenvolvimento, usar URL padrão local
  console.warn(⚠️ Usando banco de dados local de desenvolvimento');
  process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/syndicate_dev';
}

// Configuração do pool com resiliência
const poolConfig: PoolConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' 
    ? { rejectUnauthorized: false }
    : false,
  // Configurações de resiliência
  connectionTimeoutMillis: 5000,  // Timeout de conexão: 5 segundos
  idleTimeoutMillis: 30000,       // Timeout de idle: 30 segundos
  max: 20,                        // Máximo de conexões no pool
  min: 2,                         // Mínimo de conexões no pool
  allowExitOnIdle: true,          // Permite que o processo termine se todas as conexões estiverem idle
};

const pool = new Pool(poolConfig);

// Adicionar handler de erro global
pool.on('error', (err) => {
  console.error('❌ Erro inesperado no pool de conexões:', err);
  // Não fazer throw aqui, pois isso crasharia o processo
  // O pool tentará reconectar automaticamente
});

// Log quando uma nova conexão é estabelecida
pool.on('connect', () => {
  console.log('✅ Nova conexão estabelecida com o banco de dados');
});

// Log quando uma conexão é removida
pool.on('remove', () => {
  console.log('🔄 Conexão removida do pool');
});

// Função helper para testar a conexão
export async function testConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    console.log('✅ Conexão com banco de dados verificada com sucesso');
    return true;
  } catch (error) {
    console.error('❌ Falha ao conectar com o banco de dados:', error);
    return false;
  }
}

// Função para obter status do pool
export function getPoolStatus() {
  return {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount,
  };
}

// Função para fechar o pool gracefully
export async function closePool(): Promise<void> {
  try {
    await pool.end();
    console.log('✅ Pool de conexões fechado com sucesso');
  } catch (error) {
    console.error('❌ Erro ao fechar pool de conexões:', error);
  }
}

// Tratamento de shutdown gracioso
process.on('SIGTERM', async () => {
  console.log('📛 SIGTERM recebido, fechando conexões...');
  await closePool();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('📛 SIGINT recebido, fechando conexões...');
  await closePool();
  process.exit(0);
});

export default pool;