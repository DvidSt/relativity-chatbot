import { GoogleGenerativeAI } from '@google/generative-ai';

export enum IntentType {
  GREETING = 'GREETING',
  QUESTION = 'QUESTION',
  ESCALATION_REQUEST = 'ESCALATION_REQUEST',
  UNKNOWN = 'UNKNOWN'
}

export interface IntentResult {
  type: IntentType;
  confidence: number;
  language: 'es' | 'en' | 'other';
}

// Patrones simples para detección rápida
const GREETING_PATTERNS = {
  es: /^(hola|buenos días|buenas tardes|buenas noches|hey|saludos|qué tal|cómo estás|cómo estas|buena|bueno|hola!|buenos días!|buenas tardes!|buenas noches!|hola\?|qué tal\?)/i,
  en: /^(hello|hi|hey|good morning|good afternoon|good evening|greetings|what's up|whats up|how are you|hi!|hello!|hey!|good morning!|good afternoon!|good evening!)/i
};

const QUESTION_PATTERNS = {
  es: /(qué|que|cuál|cual|cómo|como|cuándo|cuando|dónde|donde|por qué|porque|existe|hay|puedes|puede|tiene|nuevo|nueva|actualización|versión|version|release|función|funcion|feature)/i,
  en: /(what|which|how|when|where|why|does|is there|can|could|has|new|update|version|release|feature|function)/i
};

const ESCALATION_PATTERNS = {
  es: /(quiero hablar|hablar con|contactar|llamar|comprar|adquirir|servicio|plan|cuenta|upgrade|mejorar|agrandar|soporte humano|persona real|representante|asesor|ventas|sales)/i,
  en: /(want to talk|talk to|contact|call|buy|purchase|service|plan|account|upgrade|improve|support person|real person|representative|advisor|sales|sales team)/i
};

export async function detectIntent(message: string): Promise<IntentResult> {
  const trimmedMessage = message.trim().toLowerCase();

  // Detectar idioma
  const language = detectLanguage(trimmedMessage);

  // Detección rápida por patrones
  const greetingPattern = language === 'other' ? GREETING_PATTERNS.en : GREETING_PATTERNS[language];
  const questionPattern = language === 'other' ? QUESTION_PATTERNS.en : QUESTION_PATTERNS[language];
  const escalationPattern = language === 'other' ? ESCALATION_PATTERNS.en : ESCALATION_PATTERNS[language];

  // ESCALATION REQUEST: Si pide hablar con persona, comprar servicios, etc.
  if (escalationPattern.test(trimmedMessage)) {
    return {
      type: IntentType.ESCALATION_REQUEST,
      confidence: 95,
      language
    };
  }

  // Si es un saludo simple (muy corto y coincide con patrón)
  if (trimmedMessage.length < 50 && greetingPattern.test(trimmedMessage)) {
    // Verificar que no sea una pregunta disfrazada
    if (!questionPattern.test(trimmedMessage) && !trimmedMessage.includes('?')) {
      return {
        type: IntentType.GREETING,
        confidence: 95,
        language
      };
    }
  }

  // Si contiene patrones de pregunta
  if (questionPattern.test(trimmedMessage) || trimmedMessage.includes('?')) {
    return {
      type: IntentType.QUESTION,
      confidence: 90,
      language
    };
  }

  // Si es muy corto y no es saludo, probablemente sea conversación casual
  if (trimmedMessage.length < 30) {
    return {
      type: IntentType.GREETING,
      confidence: 70,
      language
    };
  }

  // Por defecto, asumir pregunta si es más largo
  return {
    type: IntentType.QUESTION,
    confidence: 75,
    language
  };
}

function detectLanguage(text: string): 'es' | 'en' | 'other' {
  const spanishWords = /\b(qué|que|cómo|como|por qué|porque|cuándo|cuando|dónde|donde|hay|está|esta|son|tiene|puede|nuevo|nueva|función|funcion|versión|version)\b/i;
  const englishWords = /\b(what|how|why|when|where|there|is|are|has|can|new|function|feature|version)\b/i;
  
  const hasSpanish = spanishWords.test(text);
  const hasEnglish = englishWords.test(text);
  
  if (hasSpanish && !hasEnglish) return 'es';
  if (hasEnglish && !hasSpanish) return 'en';
  if (hasSpanish) return 'es'; // Priorizar español si hay ambos
  
  return 'en'; // Default a inglés
}