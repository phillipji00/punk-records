/**
 * Sistema de Merge Inteligente para Documentos Markdown
 * Preserva informações inalteradas e atualiza apenas conteúdo modificado
 */

export interface ParsedSection {
  id: string;
  type: 'header' | 'case' | 'hypothesis' | 'evidence' | 'character' | 'timeline' | 'misc';
  level: number;
  title: string;
  content: string;
  items: ParsedItem[];
  metadata: {
    originalIndex: number;
    lastModified?: string;
    author?: string;
    confidence?: number;
  };
}

export interface ParsedItem {
  id: string;
  type: 'hypothesis' | 'evidence' | 'character_profile' | 'timeline_event' | 'misc_record';
  content: string;
  metadata: {
    author?: string;
    confidence?: number;
    timestamp?: string;
    specialist?: string;
    hash: string; // Para detectar mudanças
  };
}

export interface MergeResult {
  mergedMarkdown: string;
  changeLog: ChangeLogEntry[];
  statistics: {
    sectionsPreserved: number;
    sectionsUpdated: number;
    sectionsAdded: number;
    itemsPreserved: number;
    itemsUpdated: number;
    itemsAdded: number;
    conflictsResolved: number;
  };
}

export interface ChangeLogEntry {
  section: string;
  action: 'preserved' | 'updated' | 'added' | 'conflict_resolved';
  item?: string;
  oldValue?: string;
  newValue?: string;
  reason: string;
}

/**
 * Classe principal para merge inteligente de documentos markdown
 */
export class IntelligentMarkdownMerger {
  
  /**
   * Executa merge inteligente entre documento anterior e novo
   */
  public static mergeDocuments(previousMarkdown: string, newMarkdown: string): MergeResult {
    const merger = new IntelligentMarkdownMerger();
    
    // Parse dos documentos
    const previousDoc = merger.parseMarkdown(previousMarkdown, 'previous');
    const newDoc = merger.parseMarkdown(newMarkdown, 'new');
    
    // Merge inteligente
    const mergedDoc = merger.performIntelligentMerge(previousDoc, newDoc);
    
    // Gerar markdown final
    const mergedMarkdown = merger.generateMarkdown(mergedDoc.sections);
    
    return {
      mergedMarkdown,
      changeLog: mergedDoc.changeLog,
      statistics: mergedDoc.statistics
    };
  }
  
  /**
   * Parse de documento markdown em estrutura navegável
   */
  private parseMarkdown(markdown: string, source: 'previous' | 'new'): ParsedSection[] {
    const lines = markdown.split('\n');
    const sections: ParsedSection[] = [];
    let currentSection: ParsedSection | null = null;
    let currentContent: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Detectar headers
      const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
      if (headerMatch) {
        // Salvar seção anterior se existir
        if (currentSection) {
          currentSection.content = currentContent.join('\n').trim();
          currentSection.items = this.parseItems(currentSection.content, currentSection.type);
          sections.push(currentSection);
        }
        
        // Criar nova seção
        const level = headerMatch[1].length;
        const title = headerMatch[2].trim();
        const sectionType = this.determineSectionType(title, level);
        
        currentSection = {
          id: this.generateSectionId(title, level),
          type: sectionType,
          level,
          title,
          content: '',
          items: [],
          metadata: {
            originalIndex: i,
            lastModified: source === 'new' ? new Date().toISOString() : undefined
          }
        };
        
        currentContent = [];
      } else {
        // Adicionar linha ao conteúdo da seção atual
        currentContent.push(line);
      }
    }
    
    // Adicionar última seção
    if (currentSection) {
      currentSection.content = currentContent.join('\n').trim();
      currentSection.items = this.parseItems(currentSection.content, currentSection.type);
      sections.push(currentSection);
    }
    
