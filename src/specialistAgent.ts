import { ExecutionContext } from "../lib/types/common";
import { BaseSpecialist } from "../lib/types/common";

// Interface para o resultado da análise
export interface AnaliseEspecialista {
  especialista: string;
  analise: {
    hipotese: string;
    justificativa: string;
    nivel_confianca: number;
    acoes_recomendadas: string[];
  };
}

// Mapeamento de nomes para consistência com outros módulos
const SPECIALIST_NAME_MAP: Record<string, string> = {
  "L": "L Lawliet",
  "Senku": "Senku Ishigami",
  "Norman": "Norman",
  "Isagi": "Isagi Yoichi",
  "Obi": "Capitão Obi"
};

// Extrai dados do contexto de forma segura
function extractContextData(context: ExecutionContext): {
  autor: string;
  contextoNarrativo: string;
  dados: Record<string, any>;
  probabilidade: number;
} {
  // Extrair autor do specialist ativado ou do input
  const autor = context.state.activatedSpecialists?.[0] || 
                context.input.metadata?.specialist ||
                'L'; // default
  
  // Extrair narrativa do input
  const contextoNarrativo = context.input.content || '';
  
  // Extrair dados dos metadados ou criar objeto vazio
  const dados = context.input.metadata || {};
  
  // Extrair probabilidade/confiança dos metadados ou usar default
  const probabilidade = context.input.metadata?.confidence || 
                       context.input.metadata?.probabilidade || 
                       0.75;
  
  return { autor, contextoNarrativo, dados, probabilidade };
}

export function gerarAnaliseEspecialista(context: ExecutionContext): AnaliseEspecialista {
  const { autor } = extractContextData(context);

  switch (autor) {
    case "Senku":
      return {
        especialista: "Senku",
        analise: {
          hipotese: "Documentos foram deliberadamente removidos para apagar vestígios da Guerra de Ruína e manipular a percepção histórica da região.",
          justificativa: "A triangulação dos vazios nos arquivos, combinada com as palavras-chave como 'fórmula' e 'sigilo', indicam um esforço sistemático de censura. Isso aponta para um valor histórico-científico intencionalmente escondido.",
          nivel_confianca: 0.93,
          acoes_recomendadas: [
            "Investigar as versões conflitantes de mapas históricos da Guerra de Ruína",
            "Comparar documentos censurados com versões arquivadas fora da região de Reddington",
            "Buscar evidências físicas de laboratórios ou arquivos escondidos em Mt. Holly"
          ]
        }
      };

    case "L":
      return {
        especialista: "L",
        analise: {
          hipotese: "A presença de documentos contraditórios e alterações legais sistemáticas indica uma organização com capacidade para reescrever registros oficiais.",
          justificativa: "A repetição de casos impossíveis e padrões legais alterados em diferentes anos sugere uma inteligência centralizada por trás dessas manipulações.",
          nivel_confianca: 0.91,
          acoes_recomendadas: [
            "Validar autenticidade dos registros de 1990-1993",
            "Verificar padrão de suicídios em advogados como possível cobertura",
            "Estabelecer matriz de correlação entre registros alterados e a localização Mt. Holly"
          ]
        }
      };

    case "Norman":
      return {
        especialista: "Norman",
        analise: {
          hipotese: "Simon pode ter sido alvo de manipulação psicológica para assumir o papel de herdeiro sem pleno consentimento.",
          justificativa: "O padrão de perfis quebrados e herdeiros induzidos a abdicar de heranças se alinha com o comportamento de Simon: confuso, emocionalmente vulnerável e isolado.",
          nivel_confianca: 0.89,
          acoes_recomendadas: [
            "Aplicar avaliação psicológica completa em Simon",
            "Analisar histórico familiar de manipulação ou isolamento",
            "Investigar relação entre o desaparecimento da mãe e o testamento de Herbert"
          ]
        }
      };

    case "Isagi":
      return {
        especialista: "Isagi",
        analise: {
          hipotese: "A arquitetura da mansão e os padrões nos objetos decorativos indicam um sistema de pistas estruturado para manipular movimentação e descobertas.",
          justificativa: "Elementos como cartas de baralho e disposição das portas funcionam como vetores de escolha que podem guiar ou desviar a rota do herdeiro. Herbert projetou o campo como um labirinto estratégico.",
          nivel_confianca: 0.87,
          acoes_recomendadas: [
            "Mapear completamente o layout interno da mansão",
            "Estabelecer lógica de recorrência nos símbolos decorativos",
            "Testar padrões de fluxo em grupo dentro da estrutura"
          ]
        }
      };

    case "Obi":
      return {
        especialista: "Obi",
        analise: {
          hipotese: "A convergência de múltiplas trilhas investigativas indica coordenação deliberada para proteger Simon e revelar verdades ocultas.",
          justificativa: "Fire Force sempre encontra o caminho! A análise integrada mostra que cada especialista foi direcionado aqui com propósito específico. Nossa missão é clara: proteger e descobrir.",
          nivel_confianca: 0.95,
          acoes_recomendadas: [
            "Coordenar entrada segura de todos os especialistas na propriedade",
            "Estabelecer perímetro de segurança contra ameaças externas",
            "Facilitar compartilhamento de informações entre especialistas",
            "Manter Simon protegido durante toda a investigação"
          ]
        }
      };

    default:
      throw new Error("Especialista não reconhecido: " + autor);
  }
}

// Função auxiliar para obter nome completo do especialista
export function getFullSpecialistName(shortName: string): string {
  return SPECIALIST_NAME_MAP[shortName] || shortName;
}

// Função para integração com qaRefiner
export async function refineAndAnalyze(context: ExecutionContext): Promise<AnaliseEspecialista> {
  const { probabilidade } = extractContextData(context);
  
  // Se confiança baixa, pode acionar o qaRefiner antes da análise
  if (probabilidade < 0.8) {
    console.log(`Confiança baixa (${(probabilidade * 100).toFixed(0)}%). Considere usar qaRefiner antes da análise.`);
  }
  
  return gerarAnaliseEspecialista(context);
}

// Função para converter análise em formato BaseSpecialist
export function toBaseSpecialist(analise: AnaliseEspecialista): BaseSpecialist {
  return {
    id: analise.especialista.toLowerCase().replace(' ', '_'),
    name: analise.especialista,
    type: 'analyst',
    status: 'active',
    confidence: analise.analise.nivel_confianca,
    capabilities: analise.analise.acoes_recomendadas.map(acao => ({
      name: acao.substring(0, 50) + '...',
      description: acao,
      requiredContext: ['investigation'],
      outputFormat: 'narrative'
    })),
    responsePatterns: {
      greeting: `${analise.especialista} aqui, pronto para análise.`,
      analyzing: 'Analisando dados...',
      conclusion: analise.analise.hipotese
    }
  };
}