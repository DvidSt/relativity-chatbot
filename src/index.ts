import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { getReleaseData, debugReleases } from './services/data.service';
import { submitContactInfo } from './services/contact.service';
import { detectIntent, IntentType } from './services/intent.service';
import { handleGreeting } from './services/conversation.service';
import { conductResearch } from './services/research.service';
import { generateEscalationMessage } from './services/escalation.service';
import { startAutoUpdater } from './services/updater.service';
import { getActiveSessions } from './services/conversation-memory.service';
import { ContactInfo } from './types';

dotenv.config();

// Debug releases on startup
debugReleases().catch(console.error);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Helper function to get or create sessionId
function getSessionId(req: express.Request): string {
  // Try to get sessionId from body first
  if (req.body.sessionId) {
    return req.body.sessionId;
  }
  
  // Generate sessionId based on IP + User-Agent
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';
  
  return crypto
    .createHash('sha256')
    .update(`${ip}-${userAgent}`)
    .digest('hex')
    .substring(0, 16);
}

// Chat endpoint - INTELLIGENT VERSION WITH MEMORY
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message required' });
    }

    // Get or generate sessionId
    const sessionId = getSessionId(req);

    console.log(`\n📨 New message: "${message}" (Session: ${sessionId.substring(0, 8)}...)`);
    console.log(`👥 Active sessions: ${getActiveSessions()}`);

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

      case IntentType.ESCALATION_REQUEST:
        // ESCALATION REQUEST FLOW: User wants to talk to person, buy services, etc.
        console.log('📞 Routing to ESCALATION REQUEST flow');
        answer = await generateEscalationMessage(
          message,
          'User requested human assistance or services beyond release information',
          intent.language
        );
        needsContact = true;
        confidence = 0;
        break;

      case IntentType.QUESTION:
        // QUESTION FLOW: Research and answer WITH MEMORY
        console.log('🔍 Routing to QUESTION flow');
        const releases = await getReleaseData();

        // AHORA conductResearch recibe el sessionId
        const researchResult = await conductResearch(
          message,
          intent.language,
          releases,
          sessionId  // ← NUEVO: Pasar sessionId
        );

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

    console.log(`📤 Sending response (needsContact: ${needsContact})\n`);

    res.json({
      answer,
      needsContact,
      confidence,
      sessionId, // Devolver sessionId al frontend
      intent: intent.type
    });

  } catch (error) {
    console.error('❌ Chat error:', error);
    res.status(500).json({ 
      error: 'Failed to process chat message',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
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
    version: '3.0',
    features: [
      'intent-detection', 
      'smart-search', 
      'ai-escalation',
      'conversation-memory',  // NUEVO
      'follow-up-detection'   // NUEVO
    ],
    activeSessions: getActiveSessions()
  });
});

// NUEVO: Debug endpoint para ver sesiones activas
app.get('/api/debug/sessions', (req, res) => {
  res.json({
    activeSessions: getActiveSessions(),
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════╗
║   🚀 Relativity Chatbot API v3.0                  ║
║   Port: ${PORT}                                    ║
║   ✅ Intent Detection System Active               ║
║   ✅ Smart Search Engine Ready                    ║
║   ✅ AI-Powered Responses Enabled                 ║
║   ✅ Conversation Memory Active                   ║
║   ✅ Follow-Up Detection Enabled                  ║
║   ✅ Auto-Updater Initialized                     ║
╚════════════════════════════════════════════════════╝
  `);
  
  // Start the auto-updater service
  startAutoUpdater();
});