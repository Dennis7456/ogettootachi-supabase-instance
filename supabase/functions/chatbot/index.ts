// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { 
  withAuth, 
  AuthResult, 
  authenticateRequest 
} from '../_shared/auth.ts';
import { 
  corsHeaders, 
  createErrorResponse 
} from '../_shared/error-handler.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// In-memory conversation state (ephemeral, for demo; use Redis or DB for production)
const conversationStates = new Map<string, any>();

function detectIntent(message: string, state: any = null) {
  const lower = message.toLowerCase();
  if (state?.flow === 'message_staff') return 'message_staff';
  if (state?.flow === 'book_appointment') return 'book_appointment';
  if (/\b(book|appointment|schedule|consultation|meet)\b/.test(lower)) return 'book_appointment';
  if (/\b(contact|message|reach|email|phone|send)\b/.test(lower)) return 'message_staff';
  if (
    /\b(service|practice|offer|area|policy|team|case|experience|unique|about|who|what|where|when|how)\b/.test(
      lower
    )
  )
    return 'info';
  return 'ambiguous';
}

function blendDocuments(docs: any[]) {
  if (!docs.length) return '';
  // Synthesize a summary, cite titles/years if available
  let summary = docs
    .map((doc, i) => {
      let cite = doc.title ? ` (see: ${doc.title}${doc.category ? ', ' + doc.category : ''})` : '';
      let content = doc.content.replace(/\s+/g, ' ').slice(0, 350);
      return `- ${content}${cite}`;
    })
    .join('\n');
  return summary;
}

// Logging function
function log(entry: {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  method?: string;
  path?: string;
  userId?: string;
  userRole?: string;
  clientId?: string;
  duration?: number;
  statusCode?: number;
  error?: string;
  metadata?: Record<string, any>;
}) {
  console.log(JSON.stringify(entry));
}

// Main chatbot request handler
async function handleChatbotRequest(req: Request, authResult: AuthResult | null): Promise<Response> {
  const startTime = Date.now();
  const url = new URL(req.url);
  const method = req.method;
  const path = url.pathname;

  try {
    const { message, session_id } = await req.json();

    if (!message) {
      throw new Error('Message is required');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Generate embedding for user message
    const messageEmbedding = await generateEmbedding(message);

    // Search for relevant documents
    const { data: documents, error: searchError } = await supabase.rpc('match_documents', {
      query_embedding: messageEmbedding,
      match_threshold: 0.1, // Lower threshold for better matches
      match_count: 3,
    });

    if (searchError) {
      console.error('Search error:', searchError);
      // Continue without documents if search fails
    }

    // Generate response using rule-based system
    const response = await generateResponse(message, documents || [], session_id);

    // Store conversation only if user is authenticated
    if (authResult?.user) {
      try {
        const { error: insertError } = await supabase.from('chatbot_conversations').insert({
          user_id: authResult.user.id,
          session_id,
          message,
          response: response.response,
          documents_used: documents?.map((d) => ({ id: d.id, title: d.title })) || [],
          tokens_used: response.tokens_used || 0,
        });

        if (insertError) {
          console.error('Insert error:', insertError);
          // Don't fail the request if conversation storage fails
        }
      } catch (error) {
        console.error('Conversation storage error:', error);
      }
    }

    const duration = Date.now() - startTime;

    // Log chatbot interaction
    log({
      timestamp: new Date().toISOString(),
      level: 'info',
      message: 'Chatbot interaction processed',
      method,
      path,
      userId: authResult?.user?.id,
      userRole: authResult?.profile?.role,
      duration,
      statusCode: 200,
      metadata: {
        sessionId: session_id,
        tokensUsed: response.tokens_used || 0,
        authenticated: !!authResult,
      },
    });

    return new Response(
      JSON.stringify({
        response: response.response,
        documents: documents || [],
        tokens_used: response.tokens_used || 0,
        authenticated: !!authResult,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('Chatbot error:', error);

    return createErrorResponse(error, {
      method,
      path,
      duration,
    });
  }
}

// Main serve function
export default serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Method not allowed', 
        allowedMethods: ['POST', 'OPTIONS'] 
      }), 
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  // Chatbot allows unauthenticated requests
  try {
    // Try to authenticate, but don't require it
    const authResult = await authenticateRequest(req, {
      requireAuth: false
    });
    return await handleChatbotRequest(req, authResult);
  } catch (error) {
    // If authentication fails, still allow chatbot interaction
    return await handleChatbotRequest(req, null);
  }
});