    return sections;
  }
  
  /**
   * Determina o tipo de seção baseado no título e nível
   */
  private determineSectionType(title: string, level: number): ParsedSection['type'] {
    const titleLower = title.toLowerCase();
    
    if (level === 1) return 'header';
    if (level === 2) return 'case';
    
    if (titleLower.includes('hipótese') || titleLower.includes('hypothesis')) return 'hypothesis';
    if (titleLower.includes('evidência') || titleLower.includes('evidence')) return 'evidence';
    if (titleLower.includes('personagem') || titleLower.includes('perfil') || titleLower.includes('character')) return 'character';
    if (titleLower.includes('timeline') || titleLower.includes('linha do tempo')) return 'timeline';
    
    return 'misc';
  }
  
  /**
   * Parse de itens dentro de uma seção
   */
  private parseItems(content: string, sectionType: ParsedSection['type']): ParsedItem[] {
    const items: ParsedItem[] = [];
    const lines = content.split('\n');
    
    let currentItem: Partial<ParsedItem> | null = null;
    let currentContent: string[] = [];
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Detectar início de novo item (linhas que começam com número, *, -, ou **)
      const itemMatch = trimmedLine.match(/^(\*\*\d+\.\*\*|\*\*[^*]+\*\*|\d+\.|[\*\-])\s+(.+)$/);
      
      if (itemMatch || trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
        // Salvar item anterior
        if (currentItem && currentContent.length > 0) {
          currentItem.content = currentContent.join('\n').trim();
          currentItem.metadata!.hash = this.generateContentHash(currentItem.content!);
          items.push(currentItem as ParsedItem);
        }
        
        // Criar novo item
        const itemContent = itemMatch ? itemMatch[2] : trimmedLine.replace(/\*\*/g, '');
        const itemType = this.determineItemType(itemContent, sectionType);
        
        currentItem = {
          id: this.generateItemId(itemContent, itemType),
          type: itemType,
          content: '',
          metadata: {
            hash: ''
          }
        };
        
        currentContent = [trimmedLine];
        
        // Extrair metadados se presentes na linha
        this.extractMetadataFromLine(trimmedLine, currentItem.metadata!);
      } else if (currentItem) {
        // Adicionar linha ao item atual
        currentContent.push(line);
        
        // Extrair metadados adicionais
        this.extractMetadataFromLine(trimmedLine, currentItem.metadata!);
      }
    }
    
    // Adicionar último item
    if (currentItem && currentContent.length > 0) {
      currentItem.content = currentContent.join('\n').trim();
      currentItem.metadata!.hash = this.generateContentHash(currentItem.content!);
      items.push(currentItem as ParsedItem);
    }
    
    return items;
  }
  
  /**
   * Determina o tipo de item baseado no conteúdo e contexto da seção
   */
  private determineItemType(content: string, sectionType: ParsedSection['type']): ParsedItem['type'] {
    switch (sectionType) {
      case 'hypothesis': return 'hypothesis';
      case 'evidence': return 'evidence';
      case 'character': return 'character_profile';
      case 'timeline': return 'timeline_event';
      default: return 'misc_record';
    }
  }
  
  /**
   * Extrai metadados de uma linha (autor, confiança, timestamp, etc.)
   */
  private extractMetadataFromLine(line: string, metadata: ParsedItem['metadata']): void {
    // Extrair especialista/autor
    const specialistMatch = line.match(/\*Especialista:\*\s*([^|]+)/i) || 
                           line.match(/\*Por:\*\s*([^|]+)/i) ||
                           line.match(/\*Análise:\*\s*([^|]+)/i);
    if (specialistMatch) {
      metadata.specialist = specialistMatch[1].trim();
      metadata.author = specialistMatch[1].trim();
    }
    
    // Extrair confiança/probabilidade
    const confidenceMatch = line.match(/\*Confiança:\*\s*(\d+)%/i) ||
                           line.match(/\*Probabilidade:\*\s*(\d+)%/i) ||
                           line.match(/(\d+)%/);
    if (confidenceMatch) {
      metadata.confidence = parseInt(confidenceMatch[1]) / 100;
    }
    
    // Extrair timestamp/data
    const dateMatch = line.match(/\*Data:\*\s*([^|]+)/i) ||
                     line.match(/em\s+(\d{1,2}\/\d{1,2}\/\d{4})/);
    if (dateMatch) {
      metadata.timestamp = dateMatch[1].trim();
    }
  }
  
  /**
   * Executa o merge inteligente entre documentos
   */
  private performIntelligentMerge(
    previousSections: ParsedSection[], 
    newSections: ParsedSection[]
  ): { sections: ParsedSection[]; changeLog: ChangeLogEntry[]; statistics: MergeResult['statistics'] } {
    
    const mergedSections: ParsedSection[] = [];
    const changeLog: ChangeLogEntry[] = [];
    const statistics = {
      sectionsPreserved: 0,
      sectionsUpdated: 0,
      sectionsAdded: 0,
      itemsPreserved: 0,
      itemsUpdated: 0,
      itemsAdded: 0,
      conflictsResolved: 0
    };
    
    // Criar mapa de seções anteriores para busca rápida
    const previousSectionMap = new Map<string, ParsedSection>();
    previousSections.forEach(section => {
      previousSectionMap.set(section.id, section);
    });
    
    // Processar seções novas
    for (const newSection of newSections) {
      const previousSection = previousSectionMap.get(newSection.id);
      
      if (!previousSection) {
        // Seção nova - adicionar completamente
        mergedSections.push({ ...newSection });
        changeLog.push({
          section: newSection.title,
          action: 'added',
          reason: 'Nova seção não existia no documento anterior'
        });
        statistics.sectionsAdded++;
      } else {
        // Seção existe - fazer merge de itens
        const mergedSection = this.mergeSections(previousSection, newSection, changeLog, statistics);
        mergedSections.push(mergedSection);
        
        if (mergedSection.metadata.lastModified) {
          statistics.sectionsUpdated++;
        } else {
          statistics.sectionsPreserved++;
        }
      }
      
      // Remover da lista de seções anteriores
      previousSectionMap.delete(newSection.id);
    }
    
    // Adicionar seções que só existiam no documento anterior
    for (const remainingSection of previousSectionMap.values()) {
      mergedSections.push({ ...remainingSection });
      changeLog.push({
        section: remainingSection.title,
        action: 'preserved',
        reason: 'Seção não teve atualizações, preservada do documento anterior'
      });
      statistics.sectionsPreserved++;
    }
    
    return { sections: mergedSections, changeLog, statistics };
  }
  
  /**
   * Merge de duas seções com mesmo ID
   */
  private mergeSections(
    previousSection: ParsedSection, 
    newSection: ParsedSection,
    changeLog: ChangeLogEntry[],
    statistics: MergeResult['statistics']
  ): ParsedSection {
    
    const mergedSection: ParsedSection = {
      ...previousSection,
      title: newSection.title, // Título mais recente
      items: []
    };
    
    // Criar mapa de itens anteriores
    const previousItemMap = new Map<string, ParsedItem>();
    previousSection.items.forEach(item => {
      previousItemMap.set(item.id, item);
    });
    
    let sectionModified = false;
    
    // Processar itens novos
    for (const newItem of newSection.items) {
      const previousItem = previousItemMap.get(newItem.id);
      
      if (!previousItem) {
        // Item novo
        mergedSection.items.push({ ...newItem });
        changeLog.push({
          section: mergedSection.title,
          action: 'added',
          item: newItem.content.substring(0, 50) + '...',
          reason: 'Novo item adicionado'
        });
        statistics.itemsAdded++;
        sectionModified = true;
      } else {
        // Item existe - verificar mudanças
        const mergedItem = this.mergeItems(previousItem, newItem, changeLog, statistics, mergedSection.title);
        mergedSection.items.push(mergedItem);
        
        if (mergedItem.metadata.hash !== previousItem.metadata.hash) {
          sectionModified = true;
        }
      }
      
      previousItemMap.delete(newItem.id);
    }
    
    // Adicionar itens que só existiam no documento anterior
    for (const remainingItem of previousItemMap.values()) {
      mergedSection.items.push({ ...remainingItem });
      changeLog.push({
        section: mergedSection.title,
        action: 'preserved',
        item: remainingItem.content.substring(0, 50) + '...',
        reason: 'Item sem atualizações, preservado'
      });
      statistics.itemsPreserved++;
    }
    
    // Atualizar metadados da seção se houve modificações
    if (sectionModified) {
      mergedSection.metadata.lastModified = new Date().toISOString();
    }
    
    // Regenerar conteúdo da seção
    mergedSection.content = this.generateSectionContent(mergedSection.items);
    
    return mergedSection;
  }
  
  /**
   * Merge de dois itens com mesmo ID
   */
  private mergeItems(
    previousItem: ParsedItem, 
    newItem: ParsedItem,
    changeLog: ChangeLogEntry[],
    statistics: MergeResult['statistics'],
    sectionTitle: string
  ): ParsedItem {
    
    // Se conteúdo é idêntico, manter o anterior
    if (previousItem.metadata.hash === newItem.metadata.hash) {
      statistics.itemsPreserved++;
      return { ...previousItem };
    }
    
    // Determinar qual versão usar baseado em critérios
    const useNewVersion = this.shouldUseNewVersion(previousItem, newItem);
    
    if (useNewVersion) {
      // Usar nova versão, mas preservar histórico se houver conflito significativo
      const mergedItem: ParsedItem = { ...newItem };
      
      if (this.hasSignificantConflict(previousItem, newItem)) {
        // Adicionar versão anterior como histórico
        mergedItem.content += `\n\n*[Histórico]* ${previousItem.content} (versão anterior)`;
        
        changeLog.push({
          section: sectionTitle,
          action: 'conflict_resolved',
          item: newItem.content.substring(0, 50) + '...',
          oldValue: previousItem.content.substring(0, 50) + '...',
          newValue: newItem.content.substring(0, 50) + '...',
          reason: 'Conflito resolvido priorizando versão mais recente, anterior mantida no histórico'
        });
        
        statistics.conflictsResolved++;
      } else {
        changeLog.push({
          section: sectionTitle,
          action: 'updated',
          item: newItem.content.substring(0, 50) + '...',
          reason: 'Item atualizado com nova informação'
        });
        
        statistics.itemsUpdated++;
      }
      
      return mergedItem;
    } else {
      // Manter versão anterior
      statistics.itemsPreserved++;
      return { ...previousItem };
    }
  }
  
  /**
   * Determina se deve usar a nova versão do item
   */
  private shouldUseNewVersion(previousItem: ParsedItem, newItem: ParsedItem): boolean {
    // Priorizar por confiança
    if (newItem.metadata.confidence && previousItem.metadata.confidence) {
      if (newItem.metadata.confidence > previousItem.metadata.confidence) {
        return true;
      }
      if (newItem.metadata.confidence < previousItem.metadata.confidence) {
        return false;
      }
    }
    
    // Priorizar por timestamp mais recente
    if (newItem.metadata.timestamp && previousItem.metadata.timestamp) {
      const newDate = new Date(newItem.metadata.timestamp);
      const prevDate = new Date(previousItem.metadata.timestamp);
      if (newDate > prevDate) {
        return true;
      }
    }
    
    // Por padrão, usar nova versão (assume que é mais recente)
    return true;
  }
  
  /**
   * Verifica se há conflito significativo entre itens
   */
  private hasSignificantConflict(previousItem: ParsedItem, newItem: ParsedItem): boolean {
    // Conflito em dados numéricos (horários, números, percentuais)
    const previousNumbers = this.extractNumbers(previousItem.content);
    const newNumbers = this.extractNumbers(newItem.content);
    
    for (let i = 0; i < Math.min(previousNumbers.length, newNumbers.length); i++) {
      if (Math.abs(previousNumbers[i] - newNumbers[i]) > 0.1) {
        return true;
      }
    }
    
    // Conflito em informações factuais (sim/não, presente/ausente)
    const previousFacts = this.extractFactualClaims(previousItem.content);
    const newFacts = this.extractFactualClaims(newItem.content);
    
    for (const fact of previousFacts) {
      if (newFacts.some(newFact => this.areConflictingFacts(fact, newFact))) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Gera conteúdo da seção a partir dos itens
   */
  private generateSectionContent(items: ParsedItem[]): string {
    return items.map(item => item.content).join('\n\n');
  }
  
  /**
   * Gera markdown final a partir das seções
   */
  private generateMarkdown(sections: ParsedSection[]): string {
    return sections.map(section => {
      const header = '#'.repeat(section.level) + ' ' + section.title;
      return section.content ? header + '\n\n' + section.content : header;
    }).join('\n\n');
  }
  
  // Funções auxiliares
  private generateSectionId(title: string, level: number): string {
    return `${level}-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  }
  
  private generateItemId(content: string, type: ParsedItem['type']): string {
    const contentHash = this.generateContentHash(content.substring(0, 100));
    return `${type}-${contentHash}`;
  }
  
  private generateContentHash(content: string): string {
    // Simple hash function - in production use crypto
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }
  
  private extractNumbers(content: string): number[] {
    const matches = content.match(/\d+(?:\.\d+)?/g);
    return matches ? matches.map(n => parseFloat(n)) : [];
  }
  
  private extractFactualClaims(content: string): string[] {
    // Extrai declarações factuais simples
    const sentences = content.split(/[.!?]+/);
    return sentences.map(s => s.trim().toLowerCase()).filter(s => s.length > 10);
  }
  
  private areConflictingFacts(fact1: string, fact2: string): boolean {
    // Lógica simplificada para detectar conflitos
    const opposites = [
      ['sim', 'não'], ['presente', 'ausente'], ['verdadeiro', 'falso'],
      ['confirmado', 'negado'], ['encontrado', 'não encontrado']
    ];
    
    for (const [positive, negative] of opposites) {
      if ((fact1.includes(positive) && fact2.includes(negative)) ||
          (fact1.includes(negative) && fact2.includes(positive))) {
        return true;
      }
    }
    
    return false;
  }
}