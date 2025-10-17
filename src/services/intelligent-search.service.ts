import { ReleaseNote } from '../types';

export interface IntelligentSearchResult {
  releases: ReleaseNote[];
  searchType: 'latest' | 'by-date' | 'by-text' | 'by-feature' | 'none';
  confidence: number;
  reasoning: string;
}

/**
 * Sistema inteligente que analiza la pregunta y decide cómo buscar
 */
export function intelligentSearch(
  question: string,
  allReleases: ReleaseNote[]
): IntelligentSearchResult {
  
  const lowerQuestion = question.toLowerCase().trim();
  
  // ===== CASO 1: PREGUNTA POR ÚLTIMO/ÚLTIMO RELEASE =====
  const lastReleasePatterns = [
    /último.*lanzamiento/i,
    /ultima.*release/i,
    /last.*release/i,
    /latest.*release/i,
    /most recent/i,
    /más reciente/i,
    /nuevo.*release/i,
    /what'?s.*last/i,
    /cuál.*último/i,
    /cu[aá]l.*fue.*[uú]ltimo/i,
    /cuando.*último/i,
    /[uú]ltimo cambio/i,
    /last change/i
  ];
  
  // Detectar si pregunta por último release de un producto específico
  const productMatch = question.match(/último.*(?:de|for|of)\s+([A-Z][a-zA-Z\s]+)/i);
  
  if (lastReleasePatterns.some(pattern => pattern.test(question))) {
    if (productMatch) {
      // Último release de un producto específico
      const product = productMatch[1].trim();
      const productReleases = searchByFeature(product, allReleases);
      
      if (productReleases.length > 0) {
        return {
          releases: [productReleases[0]], // El más reciente de ese producto
          searchType: 'latest',
          confidence: 100,
          reasoning: `Último release de ${product}`
        };
      }
    }
    
    // Último release en general
    const latestRelease = getLatestRelease(allReleases);
    
    if (latestRelease) {
      return {
        releases: [latestRelease],
        searchType: 'latest',
        confidence: 100,
        reasoning: 'Usuario pregunta por el último release'
      };
    }
  }

  // ===== CASO 2: PREGUNTA CON FECHA ESPECÍFICA =====
  const datePatterns = [
    /\b(20\d{2})[\/\-](0?[1-9]|1[0-2])[\/\-](0?[1-9]|[12]\d|3[01])\b/g, // 2025/10/16 o 2025-10-16
    /\b(20\d{2})\b/g, // Solo año
    /\b(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s+(20\d{2})\b/gi
  ];
  
  for (const pattern of datePatterns) {
    const matches = question.match(pattern);
    if (matches) {
      const dateQuery = matches[0];
      const dateResults = searchByDate(dateQuery, allReleases);
      
      if (dateResults.length > 0) {
        return {
          releases: dateResults,
          searchType: 'by-date',
          confidence: 95,
          reasoning: `Búsqueda por fecha: ${dateQuery}`
        };
      }
    }
  }

  // ===== CASO 3: BÚSQUEDA POR TEXTO/CONTENIDO =====
  // Extraer frases importantes (2+ palabras capitalizadas o términos técnicos)
  const importantPhrases = extractImportantPhrases(question);
  
  if (importantPhrases.length > 0) {
    const textResults = searchByTextContent(importantPhrases, allReleases);
    
    if (textResults.length > 0) {
      return {
        releases: textResults,
        searchType: 'by-text',
        confidence: 85,
        reasoning: `Búsqueda por contenido: ${importantPhrases.join(', ')}`
      };
    }
  }

  // ===== CASO 4: BÚSQUEDA POR FEATURES/PRODUCTOS CONOCIDOS =====
  const knownProducts = [
    'aiR for Review', 'Processing', 'Legal Hold', 'Collect', 'ARM',
    'Analytics', 'Review Center', 'Integration Points', 'Management Console',
    'Cost Explorer', 'Search', 'Imaging', 'Production', 'Staging Explorer',
    'Billing API', 'Short Message'
  ];
  
  for (const product of knownProducts) {
    if (lowerQuestion.includes(product.toLowerCase())) {
      const productResults = searchByFeature(product, allReleases);
      
      if (productResults.length > 0) {
        return {
          releases: productResults.slice(0, 10),
          searchType: 'by-feature',
          confidence: 90,
          reasoning: `Búsqueda por producto: ${product}`
        };
      }
    }
  }

  // ===== CASO 5: BÚSQUEDA GENERAL POR PALABRAS CLAVE =====
  const keywords = extractKeywords(question);
  
  if (keywords.length > 0) {
    const generalResults = searchByKeywords(keywords, allReleases);
    
    if (generalResults.length > 0) {
      return {
        releases: generalResults.slice(0, 15),
        searchType: 'by-text',
        confidence: 60,
        reasoning: `Búsqueda general: ${keywords.join(', ')}`
      };
    }
  }

  // ===== NO SE ENCONTRÓ NADA =====
  return {
    releases: [],
    searchType: 'none',
    confidence: 0,
    reasoning: 'No se encontraron releases relevantes'
  };
}

// ========== FUNCIONES AUXILIARES ==========

function getLatestRelease(releases: ReleaseNote[]): ReleaseNote | null {
  if (releases.length === 0) return null;

  // Ordenar por fecha (formato: YYYY/MM/DD)
  const sorted = [...releases].sort((a, b) => {
    // Convertir "2025/10/16" a número comparable: 20251016
    const dateA = a.date.replace(/\//g, '');
    const dateB = b.date.replace(/\//g, '');
    return dateB.localeCompare(dateA);
  });

  return sorted[0];
}

function searchByDate(dateQuery: string, releases: ReleaseNote[]): ReleaseNote[] {
  // Normalizar fecha a formato YYYY/MM/DD o YYYY
  const normalized = dateQuery.replace(/-/g, '/');
  
  return releases.filter(r => 
    r.date.includes(normalized) || r.version.includes(normalized)
  ).sort((a, b) => b.date.localeCompare(a.date));
}

function extractImportantPhrases(text: string): string[] {
  const phrases: string[] = [];
  
  // Buscar frases entre comillas
  const quotedMatches = text.match(/"([^"]+)"/g);
  if (quotedMatches) {
    phrases.push(...quotedMatches.map(m => m.replace(/"/g, '')));
  }
  
  // Buscar palabras capitalizadas consecutivas (nombres propios, productos)
  const capitalizedPattern = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b/g;
  const capitalizedMatches = text.match(capitalizedPattern);
  if (capitalizedMatches) {
    phrases.push(...capitalizedMatches);
  }
  
  // Buscar términos técnicos específicos
  const technicalTerms = [
    'Cost Explorer', 'Extend Product', 'Management Console', 'Billing API',
    'Issue Descriptions', 'AI assistant', 'channel names', 'channel IDs',
    'usage data', 'monthly costs'
  ];
  
  technicalTerms.forEach(term => {
    if (text.toLowerCase().includes(term.toLowerCase())) {
      phrases.push(term);
    }
  });
  
  return [...new Set(phrases)]; // Eliminar duplicados
}

function searchByTextContent(phrases: string[], releases: ReleaseNote[]): ReleaseNote[] {
  const results = new Map<string, { release: ReleaseNote; score: number }>();
  
  phrases.forEach(phrase => {
    const phraseLower = phrase.toLowerCase();
    
    releases.forEach(release => {
      const searchText = `${release.feature} ${release.description} ${release.category}`.toLowerCase();
      
      if (searchText.includes(phraseLower)) {
        const key = `${release.date}-${release.feature}`;
        const existing = results.get(key);
        
        // Más puntos si coincide en la descripción completa
        const score = release.description.toLowerCase().includes(phraseLower) ? 100 : 50;
        
        if (existing) {
          existing.score += score;
        } else {
          results.set(key, { release, score });
        }
      }
    });
  });
  
  // Ordenar por score y fecha
  return Array.from(results.values())
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.release.date.localeCompare(a.release.date);
    })
    .map(r => r.release)
    .slice(0, 20);
}

function searchByFeature(feature: string, releases: ReleaseNote[]): ReleaseNote[] {
  const featureLower = feature.toLowerCase();
  
  return releases.filter(r =>
    r.feature.toLowerCase().includes(featureLower) ||
    r.category.toLowerCase().includes(featureLower) ||
    r.description.toLowerCase().includes(featureLower)
  ).sort((a, b) => b.date.localeCompare(a.date));
}

function extractKeywords(text: string): string[] {
  const stopWords = new Set([
    'el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'una', 'por', 'con', 'para',
    'the', 'is', 'at', 'which', 'on', 'a', 'an', 'as', 'are', 'was', 'were',
    'hay', 'algo', 'del', 'más', 'nuevo', 'nueva', 'no', 'si', 'about'
  ]);
  
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word));
  
  return [...new Set(words)];
}

function searchByKeywords(keywords: string[], releases: ReleaseNote[]): ReleaseNote[] {
  const results = new Map<string, { release: ReleaseNote; score: number }>();
  
  keywords.forEach(keyword => {
    releases.forEach(release => {
      const searchText = `${release.feature} ${release.description} ${release.category}`.toLowerCase();
      
      if (searchText.includes(keyword)) {
        const key = `${release.date}-${release.feature}`;
        const existing = results.get(key);
        const score = release.feature.toLowerCase().includes(keyword) ? 20 : 10;
        
        if (existing) {
          existing.score += score;
        } else {
          results.set(key, { release, score });
        }
      }
    });
  });
  
  return Array.from(results.values())
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.release.date.localeCompare(a.release.date);
    })
    .map(r => r.release);
}