async function generateEmbedding(text: string): Promise<number[]> {
  // Use the same improved embedding function as the document processor
  const limitedText = text.substring(0, 8000);
  const words = limitedText
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2)
    .slice(0, 800);

  const embedding = new Array(1536).fill(0);

  // Common legal terms and their semantic weights
  const legalTerms = {
    law: 0.8,
    legal: 0.8,
    attorney: 0.7,
    lawyer: 0.7,
    advocate: 0.7,
    court: 0.6,
    judge: 0.6,
    case: 0.6,
    client: 0.6,
    contract: 0.6,
    agreement: 0.5,
    document: 0.5,
    firm: 0.5,
    practice: 0.5,
    rights: 0.5,
    property: 0.4,
    business: 0.4,
    corporate: 0.4,
    commercial: 0.4,
    litigation: 0.7,
    arbitration: 0.6,
    mediation: 0.6,
    settlement: 0.5,
    appeal: 0.6,
    trial: 0.6,
    evidence: 0.5,
    testimony: 0.5,
    witness: 0.5,
    plaintiff: 0.6,
    defendant: 0.6,
    prosecution: 0.6,
    defense: 0.6,
    constitutional: 0.7,
    statute: 0.6,
    regulation: 0.5,
    compliance: 0.5,
    intellectual: 0.6,
    patent: 0.6,
    trademark: 0.6,
    copyright: 0.6,
    employment: 0.5,
    labor: 0.5,
    discrimination: 0.6,
    harassment: 0.6,
    tax: 0.5,
    finance: 0.4,
    banking: 0.4,
    insurance: 0.4,
    'real estate': 0.5,
    family: 0.4,
    divorce: 0.6,
    custody: 0.6,
    inheritance: 0.5,
    estate: 0.5,
    criminal: 0.7,
    felony: 0.6,
    misdemeanor: 0.6,
    probation: 0.5,
    immigration: 0.6,
    citizenship: 0.6,
    visa: 0.5,
    deportation: 0.6,
    environmental: 0.6,
    energy: 0.4,
    healthcare: 0.5,
    medical: 0.4,
    technology: 0.4,
    software: 0.4,
    data: 0.4,
    privacy: 0.5,
    security: 0.4,
    services: 0.4,
    help: 0.3,
    assist: 0.3,
    support: 0.3,
    advice: 0.5,
    practice: 0.6,
    areas: 0.4,
    specialties: 0.5,
    expertise: 0.6,
  };

  words.forEach((word, wordIndex) => {
    const hash = word.split('').reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0);

    const semanticWeight = legalTerms[word] || 0.1;

    const numPositions = Math.max(1, Math.floor(semanticWeight * 10));

    for (let i = 0; i < numPositions; i++) {
      const position = Math.abs(hash + i * 31) % 1536;
      const value = semanticWeight * (1 - i * 0.1);
      embedding[position] += value;
    }

    const freqPosition = (wordIndex * 7) % 1536;
    embedding[freqPosition] += 0.2;

    const lengthPosition = (word.length * 13) % 1536;
    embedding[lengthPosition] += 0.1;
  });

  const maxValue = Math.max(...embedding);
  if (maxValue > 0) {
    embedding.forEach((val, index) => {
      embedding[index] = val / maxValue;
    });
  }

  embedding.forEach((val, index) => {
    const noise = (Math.sin(index * 0.1) + 1) * 0.05;
    embedding[index] = Math.min(1, val + noise);
  });

  return embedding;
}

