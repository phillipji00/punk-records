import { sql } from '@vercel/postgres';

export function generateAliases(nomeNatural: string): string[] {
  const normalized = nomeNatural
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // remove acentos
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

  for (const alias of aliases) {
    try {
      await sql`
        INSERT INTO caso_aliases (id_caso, alias)
        VALUES (${id_caso}, ${alias})
        ON CONFLICT (id_caso, alias) DO NOTHING
      `;
    } catch (err) {
      console.error('Erro ao salvar alias:', alias, err);
    }
  }
}
