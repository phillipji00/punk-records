import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeDatabase, promoverCaso } from '../../lib/dbClient';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      erro: 'Método não permitido',
      permitido: 'POST'
    });
  }

  const { id_caso, etapa, especialista, probabilidade } = req.body;

  if (!id_caso || !etapa || !especialista) {
    return res.status(400).json({
      erro: 'Campos obrigatórios ausentes: id_caso, etapa e especialista são necessários.'
    });
  }

  try {
    await initializeDatabase();
    const resultado = await promoverCaso(id_caso, etapa, especialista, probabilidade ?? null);

    if (resultado === 'atualizado') {
      return res.status(200).json({
        status: 'ok',
        mensagem: `Caso '${id_caso}' promovido com sucesso.`
      });
    } else {
      return res.status(201).json({
        status: 'criado',
        mensagem: `Novo caso '${id_caso}' registrado com sucesso.`
      });
    }
  } catch (error) {
    console.error('Erro ao promover caso:', error);
    return res.status(500).json({
      erro: 'Erro interno ao promover caso',
      detalhes: error instanceof Error ? error.message : String(error)
    });
  }
}
