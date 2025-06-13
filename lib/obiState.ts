
import fs from 'fs';
import path from 'path';
import type { SyndicateContext } from './runtimeOrchestrator';

const OBI_STATE_PATH = path.join(__dirname, 'estado_do_obi.json');

export async function getCaseStatus(idCaso: string): Promise<SyndicateContext | null> {
  if (!fs.existsSync(OBI_STATE_PATH)) return null;

  const data = JSON.parse(fs.readFileSync(OBI_STATE_PATH, 'utf-8'));
  const match = data.find((entry: any) => entry.id_caso === idCaso);

  if (!match) return null;

  return {
    idRegistro: 'recuperado',
    contexto: match.contexto.descricao,
    autor: 'L',
    etapa: match.etapa,
    especialista: match.especialistas_ativos?.[0] || 'desconhecido',
    idCaso: match.id_caso,
    probabilidade: match.contexto.probabilidade,
    timestamp: match.atualizado_em
  };
}

export async function saveCaseStatus(context: SyndicateContext): Promise<void> {
  let data: any[] = [];

  if (fs.existsSync(OBI_STATE_PATH)) {
    data = JSON.parse(fs.readFileSync(OBI_STATE_PATH, 'utf-8'));
  }

  const existingIndex = data.findIndex(entry => entry.id_caso === context.idCaso);

  const updated = {
    id_caso: context.idCaso,
    etapa: context.etapa,
    especialistas_ativos: [context.especialista],
    contexto: {
      descricao: context.contexto,
      probabilidade: context.probabilidade
    },
    atualizado_em: context.timestamp
  };

  if (existingIndex !== -1) {
    data[existingIndex] = updated;
  } else {
    data.push(updated);
  }

  fs.writeFileSync(OBI_STATE_PATH, JSON.stringify(data, null, 2));
}
