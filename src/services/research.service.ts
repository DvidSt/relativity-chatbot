import { ReleaseNote } from '../types';
import { extractKeywords } from './keyword.service';
import { smartSearch } from './search.service';
import { generateAnswer } from './gemini.service';

export interface ResearchResult {
  answer: string;
  confidence: number;
  releasesUsed: number;
  needsEscalation: boolean;
}

export async function conductResearch(
  question: string,
  language: 'es' | 'en' | 'other',
  allReleases: ReleaseNote[]
): Promise<ResearchResult> {
  console.log(`🔍 Conducting research for: "${question}"`);

  // 1. Extract keywords from the question
  const keywords = await extractKeywords(question, language);
  console.log(`📝 Keywords extracted:`, keywords.keywords);

  // 2. Smart search for relevant releases
  const searchResult = await smartSearch(keywords, allReleases);
  console.log(`📊 Found ${searchResult.releases.length} relevant releases (score: ${searchResult.relevanceScore})`);

  // 3. Check if we have enough relevant information
  if (searchResult.releases.length === 0) {
    console.log('⚠️ No relevant releases found, escalating');
    return {
      answer: '',
      confidence: 0,
      releasesUsed: 0,
      needsEscalation: true
    };
  }

  // 4. If relevance score is too low, escalate
  if (searchResult.relevanceScore < 30 && searchResult.releases.length < 5) {
    console.log('⚠️ Low relevance score and few results, escalating');
    return {
      answer: '',
      confidence: 0,
      releasesUsed: 0,
      needsEscalation: true
    };
  }

  // 5. Generate answer using the relevant releases
  try {
    const answer = await generateAnswer(question, searchResult.releases, language);
    
    // Check if the AI indicated it needs more info
    if (answer.toLowerCase().includes('more detailed information') || 
        answer.toLowerCase().includes('información más detallada')) {
      console.log('🤖 AI indicated needs escalation');
      return {
        answer,
        confidence: 50,
        releasesUsed: searchResult.releases.length,
        needsEscalation: true
      };
    }

    console.log(`✅ Research complete with ${searchResult.releases.length} releases`);
    return {
      answer,
      confidence: Math.min(95, searchResult.relevanceScore),
      releasesUsed: searchResult.releases.length,
      needsEscalation: false
    };
  } catch (error) {
    console.error('❌ Error generating answer:', error);
    return {
      answer: '',
      confidence: 0,
      releasesUsed: 0,
      needsEscalation: true
    };
  }
}