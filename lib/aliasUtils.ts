import { getDbPool } from './dbClient';

// Função para salvar aliases de um caso
export async function salvarAliases(id_caso: string, alias: string) {
  try {
    const pool = getDbPool(); // ← Corrigido: usar getDbPool()
    const client = await pool.connect();
    
    try {
      const query = `
        INSERT INTO caso_aliases (id_caso, alias)
        VALUES ($1, $2)
        ON CONFLICT (id_caso, alias) DO NOTHING
      `;
      
      await client.query(query, [id_caso, alias]);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Erro ao salvar aliases:', error);
    throw error;
  }
}

// Função para buscar aliases de um caso
export async function buscarAliases(id_caso: string): Promise<string[]> {
  try {
    const pool = getDbPool(); // ← Corrigido: usar getDbPool()
    const client = await pool.connect();
    
    try {
      const query = `
        SELECT alias 
        FROM caso_aliases 
        WHERE id_caso = $1
        ORDER BY created_at ASC
      `;
      
      const result = await client.query(query, [id_caso]);
      return result.rows.map(row => row.alias);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Erro ao buscar aliases:', error);
    throw error;
  }
}

// Função para encontrar caso por alias
export async function encontrarCasoPorAlias(alias: string): Promise<string | null> {
  try {
    const pool = getDbPool(); // ← Corrigido: usar getDbPool()
    const client = await pool.connect();
    
    try {
      const query = `
        SELECT id_caso 
        FROM caso_aliases 
        WHERE alias = $1
        LIMIT 1
      `;
      
      const result = await client.query(query, [alias]);
      return result.rows[0]?.id_caso || null;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Erro ao encontrar caso por alias:', error);
    throw error;
  }
}

// Função para remover alias
export async function removerAlias(id_caso: string, alias: string): Promise<boolean> {
  try {
    const pool = getDbPool(); // ← Corrigido: usar getDbPool()
    const client = await pool.connect();
    
    try {
      const query = `
        DELETE FROM caso_aliases 
        WHERE id_caso = $1 AND alias = $2
      `;
      
      const result = await client.query(query, [id_caso, alias]);
      return (result.rowCount || 0) > 0;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Erro ao remover alias:', error);
    throw error;
  }
}

// Função para verificar se alias já existe
export async function aliasExiste(alias: string): Promise<boolean> {
  try {
    const pool = getDbPool(); // ← Corrigido: usar getDbPool()
    const client = await pool.connect();
    
    try {
      const query = `
        SELECT 1 
        FROM caso_aliases 
        WHERE alias = $1
        LIMIT 1
      `;
      
      const result = await client.query(query, [alias]);
      return result.rows.length > 0;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Erro ao verificar se alias existe:', error);
    throw error;
  }
}

// Função para listar todos os aliases do sistema
export async function listarTodosAliases(): Promise<{id_caso: string, alias: string, created_at: string}[]> {
  try {
    const pool = getDbPool(); // ← Corrigido: usar getDbPool()
    const client = await pool.connect();
    
    try {
      const query = `
        SELECT id_caso, alias, created_at 
        FROM caso_aliases 
        ORDER BY created_at DESC
      `;
      
      const result = await client.query(query);
      return result.rows;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Erro ao listar todos os aliases:', error);
    throw error;
  }
}

// Função para adicionar múltiplos aliases de uma vez
export async function adicionarMultiplosAliases(id_caso: string, aliases: string[]): Promise<void> {
  if (aliases.length === 0) return;
  
  try {
    const pool = getDbPool(); // ← Corrigido: usar getDbPool()
    const client = await pool.connect();
    
    try {
      // Usar transaction para garantir atomicidade
      await client.query('BEGIN');
      
      for (const alias of aliases) {
        const query = `
          INSERT INTO caso_aliases (id_caso, alias)
          VALUES ($1, $2)
          ON CONFLICT (id_caso, alias) DO NOTHING
        `;
        await client.query(query, [id_caso, alias]);
      }
      
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Erro ao adicionar múltiplos aliases:', error);
    throw error;
  }
}