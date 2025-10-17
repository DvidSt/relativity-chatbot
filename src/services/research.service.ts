import { ReleaseNote } from '../types';
import { executeQuery } from './query-engine.service';
import { generateAnswer, generateFollowUpAnswer } from './gemini.service';
import { 
  getConversationContext, 
  getLastReleases, 
  detectFollowUpQuestion,
  addToConversation 
} from './conversation-memory.service';

export interface ResearchResult {
  answer: string;
  confidence: number;
  releasesUsed: number;
  needsEscalation: boolean;
}

export async function conductResearch(
  question: string,
  language: 'es' | 'en' | 'other',
  allReleases: ReleaseNote[],
  sessionId: string
): Promise<ResearchResult> {
  console.log(`🔍 Conducting intelligent research for: "${question}"`);
  
  // 1. Detectar si es una pregunta de seguimiento (follow-up)
  const followUp = detectFollowUpQuestion(question, sessionId);
  
  if (followUp.isFollowUp) {
    console.log(`🔄 Follow-up detected about: "${followUp.topic}"`);
    
    const previousReleases = getLastReleases(sessionId);
    
    if (previousReleases.length > 0) {
      try {
        const conversationContext = getConversationContext(sessionId);
        const answer = await generateFollowUpAnswer(
          question,
          previousReleases,
          conversationContext,
          language
        );
        
        console.log(`✅ Follow-up answer generated`);
        
        // Guardar en memoria
        addToConversation(
          sessionId,
          question,
          answer,
          previousReleases,
          'follow-up',
          language
        );
        
        return {
          answer,
          confidence: 90,
          releasesUsed: previousReleases.length,
          needsEscalation: false
        };
      } catch (error) {
        console.error('❌ Error generating follow-up:', error);
        // Continuar con búsqueda normal
      }
    }
  }
  
  // 2. USAR EL NUEVO MOTOR DE CONSULTAS
  const queryResult = executeQuery(question, allReleases);
  
  console.log(`🎯 Query Type: ${queryResult.queryType}`);
  console.log(`📊 Found ${queryResult.releases.length} releases (confidence: ${queryResult.confidence}%)`);
  console.log(`💡 ${queryResult.explanation}`);
  
  // 3. Validar resultados
  if (queryResult.releases.length === 0) {
    console.log('⚠️ No releases found, escalating');
    return {
      answer: '',
      confidence: 0,
      releasesUsed: 0,
      needsEscalation: true
    };
  }
  
  // 4. Si la confianza es muy baja, escalar
  if (queryResult.confidence < 40) {
    console.log('⚠️ Low confidence query, escalating');
    return {
      answer: '',
      confidence: queryResult.confidence,
      releasesUsed: queryResult.releases.length,
      needsEscalation: true
    };
  }
  
  // 5. Generar respuesta con IA
  try {
    const conversationContext = getConversationContext(sessionId);
    const answer = await generateAnswer(
      question, 
      queryResult.releases, 
      language,
      conversationContext
    );
    
    // Detectar si la IA no pudo responder
    if (answer.toLowerCase().includes('more detailed information') ||
        answer.toLowerCase().includes('información más detallada') ||
        answer.toLowerCase().includes('nuestro equipo de soporte')) {
      console.log('🤖 AI indicated insufficient information, escalating');
      return {
        answer,
        confidence: 40,
        releasesUsed: queryResult.releases.length,
        needsEscalation: true
      };
    }
    
    console.log(`✅ Research complete with ${queryResult.releases.length} releases`);
    
    // Guardar en memoria de conversación
    addToConversation(
      sessionId,
      question,
      answer,
      queryResult.releases,
      queryResult.queryType,
      language
    );
    
    return {
      answer,
      confidence: queryResult.confidence,
      releasesUsed: queryResult.releases.length,
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