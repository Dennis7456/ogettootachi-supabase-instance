/* eslint-disable no-console, no-undef */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const _supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const _supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

// Utility function for logging errors
const _logError = (prefix, _error) => {
  if (_error) {
    console.error(`❌ ${prefix}:`, _error.message || _error);
  }
};

const _supabase = createClient(_supabaseUrl, _supabaseServiceKey);

async function createFirmProfile() {
  try {
    // Step 1: Delete the test document
    const { _data: _testDocs, _error: _fetchError } = await _supabase
      .from('documents')
      .select('id, title')
      .eq('title', 'Dashboard Test Document');

    _logError('Error fetching test documents', _fetchError);

    if (_fetchError) {
      return;
    }

    if (_testDocs && _testDocs.length > 0) {
      for (const _doc of _testDocs) {
        const { _error: _deleteError } = await _supabase
          .from('documents')
          .delete()
          .eq('id', _doc.id);

        _logError(`Error deleting test document ${_doc.id}`, _deleteError);
      }
    }

    // Step 2: Create firm profile document
    const _firmProfile = {
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
For consultations and legal services, please contact our office. We are committed to providing timely, professional, and cost-effective legal solutions tailored to our clients' specific needs.`,
    };

    const { _data: _newDoc, _error: _insertError } = await _supabase
      .from('documents')
      .insert(_firmProfile)
      .select()
      .single();

    _logError('Error creating firm profile', _insertError);

    if (_insertError) {
      return;
    }

    // Step 3: Process with Edge Function
    const { _data: _processData, _error: _processError } =
      await _supabase.functions.invoke('process-document', {
        body: {
          document_id: _newDoc.id,
          title: _newDoc.title,
          category: _newDoc.category,
          content: _newDoc.content,
        },
      });

    _logError('Edge Function processing error', _processError);

    // Step 4: Verify final state
    const { _data: _finalDoc, _error: _verifyError } = await _supabase
      .from('documents')
      .select('*')
      .eq('id', _newDoc.id)
      .single();

    _logError('Verification error', _verifyError);

    console.log(
      '📋 The chatbot will now use real firm information instead of test content.'
    );
  } catch (_error) {
    console.error('❌ Failed to create firm profile:', _error.message);
    console.error('Error details:', _error);
  }
}

// Run the function
createFirmProfile();
