/* personaTemplateBuilder.ts
 * Gera prompts personalizados para cada especialista do Syndicate
 * com base em templates narrativos e o ExecutionContext.
 * 
 * Versão 2.1 - Corrigida para compatibilidade com ExecutionContext
 */

import { ExecutionContext } from '../lib/types/common';

// Importa os templates expandidos
import templates from './templates.json';

// Tipos para melhor type safety
type TemplateCategory = keyof typeof templates;
type TemplateSubtype = string;
type TemplateStructure = string | Record<string, string>;

interface TemplateOptions {
  category?: TemplateSubtype;
  fallbackToDefault?: boolean;
}

// Interface para dados extraídos do contexto
interface ExtractedData {
  contextoNarrativo: string;
  etapa: string;
  dados: Record<string, any>;
  [key: string]: any;
}

/**
 * Extrai dados relevantes do ExecutionContext
 */
function extractDataFromContext(context: ExecutionContext): ExtractedData {
  return {
    contextoNarrativo: context.input?.content || '',
    etapa: context.state?.phase || 'análise inicial',
    dados: context.input?.metadata || {},
    // Copiar outros campos relevantes
    idCaso: context.executionId,
    timestamp: context.startTime,
    ...context.input?.metadata
  };
}

/**
 * Gera um prompt com base na persona e no contexto atual.
 * @param persona Nome da persona (ex: 'estrategista_chefe')
 * @param context Objeto de contexto com dados da investigação
 * @param options Opções adicionais para seleção de template
 * @returns Prompt string finalizado com base no template correspondente
 */
export function generatePromptForPersona(
  persona: string, 
  context: ExecutionContext,
  options: TemplateOptions = {}
): string {
  const { category = 'analise_inicial', fallbackToDefault = true } = options;
  
  // Verifica se a persona existe nos templates
  const personaTemplates = templates[persona as TemplateCategory] as TemplateStructure;
  
  if (!personaTemplates) {
    throw new Error(`Template não encontrado para persona: ${persona}`);
  }

  // Seleciona o template específico ou usa o default
  let template: string;
  
  if (typeof personaTemplates === 'string') {
    // Template simples (retrocompatibilidade)
    template = personaTemplates;
  } else {
    // Template estruturado com categorias
    const structuredTemplates = personaTemplates as Record<string, string>;
    
    if (structuredTemplates[category]) {
      template = structuredTemplates[category];
    } else if (fallbackToDefault && structuredTemplates['analise_inicial']) {
      template = structuredTemplates['analise_inicial'];
    } else {
      throw new Error(`Categoria de template '${category}' não encontrada para ${persona}`);
    }
  }

  // Extrai dados do contexto
  const extractedData = extractDataFromContext(context);

  // Substituição inteligente de campos
  let prompt = template;

  // Substitui campos do contexto extraído
  Object.entries(extractedData).forEach(([key, value]) => {
    const token = `{{${key}}}`;
    if (prompt.includes(token)) {
      const valueStr = Array.isArray(value) ? value.join(', ') : String(value);
      prompt = prompt.split(token).join(valueStr);
    }
  });

  // Remove tokens não substituídos opcionalmente
  prompt = cleanUnusedTokens(prompt);

  return prompt;
}

/**
 * Gera múltiplos prompts para diferentes categorias de análise
 * @param persona Nome da persona
 * @param context Contexto de execução
 * @param categories Array de categorias desejadas
 * @returns Objeto com prompts para cada categoria
 */
export function generateMultiplePrompts(
  persona: string,
  context: ExecutionContext,
  categories: string[]
): Record<string, string> {
  const prompts: Record<string, string> = {};
  
  categories.forEach(category => {
    try {
      prompts[category] = generatePromptForPersona(persona, context, { category });
    } catch (error) {
      console.warn(`Não foi possível gerar prompt para categoria '${category}': ${error}`);
    }
  });
  
  return prompts;
}

/**
 * Seleciona automaticamente a melhor categoria de template baseada no contexto
 * @param context Contexto de execução
 * @returns Categoria recomendada
 */
export function selectBestTemplateCategory(
  context: ExecutionContext
): string {
  // Extrai dados relevantes
  const { contextoNarrativo, etapa } = extractDataFromContext(context);
  const narrative = contextoNarrativo.toLowerCase();
  
  // Mapeamento de palavras-chave para categorias
  const categoryMappings: Record<string, string[]> = {
    'deteccao_contradicao': ['contradição', 'conflito', 'inconsistência'],
    'analise_historica': ['história', 'período', 'século', 'guerra'],
    'perfil_psicologico': ['perfil', 'comportamento', 'psicológico'],
    'mapeamento_espacial': ['espaço', 'layout', 'mapa', 'ambiente'],
    'sintese_final': ['conclusão', 'final', 'síntese', 'resumo']
  };
  
  // Verifica qual categoria melhor se adequa
  for (const [category, keywords] of Object.entries(categoryMappings)) {
    if (keywords.some(keyword => narrative.includes(keyword))) {
      return category;
    }
  }
  
  // Retorna categoria padrão baseada na etapa
  const etapaCategoryMap: Record<string, string> = {
    'analysis': 'analise_inicial',
    'validation': 'deteccao_contradicao',
    'synthesis': 'sintese_estrategica',
    'conclusion': 'sintese_final'
  };
  
  return etapaCategoryMap[etapa] || 'analise_inicial';
}

/**
 * Remove tokens não substituídos do template
 * @param text Texto com possíveis tokens não substituídos
 * @returns Texto limpo
 */
function cleanUnusedTokens(text: string): string {
  // Remove tokens não substituídos mas preserva o contexto
  return text.replace(/\{\{[^}]+\}\}/g, (match) => {
    // Retorna um placeholder genérico baseado no nome do token
    const tokenName = match.replace(/[{}]/g, '').trim();
    
    // Mapeamento de tokens comuns para valores default
    const defaults: Record<string, string> = {
      'evidencia': '[evidência em análise]',
      'hipotese': '[hipótese em desenvolvimento]',
      'confianca': '[calculando]',
      'descoberta': '[em investigação]',
      'sujeito': '[sujeito da análise]',
      'objetivo': '[objetivo da missão]'
    };
    
    return defaults[tokenName] || `[${tokenName}]`;
  });
}

/**
 * Valida se um contexto tem os campos mínimos para um template
 * @param context Contexto a validar
 * @param requiredFields Campos obrigatórios
 * @returns boolean indicando se contexto é válido
 */
export function validateContextForTemplate(
  context: ExecutionContext,
  requiredFields: string[]
): boolean {
  // Extrai dados do contexto
  const extractedData = extractDataFromContext(context);
  
  // Verifica campos diretos e aninhados
  const allFields = Object.keys(extractedData);
  
  return requiredFields.every(field => allFields.includes(field));
}

// Exporta tipos úteis para outros módulos
export type { TemplateCategory, TemplateOptions };