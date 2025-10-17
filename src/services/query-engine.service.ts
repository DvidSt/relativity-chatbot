import { ReleaseNote } from '../types';

export interface QueryResult {
  releases: ReleaseNote[];
  queryType: string;
  explanation: string;
  confidence: number;
}

/**
 * Motor de consultas que entiende lenguaje natural y navega el JSON inteligentemente
 */
export function executeQuery(question: string, allReleases: ReleaseNote[]): QueryResult {
  const lowerQuestion = question.toLowerCase();
  
  // ========== CASO 1: ÚLTIMO/ÚLTIMA RELEASE (ALTA PRIORIDAD) ==========
  // Patrones que indican "último release" con alta prioridad
  const lastReleasePatterns = [
    /[uú]ltimo\s+(lanzamiento|release|cambio)/i,
    /[uú]ltima\s+(release|versi[oó]n)/i,
    /last\s+(release|launch|change|update)/i,
    /latest\s+(release|version)/i,
    /most\s+recent/i,
    /m[aá]s\s+reciente/i,
    /cu[aá]l\s+(fue|es)\s+el\s+[uú]ltimo/i,
    /what\s+(was|is)\s+the\s+last/i,
    /when\s+was\s+the\s+last/i,
    /quiero\s+saber\s+sobre\s+el\s+[uú]ltimo/i
  ];
  
  const isLastReleaseQuery = lastReleasePatterns.some(pattern => pattern.test(question));
  
  if (isLastReleaseQuery) {
    // IMPORTANTE: Verificar si menciona un producto ESPECÍFICO
    // Productos con múltiples palabras primero (más específicos)
    const explicitProducts = [
      'aiR for Review', 'Management Console', 'Cost Explorer', 
      'Legal Hold', 'Integration Points', 'Review Center',
      'Billing API', 'Short Message', 'Staging Explorer'
    ];
    
    let foundProduct: string | null = null;
    for (const product of explicitProducts) {
      if (lowerQuestion.includes(product.toLowerCase())) {
        foundProduct = product;
        break;
      }
    }
    
    // Si no encontró producto multi-palabra, buscar productos de una palabra
    if (!foundProduct) {
      const singleWordProducts = ['Processing', 'Collect', 'ARM', 'Analytics', 
        'Search', 'Imaging', 'Production', 'Authentication', 'OAuth', 'PDF'];
      
      for (const product of singleWordProducts) {
        // Solo si la palabra está aislada o es clara
        const regex = new RegExp(`\\b${product.toLowerCase()}\\b`, 'i');
        if (regex.test(lowerQuestion)) {
          foundProduct = product;
          break;
        }
      }
    }
    
    if (foundProduct) {
      // Último release de un producto específico
      const filtered = allReleases.filter(r => 
        r.feature.toLowerCase().includes(foundProduct!.toLowerCase()) ||
        r.description.toLowerCase().includes(foundProduct!.toLowerCase())
      );
      
      if (filtered.length > 0) {
        return {
          releases: [filtered[0]],
          queryType: 'last-by-product',
          explanation: `Último release de "${foundProduct}"`,
          confidence: 100
        };
      }
    }
    
    // SI NO menciona producto específico → ÚLTIMO RELEASE EN GENERAL
    // No importa si dice "último cambio", "último lanzamiento", etc.
    return {
      releases: [allReleases[0]],
      queryType: 'last-overall',
      explanation: 'Último release general',
      confidence: 100
    };
  }
  
  // ========== CASO 2: ÚLTIMOS N RELEASES ==========
  const countMatch = lowerQuestion.match(/últimos?\s+(\d+)|last\s+(\d+)|(\d+)\s+últimos?|(\d+)\s+recent/i);
  if (countMatch) {
    const count = parseInt(countMatch[1] || countMatch[2] || countMatch[3] || countMatch[4]);
    
    return {
      releases: allReleases.slice(0, Math.min(count, 20)),
      queryType: 'last-n',
      explanation: `Últimos ${count} releases`,
      confidence: 100
    };
  }
  
  // ========== CASO 3: POR FECHA ESPECÍFICA ==========
  const dateMatch = question.match(/\b(20\d{2})[\/\-](0?[1-9]|1[0-2])[\/\-](0?[1-9]|[12]\d|3[01])\b/);
  if (dateMatch) {
    const searchDate = dateMatch[0].replace(/-/g, '/');
    const filtered = allReleases.filter(r => r.date === searchDate);
    
    return {
      releases: filtered,
      queryType: 'by-exact-date',
      explanation: `Releases del ${searchDate}`,
      confidence: 100
    };
  }
  
  // ========== CASO 4: RANGO DE FECHAS / TEMPORAL ==========
  
  // "este mes" / "this month"
  if (matchesPattern(lowerQuestion, ['este mes', 'this month'])) {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}`;
    const filtered = allReleases.filter(r => r.date.startsWith(currentMonth));
    
    return {
      releases: filtered,
      queryType: 'this-month',
      explanation: `Releases de este mes (${currentMonth})`,
      confidence: 100
    };
  }
  
  // "hoy" / "today"
  if (matchesPattern(lowerQuestion, ['hoy', 'today'])) {
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '/');
    const filtered = allReleases.filter(r => r.date === today);
    
    return {
      releases: filtered,
      queryType: 'today',
      explanation: `Releases de hoy (${today})`,
      confidence: 100
    };
  }
  
  // "esta semana" / "this week"
  if (matchesPattern(lowerQuestion, ['esta semana', 'this week'])) {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoStr = weekAgo.toISOString().split('T')[0].replace(/-/g, '/');
    
    const filtered = allReleases.filter(r => r.date >= weekAgoStr);
    
    return {
      releases: filtered,
      queryType: 'this-week',
      explanation: 'Releases de esta semana',
      confidence: 100
    };
  }
  
  // Año específico: "2025", "en 2024"
  const yearMatch = question.match(/\b(20\d{2})\b/);
  if (yearMatch && !question.includes('/')) {
    const year = yearMatch[1];
    const filtered = allReleases.filter(r => r.date.startsWith(year));
    
    return {
      releases: filtered.slice(0, 50), // Limitar a 50
      queryType: 'by-year',
      explanation: `Releases del año ${year}`,
      confidence: 95
    };
  }
  
  // ========== CASO 5: BÚSQUEDA POR PRODUCTO/FEATURE ==========
  // SOLO si menciona explícitamente un producto Y no es un follow-up
  const isGeneralQuestion = matchesPattern(lowerQuestion, [
    'resumen', 'summary', 'de qué trata', 'what about', 'sobre qué'
  ]);
  
  if (!isGeneralQuestion) {
    const knownProducts = [
      'aiR for Review', 'Processing', 'Legal Hold', 'Collect', 'ARM',
      'Analytics', 'Review Center', 'Integration Points', 'Management Console',
      'Cost Explorer', 'Search', 'Imaging', 'Production', 'Staging Explorer',
      'Billing API', 'Short Message', 'Authentication', 'OAuth', 'PDF'
    ];
    
    for (const product of knownProducts) {
      const regex = new RegExp(`\\b${product.toLowerCase()}\\b`, 'i');
      if (regex.test(lowerQuestion)) {
        const filtered = allReleases.filter(r =>
          r.feature.toLowerCase().includes(product.toLowerCase()) ||
          r.description.toLowerCase().includes(product.toLowerCase())
        );
        
        if (filtered.length > 0) {
          return {
            releases: filtered.slice(0, 15),
            queryType: 'by-product',
            explanation: `Releases relacionados con "${product}"`,
            confidence: 95
          };
        }
      }
    }
  }
  
  // ========== CASO 6: BÚSQUEDA POR TIPO DE CAMBIO ==========
  const releaseType = extractReleaseType(lowerQuestion);
  if (releaseType) {
    const filtered = allReleases.filter(r =>
      r.category.toLowerCase().includes(releaseType)
    );
    
    return {
      releases: filtered.slice(0, 15),
      queryType: 'by-type',
      explanation: `Releases de tipo "${releaseType}"`,
      confidence: 90
    };
  }
  
  // ========== CASO 7: BÚSQUEDA POR TEXTO/CONTENIDO ==========
  const importantTerms = extractImportantTerms(question);
  
  if (importantTerms.length > 0) {
    const results = new Map<string, { release: ReleaseNote; score: number }>();
    
    importantTerms.forEach(term => {
      allReleases.forEach(release => {
        const searchText = `${release.feature} ${release.description} ${release.category}`.toLowerCase();
        
        if (searchText.includes(term.toLowerCase())) {
          const key = `${release.date}-${release.feature}`;
          const existing = results.get(key);
          
          // Score más alto si está en descripción completa
          let score = 10;
          if (release.description.toLowerCase().includes(term.toLowerCase())) score += 30;
          if (release.feature.toLowerCase().includes(term.toLowerCase())) score += 50;
          
          if (existing) {
            existing.score += score;
          } else {
            results.set(key, { release, score });
          }
        }
      });
    });
    
    const sorted = Array.from(results.values())
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return b.release.date.localeCompare(a.release.date);
      })
      .slice(0, 15)
      .map(r => r.release);
    
    if (sorted.length > 0) {
      return {
        releases: sorted,
        queryType: 'by-content',
        explanation: `Búsqueda por: ${importantTerms.join(', ')}`,
        confidence: 75
      };
    }
  }
  
  // ========== CASO 8: NO SE ENCONTRÓ NADA ==========
  return {
    releases: [],
    queryType: 'no-match',
    explanation: 'No se encontraron releases relevantes',
    confidence: 0
  };
}

// ========== FUNCIONES AUXILIARES ==========

function matchesPattern(text: string, patterns: string[]): boolean {
  return patterns.some(pattern => text.includes(pattern.toLowerCase()));
}

function extractProduct(question: string, releases: ReleaseNote[]): string | null {
  // Obtener todos los productos únicos del dataset
  const allProducts = [...new Set(releases.map(r => r.feature))];
  
  // Buscar el producto más largo que coincida (para evitar matches parciales)
  const matches = allProducts
    .filter(product => question.toLowerCase().includes(product.toLowerCase()))
    .sort((a, b) => b.length - a.length);
  
  return matches[0] || null;
}

function extractReleaseType(text: string): string | null {
  const types = [
    { keywords: ['fix', 'defecto', 'bug', 'resolved', 'corregido', 'solucionado'], value: 'resolved defect' },
    { keywords: ['enhancement', 'mejora', 'improvement', 'nueva', 'new'], value: 'enhancement' },
    { keywords: ['change', 'cambio', 'modification'], value: 'change' },
    { keywords: ['deprecation', 'deprecated', 'eliminado'], value: 'deprecation' }
  ];
  
  for (const type of types) {
    if (type.keywords.some(keyword => text.includes(keyword))) {
      return type.value;
    }
  }
  
  return null;
}

function extractImportantTerms(text: string): string[] {
  const terms: string[] = [];
  
  // Frases entre comillas
  const quotedMatches = text.match(/"([^"]+)"/g);
  if (quotedMatches) {
    terms.push(...quotedMatches.map(m => m.replace(/"/g, '')));
  }
  
  // Palabras capitalizadas (nombres propios)
  const capitalizedPattern = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g;
  const capitalizedMatches = text.match(capitalizedPattern);
  if (capitalizedMatches) {
    terms.push(...capitalizedMatches);
  }
  
  // Términos técnicos comunes
  const technicalTerms = [
    'workspace', 'document', 'field', 'search', 'export', 'import',
    'user', 'permission', 'role', 'api', 'integration', 'report',
    'billing', 'cost', 'usage', 'storage', 'performance'
  ];
  
  technicalTerms.forEach(term => {
    if (text.toLowerCase().includes(term)) {
      terms.push(term);
    }
  });
  
  // Palabras relevantes (filtrar stopwords)
  const stopWords = new Set([
    'el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'una', 'por', 'con', 'para',
    'the', 'is', 'at', 'which', 'on', 'are', 'was', 'were', 'about',
    'hay', 'algo', 'del', 'más', 'no', 'si', 'me', 'te', 'se'
  ]);
  
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.has(word));
  
  terms.push(...words);
  
  return [...new Set(terms)];
}