import { GoogleGenerativeAI } from '@google/generative-ai';
import { ReleaseNote, ChatResponse } from '../types';
import fs from 'fs/promises';
import path from 'path';

const QUESTION_PROMPT_PATH = path.join(__dirname, '../prompts/QUESTION_PROMPT.txt');
const FOLLOWUP_PROMPT_PATH = path.join(__dirname, '../prompts/FOLLOWUP_PROMPT.txt');

// Legacy function - kept for backwards compatibility
export async function generateChatResponse(
  question: string,
  context: ReleaseNote[]
): Promise<ChatResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not set');

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  // Prepare context from release notes (limit to first 50 to avoid token limits)
  const limitedContext = context.slice(0, 50);
  const contextText = limitedContext.map(r =>
    `${r.date} - ${r.feature} (${r.category}): ${r.description}`
  ).join('\n');

  const prompt = `You are a Relativity releases expert. Use ONLY the following release information to answer questions:

${contextText}

QUESTION: ${question}

RESPONSE RULES:
1. Answer ONLY about Relativity releases based on the provided information
2. If you cannot answer the question with the available information, respond with exactly: "NEEDS_CONTACT"
3. Be concise and professional
4. Cite specific versions when mentioning features
5. If answering, provide confidence score (0-100) at the end as: CONFIDENCE:X

Your response should be just the answer, or "NEEDS_CONTACT", followed by confidence if applicable.`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text().trim();

  if (text === 'NEEDS_CONTACT') {
    return {
      answer: "I need more information to answer that properly. May I collect your contact details so our team can assist you?",
      needsContact: true,
      confidence: 0
    };
  }

  // Extract confidence if present
  const confidenceMatch = text.match(/CONFIDENCE:(\d+)/);
  const confidence = confidenceMatch ? parseInt(confidenceMatch[1]) : 80;
  const cleanAnswer = text.replace(/CONFIDENCE:\d+/, '').trim();

  return {
    answer: cleanAnswer,
    needsContact: false,
    confidence
  };
}

// New function for research flow with conversation context
export async function generateAnswer(
  question: string,
  relevantReleases: ReleaseNote[],
  language: 'es' | 'en' | 'other',
  conversationContext?: string
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not set');

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-2.5-flash',
    generationConfig: {
      temperature: 0.7,
      topP: 0.9,
      topK: 40,
    }
  });

  // Load prompt template
  let promptTemplate: string;
  try {
    promptTemplate = await fs.readFile(QUESTION_PROMPT_PATH, 'utf-8');
  } catch (error) {
    console.error('Error loading question prompt:', error);
    promptTemplate = `Answer the question based on these releases:\n{CONTEXT}\n\nQuestion: {QUESTION}`;
  }

  // Format releases as context
  const contextText = relevantReleases.map(r =>
    `• ${r.date} - ${r.feature} (${r.category}): ${r.description}`
  ).join('\n');

  // Replace placeholders
  let fullPrompt = promptTemplate
    .replace('{CONTEXT}', contextText)
    .replace('{QUESTION}', question);

  // Add conversation context if available
  if (conversationContext) {
    fullPrompt = `PREVIOUS CONVERSATION:\n${conversationContext}\n\n` + fullPrompt;
  }

  try {
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error('Answer generation error:', error);
    throw error;
  }
}

// NEW: Function specifically for follow-up questions
export async function generateFollowUpAnswer(
  question: string,
  previousReleases: ReleaseNote[],
  conversationContext: string,
  language: 'es' | 'en' | 'other'
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not set');

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-2.5-flash',
    generationConfig: {
      temperature: 0.8, // Más creatividad para explicaciones
      topP: 0.9,
      topK: 40,
    }
  });

  // Load follow-up prompt template
  let promptTemplate: string;
  try {
    promptTemplate = await fs.readFile(FOLLOWUP_PROMPT_PATH, 'utf-8');
  } catch (error) {
    console.error('Error loading follow-up prompt, using default');
    promptTemplate = `CONVERSATION HISTORY:
{CONVERSATION_CONTEXT}

RELEASES DISCUSSED:
{RELEASES}

USER FOLLOW-UP QUESTION:
{QUESTION}

The user is asking for clarification or more details about the previous response. Provide a clear, detailed explanation using the same release information, but explain it differently or provide more context.

Respond in ${language === 'es' ? 'Spanish' : 'English'}.`;
  }

  // Format releases
  const releasesText = previousReleases.map(r =>
    `• ${r.date} - ${r.feature} (${r.category}): ${r.description}`
  ).join('\n');

  // Replace placeholders
  const fullPrompt = promptTemplate
    .replace('{CONVERSATION_CONTEXT}', conversationContext)
    .replace('{RELEASES}', releasesText)
    .replace('{QUESTION}', question)
    .replace('{LANGUAGE}', language === 'es' ? 'Spanish' : 'English');

  try {
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error('Follow-up answer generation error:', error);
    throw error;
  }
}