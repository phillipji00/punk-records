import { Pool, PoolConfig, PoolClient, QueryResult } from 'pg';

interface PoolStats {
  totalCount: number;
  idleCount: number;
  waitingCount: number;
}

// Interface para resultados de query
interface QueryResultRow {
  [column: string]: any;
}

class PoolManager {
  private static instance: PoolManager;
  private pool: Pool | null = null;
  private config: PoolConfig;
  private isShuttingDown: boolean = false;
  
  private constructor() {
    // Validar DATABASE_URL
    if (!process.env.DATABASE_URL) {
      console.error('❌ DATABASE_URL não configurada!');
      if (process.env.NODE_ENV === 'production') {
        throw new Error('DATABASE_URL é obrigatória em produção');
      }
      // Em desenvolvimento, usar URL padrão
      process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/syndicate_dev';
      console.warn('⚠️ Usando banco de dados local de desenvolvimento');
    }
    
    this.config = {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' 
        ? { rejectUnauthorized: false }
        : false,
      max: 20,                          // Máximo de conexões
      min: 2,                           // Mínimo de conexões
      idleTimeoutMillis: 30000,         // 30 segundos
      connectionTimeoutMillis: 5000,    // 5 segundos
      maxUses: 7500,                    // Reconectar após 7500 queries
    };
  }
  
  static getInstance(): PoolManager {
    if (!PoolManager.instance) {
      PoolManager.instance = new PoolManager();
    }
    return PoolManager.instance;
  }
  
  getPool(): Pool {
    if (this.isShuttingDown) {
      throw new Error('Pool está sendo encerrado');
    }
    
    if (!this.pool) {
      this.pool = new Pool(this.config);
      this.setupPoolHandlers();
    }
    
    return this.pool;
  }
  
  private setupPoolHandlers(): void {
    if (!this.pool) return;
    
    // Monitorar erros do pool
    this.pool.on('error', (err) => {
      console.error('❌ Pool error:', err);
      // Não fazer throw - o pool tentará reconectar
    });
    
    // Log de conexões (apenas em desenvolvimento)
    if (process.env.NODE_ENV !== 'production') {
      this.pool.on('connect', () => {
        console.log('✅ Nova conexão estabelecida');
      });
      
      this.pool.on('acquire', () => {
        console.log('🔄 Cliente adquirido do pool');
      });
      
      this.pool.on('remove', () => {
        console.log('🔄 Cliente removido do pool');
      });
    }
  }
  
  async closePool(): Promise<void> {
    if (!this.pool || this.isShuttingDown) return;
    
    this.isShuttingDown = true;
    
    try {
      await this.pool.end();
      console.log('✅ Pool de conexões fechado com sucesso');
      this.pool = null;
    } catch (error) {
      console.error('❌ Erro ao fechar pool:', error);
      throw error;
    } finally {
      this.isShuttingDown = false;
    }
  }
  
  async getHealthStatus(): Promise<PoolStats & { healthy: boolean }> {
    try {
      const pool = this.getPool();
      const stats: PoolStats = {
        totalCount: pool.totalCount,
        idleCount: pool.idleCount,
        waitingCount: pool.waitingCount,
      };
      
      // Testar conexão
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();
      
      return {
        ...stats,
        healthy: true
      };
    } catch (error) {
      console.error('❌ Health check falhou:', error);
      return {
        totalCount: 0,
        idleCount: 0,
        waitingCount: 0,
        healthy: false
      };
    }
  }
  
  // Método helper para queries com retry - Versão correta com tipos
  async query<T extends QueryResultRow = QueryResultRow>(
    text: string, 
    params?: any[], 
    retries: number = 3
  ): Promise<QueryResult<T>> {
    const pool = this.getPool();
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        // Cast necessário para compatibilidade com versões mais novas do @types/pg
        const result = await pool.query(text, params) as QueryResult<T>;
        return result;
      } catch (error: any) {
        lastError = error;
        console.error(`❌ Query falhou (tentativa ${attempt}/${retries}):`, error.message);
        
        // Não fazer retry em erros de sintaxe ou validação
        if (error.code === '42601' || error.code === '42703' || error.code === '23502') {
          throw error;
        }
        
        // Aguardar antes de tentar novamente
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, attempt * 1000));
        }
      }
    }
    
    throw lastError;
  }
  
  // Método para transações
  async transaction<T>(
    callback: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    const pool = this.getPool();
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

// Singleton instance
const poolManager = PoolManager.getInstance();

// Handlers de shutdown
process.on('SIGTERM', async () => {
  console.log('📛 SIGTERM recebido - fechando pool...');
  await poolManager.closePool();
});

process.on('SIGINT', async () => {
  console.log('📛 SIGINT recebido - fechando pool...');
  await poolManager.closePool();
});

// Criar funções wrapper para export - Solução limpa
const query = <T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: any[],
  retries?: number
): Promise<QueryResult<T>> => {
  return poolManager.query<T>(text, params, retries);
};

const transaction = <T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> => {
  return poolManager.transaction(callback);
};

const getHealthStatus = (): Promise<PoolStats & { healthy: boolean }> => {
  return poolManager.getHealthStatus();
};

const closePool = (): Promise<void> => {
  return poolManager.closePool();
};

// Exportar instance e métodos
export default poolManager;
export { query, transaction, getHealthStatus, closePool };