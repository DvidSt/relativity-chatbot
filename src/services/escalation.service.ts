import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs/promises';
import path from 'path';

const ESCALATION_PROMPT_PATH = path.join(__dirname, '../prompts/ESCALATION_PROMPT.txt');

export async function generateEscalationMessage(
  question: string,
  reason: string,
  language: 'es' | 'en' | 'other'
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not set');

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  // Load prompt template
  let promptTemplate: string;
  try {
    promptTemplate = await fs.readFile(ESCALATION_PROMPT_PATH, 'utf-8');
  } catch (error) {
    console.error('Error loading escalation prompt:', error);
    promptTemplate = `Generate a friendly message explaining we cannot answer the question and need to collect contact info.`;
  }

  // Replace placeholders
  const fullPrompt = promptTemplate
    .replace('{QUESTION}', question)
    .replace('{REASON}', reason);

  try {
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error('Escalation message generation error:', error);
    
    // Fallback messages
    if (language === 'es') {
      return 'No tengo información específica sobre eso en nuestras notas de lanzamiento actuales. Sin embargo, nuestro equipo de soporte estará encantado de ayudarte. ¿Podrías compartir tus datos de contacto para que puedan comunicarse contigo?';
    }
    return 'I don\'t have specific information about that in our current release notes. However, our support team would be happy to help you! Could you please share your contact details so they can reach out to you?';
  }
}