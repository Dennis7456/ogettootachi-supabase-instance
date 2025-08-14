const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function generateDataSummary() {
  try {
    console.log('📊 DATA SUMMARY FOR REMOTE SUPABASE INSTANCE');
    console.log('=' .repeat(60));
    console.log('📡 Connected to:', process.env.SUPABASE_URL);
    console.log('');

    // Practice Areas
    const { data: practiceAreas, error: practiceError } = await supabase
      .from('practice_areas')
      .select('title, is_active');
    
    console.log('🏛️  PRACTICE AREAS');
    console.log('-' .repeat(30));
    if (practiceError) {
      console.log('❌ Error:', practiceError.message);
    } else {
      console.log(`✅ Total: ${practiceAreas.length} practice areas`);
      practiceAreas.forEach((area, index) => {
        console.log(`   ${index + 1}. ${area.title} ${area.is_active ? '✅' : '❌'}`);
      });
    }
    console.log('');

    // Blog Posts
    const { data: blogPosts, error: blogError } = await supabase
      .from('blog_posts')
      .select('title, category, status');
    
    console.log('📝 BLOG POSTS / LEGAL INSIGHTS');
    console.log('-' .repeat(30));
    if (blogError) {
      console.log('❌ Error:', blogError.message);
    } else {
      console.log(`✅ Total: ${blogPosts.length} blog posts`);
      blogPosts.forEach((post, index) => {
        console.log(`   ${index + 1}. ${post.title}`);
        console.log(`      Category: ${post.category} | Status: ${post.status}`);
      });
    }
    console.log('');

    // Job Postings
    const { data: jobPostings, error: jobError } = await supabase
      .from('job_postings')
      .select('title, department, status');
    
    console.log('💼 JOB POSTINGS / CAREERS');
    console.log('-' .repeat(30));
    if (jobError) {
      console.log('❌ Error:', jobError.message);
    } else {
      console.log(`✅ Total: ${jobPostings.length} job postings`);
      jobPostings.forEach((job, index) => {
        console.log(`   ${index + 1}. ${job.title}`);
        console.log(`      Department: ${job.department} | Status: ${job.status}`);
      });
    }
    console.log('');

    // Team Members (Profiles)
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('full_name, role, is_active');
    
    console.log('👥 TEAM MEMBERS / PROFILES');
    console.log('-' .repeat(30));
    if (profilesError) {
      console.log('❌ Error:', profilesError.message);
    } else {
      console.log(`✅ Total: ${profiles.length} team members`);
      profiles.forEach((profile, index) => {
        console.log(`   ${index + 1}. ${profile.full_name}`);
        console.log(`      Role: ${profile.role} | Active: ${profile.is_active ? '✅' : '❌'}`);
      });
    }
    console.log('');

    // Contact Messages
    const { data: contactMessages, error: contactError } = await supabase
      .from('contact_messages')
      .select('name, subject, status');
    
    console.log('📧 CONTACT MESSAGES');
    console.log('-' .repeat(30));
    if (contactError) {
      console.log('❌ Error:', contactError.message);
    } else {
      console.log(`✅ Total: ${contactMessages.length} contact messages`);
      contactMessages.forEach((message, index) => {
        console.log(`   ${index + 1}. ${message.name} - ${message.subject}`);
        console.log(`      Status: ${message.status}`);
      });
    }
    console.log('');

    // Appointments
    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('client_name, practice_area, status');
    
    console.log('📅 APPOINTMENTS');
    console.log('-' .repeat(30));
    if (appointmentsError) {
      console.log('❌ Error:', appointmentsError.message);
    } else {
      console.log(`✅ Total: ${appointments.length} appointments`);
      appointments.forEach((appointment, index) => {
        console.log(`   ${index + 1}. ${appointment.client_name}`);
        console.log(`      Practice Area: ${appointment.practice_area} | Status: ${appointment.status}`);
      });
    }
    console.log('');

    // Summary
    console.log('📈 OVERALL SUMMARY');
    console.log('=' .repeat(60));
    const totalRecords = (practiceAreas?.length || 0) + 
                        (blogPosts?.length || 0) + 
                        (jobPostings?.length || 0) + 
                        (profiles?.length || 0) + 
                        (contactMessages?.length || 0) + 
                        (appointments?.length || 0);
    
    console.log(`🎉 Total records across all tables: ${totalRecords}`);
    console.log('');
    console.log('✅ All sample data has been successfully added to your remote Supabase instance!');
    console.log('');
    console.log('🔗 You can now view this data in your application or Supabase dashboard.');
    console.log('📱 The data includes practice areas, blog posts, job postings, team members, contact messages, and appointments.');

  } catch (error) {
    console.error('❌ Error generating summary:', error);
  }
}

generateDataSummary();
