import pool from './dbClient';

export function generateAliases(nomeNatural: string): string[] {
  const normalized = nomeNatural
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos corretamente
    .toLowerCase();

  const palavras = normalized.split(/\s+/);

  const abreviacoes: Record<string, string> = {
    monte: 'mt',
    montanha: 'mtn',
    heranca: 'hrc',
    sinclair: 'sclr',
    investigacao: 'inv',
    eco: 'eco',
    timeline: 'tl',
  };

  const combinacoes = [
    palavras.join('_'),
    palavras.join('-'),
    palavras.join(''),
    palavras.slice(0, 2).join(''),
    palavras.slice(-2).join(''),
    ...palavras
  ];

  // Adiciona versões com abreviações
  const comAbreviacoes = palavras.map(p => abreviacoes[p] || p);
  combinacoes.push(comAbreviacoes.join('_'));
  combinacoes.push(comAbreviacoes.join('-'));

  const unicos = new Set(combinacoes);
  return [...unicos].filter(a => a.length > 2);
}

export async function salvarAliases(id_caso: string, nomeNatural: string) {
  const aliases = generateAliases(nomeNatural);
  const client = await pool.connect();

  try {
    for (const alias of aliases) {
      try {
        await client.query(
          `INSERT INTO caso_aliases (id_caso, alias)
           VALUES ($1, $2)
           ON CONFLICT (id_caso, alias) DO NOTHING`,
          [id_caso, alias]
        );
      } catch (err) {
        console.error('Erro ao salvar alias:', alias, err);
      }
    }
  } finally {
    client.release();
  }
}