async function generateResponse(message: string, documents: any[], session_id?: string) {
  // Track or initialize conversation state
  let state = session_id ? conversationStates.get(session_id) : null;
  const intent = detectIntent(message, state);

  // If new session, initialize state
  if (session_id && !state) {
    state = { flow: null, step: 0, data: {} };
    conversationStates.set(session_id, state);
  }

  // Info intent: blend documents and answer
  if (intent === 'info') {
    let docSummary = blendDocuments(documents);

    // Check if it's a practice areas question
    const lowerMessage = message.toLowerCase();
    if (
      lowerMessage.includes('practice area') ||
      lowerMessage.includes('practice areas') ||
      lowerMessage.includes('services') ||
      lowerMessage.includes('offer') ||
      lowerMessage.includes('specialties') ||
      lowerMessage.includes('expertise')
    ) {
      const practiceAreasResponse = `Based on our firm's expertise, Ogetto, Otachi & Company Advocates offers comprehensive legal services across multiple practice areas:

**Constitutional Law**
Expert representation in constitutional matters and human rights cases, including constitutional interpretation, judicial review proceedings, and public interest litigation.

**Commercial Law**
Comprehensive legal solutions for businesses and commercial transactions, including contract drafting, mergers and acquisitions, and commercial dispute resolution.

**International Criminal Law**
Specialized expertise in international tribunals and criminal proceedings, with representation before the International Criminal Court at The Hague and other international courts.

**Corporate Law**
Strategic legal counsel for corporate governance and compliance, including company formation, board advisory services, and regulatory compliance.

**Additional Services**
We also provide expertise in Litigation, Legal Advisory Services, Public Law, and International Law.

${docSummary ? `\n\nAdditional information from our resources:\n${docSummary}` : ''}

Would you like to schedule a consultation to discuss your specific legal needs?`;

      return {
        response: practiceAreasResponse,
        tokens_used: practiceAreasResponse.split(' ').length,
      };
    }

    // Check if it's about what makes the firm unique
    if (
      lowerMessage.includes('unique') ||
      lowerMessage.includes('different') ||
      lowerMessage.includes('special') ||
      lowerMessage.includes('distinctive') ||
      lowerMessage.includes('stand out') ||
      lowerMessage.includes('competitive advantage')
    ) {
      const uniqueResponse = `Ogetto, Otachi & Company Advocates stands out for several distinctive qualities that set us apart:

**Distinguished Leadership**
Our founding partners bring exceptional credentials:
• Mr. Kennedy Ogeto - Former Solicitor General of Kenya (2018-2023)
• Mr. Gershom Otachi Bw'Omanwa - Chairman of Kenya's National Land Commission (2019-Present)

**International Prestige**
We have represented clients before prestigious international courts:
• International Criminal Court (ICC) at The Hague
• UN Rwanda Tribunal
• Special Court for Sierra Leone

**Unique Combination of Expertise**
• Deep local knowledge combined with international experience
• Government service background providing insider understanding
• Specialized expertise in constitutional and international criminal law
• Established since 2007 with proven track record

**Comprehensive Service Approach**
• Full-service legal practice across multiple specialties
• Client-focused approach with personalized attention
• Commitment to excellence and professional integrity
• Strategic thinking combined with practical legal solutions

**Proven Track Record**
• Over 16 years of successful legal practice
• Hundreds of cases handled with high success rates
• Strong reputation in both local and international legal communities

This unique combination of government experience, international expertise, and local knowledge makes us the preferred choice for complex legal matters requiring both local insight and international perspective.

Would you like to learn more about our specific practice areas or schedule a consultation?`;

      return {
        response: uniqueResponse,
        tokens_used: uniqueResponse.split(' ').length,
      };
    }

    // Check if it's about international cases
    if (
      lowerMessage.includes('international') ||
      lowerMessage.includes('global') ||
      lowerMessage.includes('cross-border') ||
      lowerMessage.includes('foreign') ||
      lowerMessage.includes('icc') ||
      lowerMessage.includes('hague') ||
      lowerMessage.includes('tribunal') ||
      lowerMessage.includes('un')
    ) {
      const internationalResponse = `Yes, Ogetto, Otachi & Company Advocates has extensive experience handling international cases and is recognized for our international legal expertise:

**International Criminal Court (ICC) Representation**
• We have represented clients before the International Criminal Court at The Hague
• Our team has deep understanding of international criminal law and procedures
• Experience with complex international criminal proceedings

**International Tribunal Experience**
• UN Rwanda Tribunal representation
• Special Court for Sierra Leone cases
• Expertise in international humanitarian law

**International Legal Services**
• Cross-border legal disputes and litigation
• International commercial arbitration
• Extradition matters and international legal cooperation
• International treaty interpretation and application
• Cross-border corporate transactions

**Specialized International Expertise**
• International criminal defense
• International human rights law
• International commercial law
• Cross-border regulatory compliance
• International legal research and analysis

**Why Choose Us for International Cases**
• Founding partners with government and international experience
• Proven track record in prestigious international courts
• Deep understanding of both local and international legal systems
• Network of international legal contacts and resources
• Multilingual capabilities and cultural sensitivity

Our international experience, combined with our local expertise, makes us uniquely qualified to handle complex international legal matters that require both global perspective and local knowledge.

Would you like to discuss your specific international legal matter or schedule a consultation?`;

      return {
        response: internationalResponse,
        tokens_used: internationalResponse.split(' ').length,
      };
    }

    let answer = docSummary
      ? `Here's what I found from our internal resources:\n${docSummary}\n\nIf you'd like more details or a summary by email, just let me know!`
      : `I couldn't find a direct answer in our internal documents, but I'm here to help. Could you clarify your question or ask about a specific service, policy, or team member?`;
    // Proactive suggestion
    answer += '\n\nWould you like to schedule a consultation or send a message to our staff?';
    return { response: answer, tokens_used: answer.split(' ').length };
  }

  // Transactional and ambiguous flows will be handled in the next chunk...
  // ... existing code ...

  // Handle ambiguous queries with clarification
  if (intent === 'ambiguous') {
    const clarification = `I want to make sure I help you best. Are you looking for:
• Information about our services or policies?
• To send a message to our staff?
• To schedule a consultation or appointment?
• Something else?

Just let me know what you need!`;
    return {
      response: clarification,
      tokens_used: clarification.split(' ').length,
    };
  }

  // Handle messaging staff flow
  if (intent === 'message_staff') {
    if (!state.flow || state.flow !== 'message_staff') {
      // Start messaging flow
      state.flow = 'message_staff';
      state.step = 1;
      state.data = {};
      conversationStates.set(session_id!, state);

      const response = `I'd be happy to help you send a message to our staff! 

To get started, could you tell me:
1. What's your message about? (e.g., legal inquiry, general question, etc.)
2. Your name and contact information (email or phone)

I'll make sure your message gets to the right person.`;
      return { response: response, tokens_used: response.split(' ').length };
    }

    // Continue messaging flow based on step
    if (state.step === 1) {
      // Collect message content and contact info
      const lines = message.split('\n');
      let messageContent = '';
      let contactInfo = '';

      for (const line of lines) {
        if (line.includes('@') || /\d{10,}/.test(line)) {
          contactInfo = line.trim();
        } else if (line.trim()) {
          messageContent += line.trim() + ' ';
        }
      }

      if (messageContent && contactInfo) {
        state.data.message = messageContent.trim();
        state.data.contact = contactInfo;
        state.step = 2;
        conversationStates.set(session_id!, state);

        const confirmation = `Perfect! Let me confirm your message:

**Message:** ${state.data.message}
**Contact:** ${state.data.contact}

Should I send this message to our staff? (Reply with "yes" to send, or "no" to edit)`;
        return {
          response: confirmation,
          tokens_used: confirmation.split(' ').length,
        };
      } else {
        const clarification = `I need both your message and contact information. Could you please provide:
• Your message content
• Your email address or phone number

For example: "I need help with a contract dispute. My email is john@example.com"`;
        return {
          response: clarification,
          tokens_used: clarification.split(' ').length,
        };
      }
    }

    if (state.step === 2) {
      if (message.toLowerCase().includes('yes') || message.toLowerCase().includes('send')) {
        // Send message via API (mock for now)
        try {
          // TODO: Integrate with actual messaging API
          // const result = await sendMessageToStaff(state.data);

          // Reset flow
          state.flow = null;
          state.step = 0;
          state.data = {};
          conversationStates.set(session_id!, state);

          const success = `✅ Message sent successfully! 

Our staff will review your message and get back to you at ${state.data.contact} within 24 hours.

Is there anything else I can help you with today?`;
          return { response: success, tokens_used: success.split(' ').length };
        } catch (error) {
          const errorMsg = `I apologize, but I'm having trouble sending your message right now. 

Please try:
• Using our contact form on the website
• Calling our office directly during business hours
• Sending an email to info@ogettoandotachi.co.ke

Would you like me to help you with anything else?`;
          return {
            response: errorMsg,
            tokens_used: errorMsg.split(' ').length,
          };
        }
      } else {
        // Reset to step 1 to re-enter message
        state.step = 1;
        state.data = {};
        conversationStates.set(session_id!, state);

        const retry = `No problem! Let's start over. 

Please tell me:
1. What's your message about?
2. Your name and contact information (email or phone)`;
        return { response: retry, tokens_used: retry.split(' ').length };
      }
    }
  }

  // Handle appointment booking flow
  if (intent === 'book_appointment') {
    if (!state.flow || state.flow !== 'book_appointment') {
      // Start booking flow
      state.flow = 'book_appointment';
      state.step = 1;
      state.data = {};
      conversationStates.set(session_id!, state);

      const response = `Great! I'd be happy to help you schedule a consultation. 

To get started, could you tell me:
1. What type of legal matter you'd like to discuss?
2. Your preferred date and time (we're available Monday-Friday, 9 AM - 5 PM)
3. Your name and contact information

I'll check availability and confirm your appointment.`;
      return { response: response, tokens_used: response.split(' ').length };
    }

    // Continue booking flow based on step
    if (state.step === 1) {
      // Parse appointment details
      const lower = message.toLowerCase();
      let serviceType = '';
      let dateTime = '';
      let contactInfo = '';

      // Extract service type
      if (lower.includes('corporate') || lower.includes('business')) serviceType = 'Corporate Law';
      else if (lower.includes('litigation') || lower.includes('dispute'))
        serviceType = 'Litigation';
      else if (lower.includes('employment') || lower.includes('labor'))
        serviceType = 'Employment Law';
      else if (lower.includes('intellectual') || lower.includes('ip') || lower.includes('patent'))
        serviceType = 'Intellectual Property';
      else if (lower.includes('real estate') || lower.includes('property'))
        serviceType = 'Real Estate';
      else if (lower.includes('tax') || lower.includes('financial'))
        serviceType = 'Tax & Financial';
      else if (lower.includes('environmental') || lower.includes('energy'))
        serviceType = 'Environmental & Energy';
      else serviceType = 'General Consultation';

      // Extract date/time (simple parsing)
      const dateMatch = message.match(/(\d{1,2}\/\d{1,2}|\d{1,2}-\d{1,2}|\d{1,2}\.\d{1,2})/);
      const timeMatch = message.match(/(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?)/);

      if (dateMatch) dateTime = dateMatch[1];
      if (timeMatch) dateTime += ' ' + timeMatch[1];

      // Extract contact info
      const emailMatch = message.match(/[\w.-]+@[\w.-]+\.\w+/);
      const phoneMatch = message.match(/\d{10,}/);

      if (emailMatch) contactInfo = emailMatch[0];
      else if (phoneMatch) contactInfo = phoneMatch[0];

      if (dateTime && contactInfo) {
        state.data.service = serviceType;
        state.data.datetime = dateTime;
        state.data.contact = contactInfo;
        state.step = 2;
        conversationStates.set(session_id!, state);

        const confirmation = `Perfect! Let me confirm your appointment request:

**Service:** ${state.data.service}
**Date/Time:** ${state.data.datetime}
**Contact:** ${state.data.contact}

Should I check availability and book this appointment? (Reply with "yes" to confirm, or "no" to edit)`;
        return {
          response: confirmation,
          tokens_used: confirmation.split(' ').length,
        };
      } else {
        const clarification = `I need both your preferred date/time and contact information. Could you please provide:
• The type of legal matter
• Your preferred date and time (e.g., "Monday 2 PM" or "Jan 15th at 3:00 PM")
• Your email or phone number

For example: "I need help with a contract. Monday 2 PM. My email is john@example.com"`;
        return {
          response: clarification,
          tokens_used: clarification.split(' ').length,
        };
      }
    }

    if (state.step === 2) {
      if (message.toLowerCase().includes('yes') || message.toLowerCase().includes('confirm')) {
        // Check availability and book (mock for now)
        try {
          // TODO: Integrate with actual scheduling API
          // const result = await checkAvailabilityAndBook(state.data);

          // Reset flow
          state.flow = null;
          state.step = 0;
          state.data = {};
          conversationStates.set(session_id!, state);

          const success = `✅ Appointment confirmed! 

**Your Consultation:**
• Service: ${state.data.service}
• Date/Time: ${state.data.datetime}
• Contact: ${state.data.contact}

Our team will send you a confirmation email with meeting details and any preparation needed.

Would you like me to email you a summary of this conversation?`;
          return { response: success, tokens_used: success.split(' ').length };
        } catch (error) {
          const errorMsg = `I apologize, but I'm having trouble booking your appointment right now. 

Please try:
• Calling our office directly at +254 (0) 20 XXX XXXX
• Using our online booking form on the website
• Sending an email to appointments@ogettoandotachi.co.ke

Would you like me to help you with anything else?`;
          return {
            response: errorMsg,
            tokens_used: errorMsg.split(' ').length,
          };
        }
      } else {
        // Reset to step 1 to re-enter details
        state.step = 1;
        state.data = {};
        conversationStates.set(session_id!, state);

        const retry = `No problem! Let's start over. 

Please tell me:
1. What type of legal matter you'd like to discuss?
2. Your preferred date and time
3. Your name and contact information`;
        return { response: retry, tokens_used: retry.split(' ').length };
      }
    }
  }

  // Fallback for any unhandled cases
  const fallback = `I'm here to help! I can assist you with:
• Information about our services and policies
• Sending a message to our staff
• Scheduling a consultation

What would you like to do?`;
  return { response: fallback, tokens_used: fallback.split(' ').length };
}
