import { ReleaseNote } from '../types';
import { KeywordResult } from './keyword.service';

export interface SearchResult {
  releases: ReleaseNote[];
  relevanceScore: number;
  matchedBy: string[];
}

export async function smartSearch(
  keywords: KeywordResult,
  allReleases: ReleaseNote[]
): Promise<SearchResult> {
  let matchedReleases: Map<string, { release: ReleaseNote; score: number; matchedBy: string[] }> = new Map();

  // 1. Búsqueda por fecha si se especificó
  if (keywords.dateRange?.start) {
    const year = keywords.dateRange.start;
    allReleases.forEach(release => {
      if (release.date.includes(year) || release.version.includes(year)) {
        const key = `${release.version}-${release.feature}`;
        const existing = matchedReleases.get(key);
        if (existing) {
          existing.score += 20;
          existing.matchedBy.push('date');
        } else {
          matchedReleases.set(key, {
            release,
            score: 20,
            matchedBy: ['date']
          });
        }
      }
    });
  }

  // 2. Búsqueda por categoría
  keywords.categories.forEach(category => {
    allReleases.forEach(release => {
      if (
        release.category.toLowerCase().includes(category.toLowerCase()) ||
        release.feature.toLowerCase().includes(category.toLowerCase())
      ) {
        const key = `${release.version}-${release.feature}`;
        const existing = matchedReleases.get(key);
        if (existing) {
          existing.score += 30;
          existing.matchedBy.push('category');
        } else {
          matchedReleases.set(key, {
            release,
            score: 30,
            matchedBy: ['category']
          });
        }
      }
    });
  });

  // 3. NUEVO: Búsqueda de frases multi-palabra (PRIORIDAD)
  keywords.keywords.forEach(keyword => {
    if (keyword.includes(' ')) { // Es una frase de múltiples palabras
      allReleases.forEach(release => {
        const searchText = `${release.feature} ${release.description} ${release.category}`.toLowerCase();
        const keywordLower = keyword.toLowerCase();

        if (searchText.includes(keywordLower)) {
          const key = `${release.version}-${release.feature}`;
          const existing = matchedReleases.get(key);

          // Mucho más puntos para frases exactas
          const points = 80;

          if (existing) {
            existing.score += points;
            existing.matchedBy.push('exact-phrase');
          } else {
            matchedReleases.set(key, {
              release,
              score: points,
              matchedBy: ['exact-phrase']
            });
          }
        }
      });
    }
  });

  // 4. Búsqueda por keywords individuales en contenido
  keywords.keywords.forEach(keyword => {
    if (keyword.length < 2 || keyword.includes(' ')) return; // Skip short or phrases

    allReleases.forEach(release => {
      const searchText = `${release.feature} ${release.description} ${release.category}`.toLowerCase();
      const keywordLower = keyword.toLowerCase();

      if (searchText.includes(keywordLower)) {
        const key = `${release.version}-${release.feature}`;
        const existing = matchedReleases.get(key);

        // More points if it's in the feature name
        const points = release.feature.toLowerCase().includes(keywordLower) ? 40 : 15;

        if (existing) {
          existing.score += points;
          if (!existing.matchedBy.includes('keyword')) {
            existing.matchedBy.push('keyword');
          }
        } else {
          matchedReleases.set(key, {
            release,
            score: points,
            matchedBy: ['keyword']
          });
        }
      }
    });
  });

  // 5. Búsqueda por keywords traducidos (si son diferentes)
  keywords.translatedKeywords.forEach(keyword => {
    if (keyword.length < 2 || keywords.keywords.includes(keyword)) return;

    allReleases.forEach(release => {
      const searchText = `${release.feature} ${release.description} ${release.category}`.toLowerCase();
      const keywordLower = keyword.toLowerCase();

      if (searchText.includes(keywordLower)) {
        const key = `${release.version}-${release.feature}`;
        const existing = matchedReleases.get(key);
        const points = release.feature.toLowerCase().includes(keywordLower) ? 40 : 15;

        if (existing) {
          existing.score += points;
          if (!existing.matchedBy.includes('translated-keyword')) {
            existing.matchedBy.push('translated-keyword');
          }
        } else {
          matchedReleases.set(key, {
            release,
            score: points,
            matchedBy: ['translated-keyword']
          });
        }
      }
    });
  });

  // 6. Ordenar por relevancia y tomar los top 20
  const sortedResults = Array.from(matchedReleases.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);

  // 7. Priorizar releases más recientes si hay empate en score
  const recentFirst = sortedResults.sort((a, b) => {
    if (a.score === b.score) {
      // Parse dates correctly for comparison
      const [yearA, monthA, dayA] = a.release.date.split('/').map(Number);
      const [yearB, monthB, dayB] = b.release.date.split('/').map(Number);

      const dateA = new Date(yearA, monthA - 1, dayA);
      const dateB = new Date(yearB, monthB - 1, dayB);

      return dateB.getTime() - dateA.getTime();
    }
    return b.score - a.score;
  });

  const topReleases = recentFirst.map(r => r.release);
  const avgScore = sortedResults.length > 0 
    ? sortedResults.reduce((sum, r) => sum + r.score, 0) / sortedResults.length 
    : 0;
  
  const allMatchedBy = [...new Set(sortedResults.flatMap(r => r.matchedBy))];

  return {
    releases: topReleases,
    relevanceScore: Math.min(100, avgScore),
    matchedBy: allMatchedBy
  };
}

export function getLatestReleases(allReleases: ReleaseNote[], count: number = 10): ReleaseNote[] {
  return [...allReleases]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, count);
}

export function searchByCategory(category: string, allReleases: ReleaseNote[]): ReleaseNote[] {
  return allReleases.filter(release =>
    release.category.toLowerCase().includes(category.toLowerCase()) ||
    release.feature.toLowerCase().includes(category.toLowerCase())
  );
}

export function searchByDateRange(
  startDate: string,
  endDate: string | undefined,
  allReleases: ReleaseNote[]
): ReleaseNote[] {
  return allReleases.filter(release => {
    if (endDate) {
      return release.date >= startDate && release.date <= endDate;
    }
    return release.date.includes(startDate);
  });
}