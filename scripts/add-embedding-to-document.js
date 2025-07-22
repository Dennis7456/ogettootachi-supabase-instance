/* eslint-disable no-console, no-undef, no-unused-vars */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const _supabase = createClient(supabaseUrl, supabaseServiceKey);

// Utility function for logging errors
const logError = (prefix, error) => {
  if (error) {
    console.error(`❌ ${prefix}:`, error.message);
  }
};

async function generateEmbedding(_text) {
  // Use the same improved embedding function as the document processor
  const _limitedText = _text.substring(0, 8000);
  const _words = _limitedText
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((_word) => _word.length > 2)
    .slice(0, 800);

  const _embedding = new Array(1536).fill(0);

  // Common legal terms and their semantic weights
  const _legalTerms = {
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
    _data: 0.4,
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
    ogetto: 0.8,
    otachi: 0.8,
    kenya: 0.6,
    prestigious: 0.5,
    established: 0.5,
    formation: 0.6,
    governance: 0.6,
    acquisitions: 0.6,
    joint: 0.4,
    ventures: 0.4,
    restructuring: 0.6,
    strategic: 0.5,
    disputes: 0.6,
    resolution: 0.5,
    registration: 0.5,
    licensing: 0.5,
    assets: 0.4,
    policies: 0.4,
    relations: 0.4,
    transactions: 0.5,
    development: 0.4,
    leasing: 0.4,
    planning: 0.4,
    advisory: 0.5,
    structures: 0.4,
    compliance: 0.5,
    initiatives: 0.4,
    requirements: 0.4,
    outcomes: 0.4,
    satisfaction: 0.4,
    consultations: 0.5,
    tailored: 0.4,
    needs: 0.3,
  };

  // Add type checking and safer object handling
  function processLegalTerms(_terms) {
    if (typeof _terms !== 'object' || _terms === null) {
      throw new TypeError('Legal terms must be an object');
    }

    // Optional: Validate term values
    Object.entries(_terms).forEach(([_term, _weight]) => {
      if (typeof _term !== 'string' || typeof _weight !== 'number') {
        console.warn(`Invalid term or weight: ${_term}, ${_weight}`);
      }
    });

    return Object.freeze({ ..._terms }); // Return a frozen copy
  }

  const _processedLegalTerms = processLegalTerms(_legalTerms);

  _words.forEach((_word, _wordIndex) => {
    const _hash = _word.split('').reduce((_a, _b) => {
      _a = (_a << 5) - _a + _b.charCodeAt(0);
      return _a & _a;
    }, 0);

    const _semanticWeight = _processedLegalTerms[_word] || 0.1;
    const _numPositions = Math.max(1, Math.floor(_semanticWeight * 10));

    for (let _i = 0; _i < _numPositions; _i++) {
      const _position = Math.abs(_hash + _i * 31) % 1536;
      const _value = _semanticWeight * (1 - _i * 0.1);
      _embedding[_position] += _value;
    }

    const _freqPosition = (_wordIndex * 7) % 1536;
    _embedding[_freqPosition] += 0.2;

    const _lengthPosition = (_word.length * 13) % 1536;
    _embedding[_lengthPosition] += 0.1;
  });

  const _maxValue = Math.max(..._embedding);

  if (_maxValue > 0) {
    _embedding.forEach((_val, _index) => {
      _embedding[_index] = _val / _maxValue;
    });
  }

  _embedding.forEach((_val, _index) => {
    const _noise = (Math.sin(_index * 0.1) + 1) * 0.05;
    _embedding[_index] = Math.min(1, _val + _noise);
  });

  return _embedding;
}

async function addEmbeddingToDocument() {
  try {
    // Step 1: Get the firm profile document
    const { _data: _documents, _error: _fetchError } = await _supabase
      .from('documents')
      .select('*')
      .eq('title', 'Ogetto, Otachi & Co Advocates - Firm Profile');

    logError('Error fetching document', _fetchError);

    if (!_documents || _documents.length === 0) {
      console.error('❌ No firm profile document found');
      return;
    }

    const _document = _documents[0];

    // Step 2: Generate embedding
    const _embedding = await generateEmbedding(_document.content);

    // Step 3: Update document with embedding
    const { _data: _updatedDoc, _error: _updateError } = await _supabase
      .from('documents')
      .update({
        embedding: _embedding,
        updated_at: new Date().toISOString(),
      })
      .eq('id', _document.id)
      .select()
      .single();

    logError('Error updating document', _updateError);

    // Step 4: Test document search
    const _testQuery = 'practice areas';
    const _queryEmbedding = await generateEmbedding(_testQuery);

    const { _data: _searchResults, _error: _searchError } = await _supabase.rpc('match_documents', {
      query_embedding: _queryEmbedding,
      match_threshold: 0.1,
      match_count: 3,
    });

    logError('Search error', _searchError);

    if (_searchResults) {
      _searchResults.forEach((_doc, _index) => {
        console.log(`Search result ${_index + 1}:`, _doc);
      });
    }
  } catch (_error) {
    console.error('❌ Failed to add embedding:', _error.message);
  }
}

// Run the function
addEmbeddingToDocument();
