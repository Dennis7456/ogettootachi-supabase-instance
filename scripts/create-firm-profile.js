import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createFirmProfile() {
  console.log('=== Creating Firm Profile Document ===\n');

  try {
    // Step 1: Delete the test document
    console.log('1️⃣ Removing test document...');
    const { data: testDocs, error: fetchError } = await supabase
      .from('documents')
      .select('id, title')
      .eq('title', 'Dashboard Test Document');

    if (fetchError) {
      console.error('❌ Error fetching test documents:', fetchError.message);
      return;
    }

    if (testDocs && testDocs.length > 0) {
      for (const doc of testDocs) {
        const { error: deleteError } = await supabase
          .from('documents')
          .delete()
          .eq('id', doc.id);
        
        if (deleteError) {
          console.error(`❌ Error deleting test document ${doc.id}:`, deleteError.message);
        } else {
          console.log(`✅ Deleted test document: ${doc.title}`);
        }
      }
    }

    // Step 2: Create firm profile document
    console.log('\n2️⃣ Creating firm profile document...');
    
    const firmProfile = {
      title: 'Ogetto, Otachi & Co Advocates - Firm Profile',
      category: 'legal',
      content: `Ogetto, Otachi & Co Advocates is a prestigious law firm based in Kenya, established in 2003. We are committed to providing exceptional legal services with integrity, professionalism, and dedication to our clients' success.

Our firm specializes in comprehensive legal services across multiple practice areas:

CORPORATE LAW & COMMERCIAL TRANSACTIONS
We provide expert legal counsel for business formation, corporate governance, mergers and acquisitions, joint ventures, and commercial agreements. Our team assists clients with regulatory compliance, corporate restructuring, and strategic business transactions.

LITIGATION & DISPUTE RESOLUTION
Our litigation practice covers civil litigation, commercial disputes, arbitration, and mediation. We represent clients in courts at all levels and provide alternative dispute resolution services to achieve efficient and cost-effective solutions.

INTELLECTUAL PROPERTY & TECHNOLOGY LAW
We offer comprehensive IP services including patent registration, trademark protection, copyright matters, and technology licensing. Our team helps clients protect their intellectual property assets and navigate technology law issues.

EMPLOYMENT & LABOR LAW
We provide legal counsel on employment contracts, workplace policies, labor relations, discrimination cases, and employment disputes. Our expertise helps employers and employees navigate complex labor law matters.

REAL ESTATE & PROPERTY LAW
Our real estate practice covers property transactions, land disputes, real estate development, leasing agreements, and property registration. We assist clients with all aspects of real estate law and property rights.

TAX & FINANCIAL SERVICES
We provide tax planning, compliance, and advisory services for individuals and businesses. Our team helps clients navigate complex tax regulations and optimize their financial structures.

ENVIRONMENTAL & ENERGY LAW
We offer legal services for environmental compliance, energy projects, sustainability initiatives, and regulatory matters. Our expertise helps clients navigate environmental and energy law requirements.

Our firm has been serving clients for over two decades with a track record of successful outcomes and client satisfaction. We combine deep legal expertise with practical business understanding to deliver effective solutions.

For consultations and legal services, please contact our office. We are committed to providing timely, professional, and cost-effective legal solutions tailored to our clients' specific needs.`
    };

    const { data: newDoc, error: insertError } = await supabase
      .from('documents')
      .insert(firmProfile)
      .select()
      .single();

    if (insertError) {
      console.error('❌ Error creating firm profile:', insertError.message);
      return;
    }

    console.log('✅ Firm profile document created successfully!');
    console.log('   Document ID:', newDoc.id);
    console.log('   Title:', newDoc.title);

    // Step 3: Process with Edge Function
    console.log('\n3️⃣ Processing with Edge Function...');
    
    const { data: processData, error: processError } = await supabase.functions.invoke('process-document', {
      body: {
        document_id: newDoc.id,
        title: newDoc.title,
        category: newDoc.category,
        content: newDoc.content
      }
    });

    if (processError) {
      console.error('❌ Edge Function processing error:', processError.message);
    } else {
      console.log('✅ Edge Function processed successfully!');
      console.log('   Embedding length:', processData.embedding_length || 'N/A');
    }

    // Step 4: Verify final state
    console.log('\n4️⃣ Verifying final document state...');
    const { data: finalDoc, error: verifyError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', newDoc.id)
      .single();

    if (verifyError) {
      console.error('❌ Verification error:', verifyError.message);
    } else {
      console.log('✅ Final document state:');
      console.log('   ID:', finalDoc.id);
      console.log('   Title:', finalDoc.title);
      console.log('   Content length:', finalDoc.content?.length || 0);
      console.log('   Has embedding:', !!finalDoc.embedding);
      console.log('   Updated at:', finalDoc.updated_at);
    }

    console.log('\n🎉 Firm profile document created successfully!');
    console.log('\n📋 The chatbot will now use real firm information instead of test content.');
    console.log('\n💡 Test the chatbot with questions like:');
    console.log('   - "What is your name?"');
    console.log('   - "Tell me about your practice areas"');
    console.log('   - "What services do you offer?"');

  } catch (error) {
    console.error('❌ Failed to create firm profile:', error.message);
    console.error('Error details:', error);
  }
}

// Run the function
createFirmProfile(); 