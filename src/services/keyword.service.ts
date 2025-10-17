import { GoogleGenerativeAI } from '@google/generative-ai';

export interface KeywordResult {
  keywords: string[];
  translatedKeywords: string[];
  categories: string[];
  dateRange?: { start?: string; end?: string };
}

// Categorías conocidas de Relativity
const KNOWN_CATEGORIES = [
  'Enhancement', 'Resolved defect', 'Deprecation', 'Change',
  'Processing', 'Legal Hold', 'aiR for Review', 'Review', 'Analytics',
  'Search', 'Imaging', 'Production', 'ARM', 'Collect', 'Integration Points'
];

export async function extractKeywords(message: string, language: 'es' | 'en' | 'other'): Promise<KeywordResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not set');

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = `Extract keywords from this Relativity software question:

"${message}"

Extract:
1. Main technical terms (product names, features, etc.)
2. Action words (new, update, change, etc.)
3. Time references (2025, last year, recent, etc.)
4. Translate Spanish terms to English if needed

Known Relativity products: aiR for Review, Processing, Legal Hold, Collect, ARM, Analytics, Review Center, Integration Points

Return ONLY a JSON object:
{
  "keywords": ["term1", "term2"],
  "categories": ["category1"],
  "year": "2025" or null
}`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();
    
    // Parse JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      
      return {
        keywords: parsed.keywords || [],
        translatedKeywords: parsed.keywords || [],
        categories: parsed.categories || [],
        dateRange: parsed.year ? { start: parsed.year } : undefined
      };
    }
  } catch (error) {
    console.error('Keyword extraction error:', error);
  }

  // Fallback: simple extraction
  return simpleKeywordExtraction(message);
}

function simpleKeywordExtraction(message: string): KeywordResult {
  const keywords: string[] = [];
  const categories: string[] = [];
  let dateRange: { start?: string; end?: string } | undefined;

  const lowerMessage = message.toLowerCase();

  // Extract years
  const yearMatch = lowerMessage.match(/\b(20\d{2})\b/);
  if (yearMatch) {
    dateRange = { start: yearMatch[1] };
  }

  // Extract known categories
  KNOWN_CATEGORIES.forEach(category => {
    if (lowerMessage.includes(category.toLowerCase())) {
      categories.push(category);
    }
  });

  // NUEVO: Extract multi-word phrases (2-4 words)
  const phrasePattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})\b/g;
  const phrases = message.match(phrasePattern);
  if (phrases) {
    phrases.forEach(phrase => {
      if (phrase.split(' ').length >= 2) {
        keywords.push(phrase);
      }
    });
  }

  // Extract common keywords
  const commonKeywords = [
    'air', 'processing', 'legal hold', 'review', 'analytics',
    'search', 'imaging', 'production', 'collect', 'arm',
    'new', 'update', 'feature', 'enhancement', 'change',
    'last', 'latest', 'recent', 'release',
    'nuevo', 'nueva', 'actualización', 'función', 'característica'
  ];

  commonKeywords.forEach(keyword => {
    if (lowerMessage.includes(keyword)) {
      keywords.push(keyword);
    }
  });

  return {
    keywords: [...new Set(keywords)],
    translatedKeywords: [...new Set(keywords)],
    categories: [...new Set(categories)],
    dateRange
  };
}