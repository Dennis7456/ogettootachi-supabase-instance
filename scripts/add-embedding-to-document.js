import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function generateEmbedding(text) {
  // Use the same improved embedding function as the document processor
  const limitedText = text.substring(0, 8000)
  const words = limitedText.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2)
    .slice(0, 800)
  
  const embedding = new Array(1536).fill(0)
  
  // Common legal terms and their semantic weights
  const legalTerms = {
    'law': 0.8, 'legal': 0.8, 'attorney': 0.7, 'lawyer': 0.7, 'advocate': 0.7,
    'court': 0.6, 'judge': 0.6, 'case': 0.6, 'client': 0.6, 'contract': 0.6,
    'agreement': 0.5, 'document': 0.5, 'firm': 0.5, 'practice': 0.5, 'rights': 0.5,
    'property': 0.4, 'business': 0.4, 'corporate': 0.4, 'commercial': 0.4,
    'litigation': 0.7, 'arbitration': 0.6, 'mediation': 0.6, 'settlement': 0.5,
    'appeal': 0.6, 'trial': 0.6, 'evidence': 0.5, 'testimony': 0.5, 'witness': 0.5,
    'plaintiff': 0.6, 'defendant': 0.6, 'prosecution': 0.6, 'defense': 0.6,
    'constitutional': 0.7, 'statute': 0.6, 'regulation': 0.5, 'compliance': 0.5,
    'intellectual': 0.6, 'patent': 0.6, 'trademark': 0.6, 'copyright': 0.6,
    'employment': 0.5, 'labor': 0.5, 'discrimination': 0.6, 'harassment': 0.6,
    'tax': 0.5, 'finance': 0.4, 'banking': 0.4, 'insurance': 0.4, 'real estate': 0.5,
    'family': 0.4, 'divorce': 0.6, 'custody': 0.6, 'inheritance': 0.5, 'estate': 0.5,
    'criminal': 0.7, 'felony': 0.6, 'misdemeanor': 0.6, 'probation': 0.5,
    'immigration': 0.6, 'citizenship': 0.6, 'visa': 0.5, 'deportation': 0.6,
    'environmental': 0.6, 'energy': 0.4, 'healthcare': 0.5, 'medical': 0.4,
    'technology': 0.4, 'software': 0.4, 'data': 0.4, 'privacy': 0.5, 'security': 0.4,
    'services': 0.4, 'help': 0.3, 'assist': 0.3, 'support': 0.3, 'advice': 0.5,
    'practice': 0.6, 'areas': 0.4, 'specialties': 0.5, 'expertise': 0.6,
    'ogetto': 0.8, 'otachi': 0.8, 'kenya': 0.6, 'prestigious': 0.5, 'established': 0.5,
    'formation': 0.6, 'governance': 0.6, 'acquisitions': 0.6, 'joint': 0.4, 'ventures': 0.4,
    'restructuring': 0.6, 'strategic': 0.5, 'disputes': 0.6, 'resolution': 0.5,
    'registration': 0.5, 'licensing': 0.5, 'assets': 0.4, 'policies': 0.4,
    'relations': 0.4, 'transactions': 0.5, 'development': 0.4, 'leasing': 0.4,
    'planning': 0.4, 'advisory': 0.5, 'structures': 0.4, 'compliance': 0.5,
    'initiatives': 0.4, 'requirements': 0.4, 'outcomes': 0.4, 'satisfaction': 0.4,
    'consultations': 0.5, 'tailored': 0.4, 'needs': 0.3
  }
  
  words.forEach((word, wordIndex) => {
    const hash = word.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0)
      return a & a
    }, 0)
    
    const semanticWeight = legalTerms[word] || 0.1
    
    const numPositions = Math.max(1, Math.floor(semanticWeight * 10))
    
    for (let i = 0; i < numPositions; i++) {
      const position = Math.abs(hash + i * 31) % 1536
      const value = semanticWeight * (1 - i * 0.1)
      embedding[position] += value
    }
    
    const freqPosition = (wordIndex * 7) % 1536
    embedding[freqPosition] += 0.2
    
    const lengthPosition = (word.length * 13) % 1536
    embedding[lengthPosition] += 0.1
  })
  
  const maxValue = Math.max(...embedding)
  if (maxValue > 0) {
    embedding.forEach((val, index) => {
      embedding[index] = val / maxValue
    })
  }
  
  embedding.forEach((val, index) => {
    const noise = (Math.sin(index * 0.1) + 1) * 0.05
    embedding[index] = Math.min(1, val + noise)
  })
  
  return embedding
}

async function addEmbeddingToDocument() {
  console.log('=== Adding Embedding to Firm Profile Document ===\n');

  try {
    // Step 1: Get the firm profile document
    console.log('1️⃣ Fetching firm profile document...');
    const { data: documents, error: fetchError } = await supabase
      .from('documents')
      .select('*')
      .eq('title', 'Ogetto, Otachi & Co Advocates - Firm Profile');

    if (fetchError) {
      console.error('❌ Error fetching document:', fetchError.message);
      return;
    }

    if (!documents || documents.length === 0) {
      console.error('❌ No firm profile document found');
      return;
    }

    const document = documents[0];
    console.log('✅ Found document:', document.title);
    console.log('   ID:', document.id);
    console.log('   Content length:', document.content?.length || 0);

    // Step 2: Generate embedding
    console.log('\n2️⃣ Generating embedding...');
    const embedding = await generateEmbedding(document.content);
    console.log('✅ Embedding generated successfully!');
    console.log('   Embedding length:', embedding.length);

    // Step 3: Update document with embedding
    console.log('\n3️⃣ Updating document with embedding...');
    const { data: updatedDoc, error: updateError } = await supabase
      .from('documents')
      .update({ 
        embedding: embedding,
        updated_at: new Date().toISOString()
      })
      .eq('id', document.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error updating document:', updateError.message);
      return;
    }

    console.log('✅ Document updated successfully!');
    console.log('   Has embedding:', !!updatedDoc.embedding);
    console.log('   Updated at:', updatedDoc.updated_at);

    // Step 4: Test document search
    console.log('\n4️⃣ Testing document search...');
    const testQuery = "practice areas";
    const queryEmbedding = await generateEmbedding(testQuery);
    
    const { data: searchResults, error: searchError } = await supabase.rpc('match_documents', {
      query_embedding: queryEmbedding,
      match_threshold: 0.1,
      match_count: 3
    });

    if (searchError) {
      console.error('❌ Search error:', searchError.message);
    } else {
      console.log('✅ Search test successful!');
      console.log(`   Found ${searchResults.length} documents:`);
      searchResults.forEach((doc, index) => {
        console.log(`   ${index + 1}. ${doc.title} (similarity: ${doc.similarity?.toFixed(3) || 'N/A'})`);
      });
    }

    console.log('\n🎉 Firm profile document is now ready for the chatbot!');
    console.log('\n📋 The chatbot will now use real firm information.');
    console.log('\n💡 Test the chatbot with:');
    console.log('   - "What is your name?"');
    console.log('   - "Tell me about your practice areas"');
    console.log('   - "What services do you offer?"');

  } catch (error) {
    console.error('❌ Failed to add embedding:', error.message);
    console.error('Error details:', error);
  }
}

// Run the function
addEmbeddingToDocument(); 