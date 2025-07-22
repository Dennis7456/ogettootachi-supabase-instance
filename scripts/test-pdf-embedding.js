import path from 'path';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const _supabase = createClient(supabaseUrl, supabaseServiceKey);

// Debug logging function to replace console.log
function debugLog(...args) {
  if (process.env.DEBUG === 'true') {
    const timestamp = new Date().toISOString();
    const logMessage = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg) : arg
    ).join(' ');
    process.stderr.write(`[DEBUG ${timestamp}] ${logMessage}\n`);
  }
}

async function testPdfEmbedding() {
  try {
    // Read the PDF file
    const pdfPath = path.join(
      process.cwd(),
      '..',
      'media',
      'blog-images',
      'FIRM PROFILE 2025-OGETTO,OTACHI & CO ADVOCATES.pdf'
    );
    if (!fs.existsSync(pdfPath)) {
      debugLog('❌ PDF file not found at:', pdfPath);
      return;
    }
    // For testing, we'll create a document with extracted text content
    // In a real scenario, you'd extract text from the PDF
    const pdfContent = `
      OGETTO, OTACHI & CO ADVOCATES - FIRM PROFILE 2025
      
      We are a leading law firm specializing in corporate law, commercial litigation
      and intellectual property rights. Our firm has been serving clients for over 
      two decades with excellence and integrity.
      
      Our practice areas include:
      - Corporate Law and Commercial Transactions
      - Litigation and Dispute Resolution
      - Intellectual Property and Technology Law
      - Employment and Labor Law
      - Real Estate and Property Law
      - Tax and Financial Services
      - Environmental and Energy Law
      
      Our team of experienced attorneys and advocates provides comprehensive legal 
      services to both domestic and international clients. We pride ourselves on 
      delivering practical, cost-effective solutions while maintaining the highest 
      standards of professional ethics.
      
      The firm has successfully handled numerous high-profile cases and transactions
      earning recognition for our expertise in complex legal matters and our 
      commitment to client satisfaction.
    `;
    debugLog(
      '📝 Extracted content length:',
      pdfContent.length,
      'characters'
    );
    // Create document in database
    const { data: docData, error: insertError } = await _supabase
      .from('documents')
      .insert({
        title: 'Firm Profile 2025',
        content: pdfContent,
        category: 'Firm Profile',
        file_type: 'application/pdf',
      })
      .select()
      .single();
    if (insertError) {
      debugLog('❌ Failed to create document:', insertError.message);
      return;
    }
    // Process with improved Edge Function
    const { data: _edgeData, error: edgeError } =
      await _supabase.functions.invoke('process-document', {
        body: { record: docData },
      });
    if (edgeError) {
      debugLog('❌ Edge Function failed:', edgeError.message);
      return;
    }
    // Get the processed document
    const { data: finalDoc, error: finalError } = await _supabase
      .from('documents')
      .select('*')
      .eq('id', docData.id)
      .single();
    if (finalError) {
      debugLog('❌ Failed to retrieve document:', finalError.message);
      return;
    }
    if (finalDoc.embedding) {
      // Parse the embedding (it might be stored as a string)
      let embedding;
      if (typeof finalDoc.embedding === 'string') {
        try {
          embedding = JSON.parse(finalDoc.embedding);
        } catch (e) {
          debugLog('❌ Failed to parse embedding string:', e.message);
          return;
        }
      } else {
        embedding = finalDoc.embedding;
      }
      // Analyze the embedding
      const nonZeroValues = embedding.filter(val => val > 0);
      const _maxValue = Math.max(...embedding);
      const _minValue = Math.min(...embedding);
      const _avgValue =
        embedding.reduce((sum, val) => sum + val, 0) / embedding.length;
      debugLog('   Sparsity:', nonZeroValues.length / embedding.length);
      // Show some sample values
      embedding.slice(0, 20).forEach((val, index) => {
        debugLog(`   Value at index ${index}: ${val}`);
      });
      // Show highest values
      const sortedIndices = embedding
        .map((val, index) => ({ val, index }))
        .sort((a, b) => b.val - a.val)
        .slice(0, 10);
      sortedIndices.forEach((item, rank) => {
        debugLog(`   Rank ${rank + 1}: Index ${item.index}, Value ${item.val}`);
      });
      // Show distribution of values
      const valueRanges = {
        '0.8-1.0': embedding.filter(val => val >= 0.8).length,
        '0.6-0.8': embedding.filter(val => val >= 0.6 && val < 0.8).length,
        '0.4-0.6': embedding.filter(val => val >= 0.4 && val < 0.6).length,
        '0.2-0.4': embedding.filter(val => val >= 0.2 && val < 0.4).length,
        '0.0-0.2': embedding.filter(val => val >= 0.0 && val < 0.2).length,
      };
      Object.entries(valueRanges).forEach(([range, count]) => {
        const percentage = ((count / embedding.length) * 100).toFixed(1);
        debugLog(`   Range ${range}: ${count} values (${percentage}%)`);
      });
    }
    // Clean up
    const { error: deleteError } = await _supabase
      .from('documents')
      .delete()
      .eq('id', docData.id);
    if (deleteError) {
      debugLog('❌ Failed to clean up:', deleteError.message);
    }
  } catch (error) {
    debugLog('❌ Test failed:', error.message);
    debugLog('Error details:', error);
  }
}
// Run the test
testPdfEmbedding();
