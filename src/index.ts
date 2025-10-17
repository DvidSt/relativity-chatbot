import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { getReleaseData } from './services/data.service';
import { validateContactInfo, submitContactInfo } from './services/contact.service';
import { detectIntent, IntentType } from './services/intent.service';
import { handleGreeting } from './services/conversation.service';
import { conductResearch } from './services/research.service';
import { generateEscalationMessage } from './services/escalation.service';
import { startAutoUpdater } from './services/updater.service';
import { ContactInfo } from './types';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Store chat sessions
const chatSessions = new Map<string, { context: any[]; lastActivity: Date }>();

// Chat endpoint - NEW INTELLIGENT VERSION
app.post('/api/chat', async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    if (!message) return res.status(400).json({ error: 'Message required' });

    console.log(`\n📨 New message: "${message}"`);

    // Get or create session
    let session = chatSessions.get(sessionId) || { context: [], lastActivity: new Date() };

    // STEP 1: Detect Intent
    const intent = await detectIntent(message);
    console.log(`🎯 Intent detected: ${intent.type} (confidence: ${intent.confidence}%, language: ${intent.language})`);

    let answer = '';
    let needsContact = false;
    let confidence = intent.confidence;

    // STEP 2: Route to appropriate flow
    switch (intent.type) {
      case IntentType.GREETING:
        // GREETING FLOW: Casual conversation
        console.log('💬 Routing to GREETING flow');
        answer = await handleGreeting(message, intent.language);
        needsContact = false;
        break;

      case IntentType.QUESTION:
        // QUESTION FLOW: Research and answer
        console.log('🔍 Routing to QUESTION flow');
        const releases = await getReleaseData();
        const researchResult = await conductResearch(message, intent.language, releases);
        
        if (researchResult.needsEscalation) {
          // ESCALATION FLOW: Cannot answer
          console.log('⚠️ Escalating to contact form');
          const reason = researchResult.releasesUsed === 0 
            ? 'No relevant releases found'
            : 'Insufficient information in available releases';
          answer = await generateEscalationMessage(message, reason, intent.language);
          needsContact = true;
          confidence = 0;
        } else {
          // Success: Found answer
          answer = researchResult.answer;
          needsContact = false;
          confidence = researchResult.confidence;
          console.log(`✅ Answer generated using ${researchResult.releasesUsed} releases`);
        }
        break;

      case IntentType.UNKNOWN:
      default:
        // ESCALATION FLOW: Unknown intent
        console.log('❓ Unknown intent, escalating');
        answer = await generateEscalationMessage(
          message, 
          'Unable to determine intent', 
          intent.language
        );
        needsContact = true;
        confidence = 0;
        break;
    }

    // Update session
    session.context.push({ 
      question: message, 
      answer, 
      intent: intent.type,
      timestamp: new Date() 
    });
    session.lastActivity = new Date();
    chatSessions.set(sessionId, session);

    console.log(`📤 Sending response (needsContact: ${needsContact})\n`);

    res.json({
      answer,
      needsContact,
      confidence,
      intent: intent.type // For debugging
    });

  } catch (error) {
    console.error('❌ Chat error:', error);
    res.status(500).json({ error: 'Failed to process chat message' });
  }
});

// Contact submission endpoint
app.post('/api/contact', async (req, res) => {
  try {
    const contactData: ContactInfo = req.body;

    console.log('📝 Contact submission received:', contactData.name);

    await submitContactInfo(contactData);

    res.json({
      success: true,
      message: 'Thank you! Our team will reach out to you soon.'
    });

  } catch (error) {
    console.error('❌ Contact logging error:', error);
    res.status(500).json({ error: 'Failed to save contact information' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'Relativity Chatbot API',
    version: '2.0',
    features: ['intent-detection', 'smart-search', 'ai-escalation']
  });
});

// Clean up old sessions every hour
setInterval(() => {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  for (const [sessionId, session] of chatSessions.entries()) {
    if (session.lastActivity < oneHourAgo) {
      chatSessions.delete(sessionId);
      console.log(`🧹 Cleaned up session: ${sessionId}`);
    }
  }
}, 60 * 60 * 1000);

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════╗
║   🚀 Relativity Chatbot API v2.0                  ║
║   Port: ${PORT}                                    ║
║   ✅ Intent Detection System Active               ║
║   ✅ Smart Search Engine Ready                    ║
║   ✅ AI-Powered Responses Enabled                 ║
║   ✅ Auto-Updater Initialized                     ║
╚════════════════════════════════════════════════════╝
  `);
  
  // Start the auto-updater service
  startAutoUpdater();
});