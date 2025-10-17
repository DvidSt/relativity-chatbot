import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs/promises';
import path from 'path';

const GREETING_PROMPT_PATH = path.join(__dirname, '../prompts/GREETING_PROMPT.txt');

export async function handleGreeting(message: string, language: 'es' | 'en' | 'other'): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not set');

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  // Load prompt template
  let promptTemplate: string;
  try {
    promptTemplate = await fs.readFile(GREETING_PROMPT_PATH, 'utf-8');
  } catch (error) {
    console.error('Error loading greeting prompt:', error);
    // Fallback prompt
    promptTemplate = `You are a friendly Relativity assistant. The user said: "${message}". Respond warmly and professionally in the same language.`;
  }

  const fullPrompt = `${promptTemplate}\n\nUser message: "${message}"\n\nYour response:`;

  try {
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error('Conversation error:', error);
    
    // Fallback responses
    if (language === 'es') {
      return '¡Hola! Soy tu asistente de Relativity. ¿En qué puedo ayudarte hoy?';
    }
    return 'Hello! I\'m your Relativity assistant. How can I help you today?';
  }
}