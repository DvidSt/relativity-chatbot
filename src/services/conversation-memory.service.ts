import { ReleaseNote } from '../types';

interface ConversationTurn {
  timestamp: Date;
  userMessage: string;
  botResponse: string;
  releasesUsed: ReleaseNote[];
  intent: string;
}

interface UserSession {
  sessionId: string;
  conversationHistory: ConversationTurn[];
  lastActivity: Date;
  language: 'es' | 'en' | 'other';
}

// In-memory storage (usar Redis en producción)
const sessions = new Map<string, UserSession>();

// Limpiar sesiones viejas cada 30 minutos
setInterval(() => {
  const now = new Date();
  for (const [sessionId, session] of sessions.entries()) {
    const hoursSinceActivity = (now.getTime() - session.lastActivity.getTime()) / (1000 * 60 * 60);
    if (hoursSinceActivity > 2) { // 2 horas de inactividad
      sessions.delete(sessionId);
      console.log(`🗑️ Session expired: ${sessionId}`);
    }
  }
}, 30 * 60 * 1000);

export function getOrCreateSession(sessionId: string): UserSession {
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, {
      sessionId,
      conversationHistory: [],
      lastActivity: new Date(),
      language: 'en'
    });
    console.log(`✨ New session created: ${sessionId}`);
  }
  
  const session = sessions.get(sessionId)!;
  session.lastActivity = new Date();
  return session;
}

export function addToConversation(
  sessionId: string,
  userMessage: string,
  botResponse: string,
  releasesUsed: ReleaseNote[],
  intent: string,
  language: 'es' | 'en' | 'other'
): void {
  const session = getOrCreateSession(sessionId);
  
  session.conversationHistory.push({
    timestamp: new Date(),
    userMessage,
    botResponse,
    releasesUsed,
    intent
  });
  
  session.language = language;
  
  // Mantener solo las últimas 10 interacciones (memoria corta)
  if (session.conversationHistory.length > 10) {
    session.conversationHistory = session.conversationHistory.slice(-10);
  }
  
  console.log(`💾 Conversation saved (${session.conversationHistory.length} turns)`);
}

export function getConversationContext(sessionId: string): string {
  const session = sessions.get(sessionId);
  if (!session || session.conversationHistory.length === 0) {
    return '';
  }
  
  // Tomar las últimas 3 interacciones
  const recentHistory = session.conversationHistory.slice(-3);
  
  const contextLines = recentHistory.map((turn, index) => {
    return `[${index + 1}] Usuario: ${turn.userMessage}\nAsistente: ${turn.botResponse}`;
  });
  
  return contextLines.join('\n\n');
}

export function getLastReleases(sessionId: string): ReleaseNote[] {
  const session = sessions.get(sessionId);
  if (!session || session.conversationHistory.length === 0) {
    return [];
  }
  
  const lastTurn = session.conversationHistory[session.conversationHistory.length - 1];
  return lastTurn.releasesUsed || [];
}

export function getLastUserMessage(sessionId: string): string | null {
  const session = sessions.get(sessionId);
  if (!session || session.conversationHistory.length === 0) {
    return null;
  }
  
  const lastTurn = session.conversationHistory[session.conversationHistory.length - 1];
  return lastTurn.userMessage;
}

export function detectFollowUpQuestion(
  currentMessage: string,
  sessionId: string
): { isFollowUp: boolean; topic: string | null } {
  const session = sessions.get(sessionId);
  
  // No hay historial → no puede ser follow-up
  if (!session || session.conversationHistory.length === 0) {
    return { isFollowUp: false, topic: null };
  }
  
  const lowerMessage = currentMessage.toLowerCase();
  
  // Patrones de follow-up claros
  const followUpPatterns = [
    /no entiendo/i,
    /expl[ií]came/i,
    /m[aá]s (informaci[oó]n|detalle|claro)/i,
    /c[oó]mo (as[ií]|es eso)/i,
    /a qu[ée] te refieres/i,
    /tell me more/i,
    /explain/i,
    /what do you mean/i,
    /can you clarify/i,
    /more details/i,
    /elaborate/i
  ];
  
  // Patrones de resumen/síntesis (también son follow-ups)
  const summaryPatterns = [
    /resumen/i,
    /resumir/i,
    /de qu[ée] trata/i,
    /en resumen/i,
    /summary/i,
    /summarize/i,
    /what.*about/i,
    /sobre qu[ée]/i,
    /r[aá]pido/i  // "resumen rápido"
  ];
  
  // Referencias al mensaje anterior
  const referencePatterns = [
    /^(y\s+)?(eso|ese|esos|esas|esto)/i,  // "y eso qué significa"
    /^(y\s+)?cu[aá]l/i,  // "y cuál es la diferencia"
    /^ok.*pero/i,  // "ok pero..."
    /^ah.*y/i,  // "ah y..."
    /estos?\s+(cambios?|releases?)/i  // "estos cambios"
  ];
  
  const isFollowUp = 
    followUpPatterns.some(pattern => pattern.test(currentMessage)) ||
    summaryPatterns.some(pattern => pattern.test(currentMessage)) ||
    referencePatterns.some(pattern => pattern.test(currentMessage));
  
  if (isFollowUp) {
    const lastMessage = getLastUserMessage(sessionId);
    return {
      isFollowUp: true,
      topic: lastMessage
    };
  }
  
  return { isFollowUp: false, topic: null };
}

export function getSessionLanguage(sessionId: string): 'es' | 'en' | 'other' {
  const session = sessions.get(sessionId);
  return session?.language || 'en';
}

export function clearSession(sessionId: string): void {
  sessions.delete(sessionId);
  console.log(`🗑️ Session cleared: ${sessionId}`);
}

// Debug
export function getActiveSessions(): number {
  return sessions.size;
}