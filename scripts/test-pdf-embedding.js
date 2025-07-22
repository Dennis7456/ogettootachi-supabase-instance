const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const _supabase = _createClient(supabaseUrl, supabaseServiceKey);
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
      console.error('❌ PDF file not found at:', pdfPath);
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
      '📝 Extracted content length:',
      pdfContent.length,
      'characters'
    );
    // Create document in database
    const { _data: docData, _error: insertError } = await _supabase
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
      console.error('❌ Failed to create document:', insertError.message);
      return;
    }
    // Process with improved Edge Function
    const { _data: edgeData, _error: edgeError } =
      await _supabase.functions.invoke('process-document', {
        body: { record: docData },
      });
    if (edgeError) {
      console.error('❌ Edge Function failed:', edgeError.message);
      return;
    }
    // Get the processed document
    const { _data: finalDoc, _error: finalError } = await _supabase
      .from('documents')
      .select('*')
      .eq('id', docData.id)
      .single();
    if (finalError) {
      console.error('❌ Failed to retrieve document:', finalError.message);
      return;
    }
    if (finalDoc.embedding) {
      // Parse the embedding (it might be stored as a string)
      let embedding;
      if (typeof finalDoc.embedding === 'string') {
        try {
          embedding = JSON.parse(finalDoc.embedding);
        } catch (e) {
          console.error('❌ Failed to parse embedding string:', e.message);
          return;
        }
      } else {
        embedding = finalDoc.embedding;
      }
      // Analyze the embedding
      const nonZeroValues = embedding.filter(val => val > 0);
      const maxValue = Math.max(...embedding);
      const minValue = Math.min(...embedding);
      const avgValue =
        embedding.reduce((sum, val) => sum + val, 0) / embedding.length;
        '   Sparsity:',
        `${(((embedding.length - nonZeroValues.length) / embedding.length) * 100).toFixed(1)}%`
      );
      // Show some sample values
      embedding.slice(0, 20).forEach((val, _index) => {});
      // Show highest values
      const sortedIndices = embedding
        .map((val, _index) => ({ val, _index }))
        .sort((a, b) => b.val - a.val)
        .slice(0, 10);
      sortedIndices.forEach((item, rank) => {});
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
      });
    }
    // Clean up
    const { _error: deleteError } = await _supabase
      .from('documents')
      .delete()
      .eq('id', docData.id);
    if (deleteError) {
      console.error('❌ Failed to clean up:', deleteError.message);
    } else {
    }
  } catch (_error) {
    console.error('❌ Test failed:', _error.message);
    console.error('Error details:', _error);
  }
}
// Run the test
testPdfEmbedding();
