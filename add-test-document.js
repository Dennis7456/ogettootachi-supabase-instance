import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://riuqslalytzybvgsebki.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpdXFzbGFseXR6eWJ2Z3NlYmtpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3MzA0MDAsImV4cCI6MjA2NjMwNjQwMH0.SLbk4MgmS-DMpgCrHZOme9zolF_17SqvCFoKdgJtZWI'

const supabase = createClient(supabaseUrl, supabaseKey)

// Simple embedding generator (same as in the chat function)
function generateMockEmbedding(text) {
  const words = text.toLowerCase().split(/\s+/)
  const embedding = new Array(1536).fill(0)
  
  words.forEach((word, index) => {
    const hash = word.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0)
      return a & a
    }, 0)
    const position = Math.abs(hash) % 1536
    embedding[position] = 1
  })
  
  return embedding
}

async function addTestDocument() {
  const testDocument = {
    title: "Patent Application Requirements in Kenya",
    content: "To file a patent application in Kenya, you must include: 1) A detailed description of the invention, 2) Claims defining the scope of protection, 3) Drawings if necessary, 4) Abstract summarizing the invention, 5) Filing fee payment. The application must be filed with the Kenya Industrial Property Institute (KIPI) and meet all statutory requirements under the Industrial Property Act.",
    category: "Intellectual Property",
    embedding: generateMockEmbedding("patent application requirements kenya filing")
  }

  try {
    const { data, error } = await supabase
      .from('documents')
      .insert([testDocument])
      .select()

    if (error) {
      console.error('Error adding document:', error)
    } else {
      console.log('Document added successfully:', data)
    }
  } catch (error) {
    console.error('Failed to add document:', error)
  }
}

addTestDocument() 