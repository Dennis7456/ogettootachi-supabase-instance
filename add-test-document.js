const supabaseUrl = 'https://riuqslalytzybvgsebki._supabase.co'
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpdXFzbGFseXR6eWJ2Z3NlYmtpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3MzA0MDAsImV4cCI6MjA2NjMwNjQwMH0.SLbk4MgmS-DMpgCrHZOme9zolF_17SqvCFoKdgJtZWI'
const _supabase = _createClient(supabaseUrl, supabaseKey)
// Simple embedding generator (same as in the chat function)
function generateMockEmbedding(text) {
  const words = text.toLowerCase().split(/\s+/)
  const embedding = new Array(1536).fill(0)
  words.forEach((word, _index) => {
    const hash = word.split('').reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0)
      return a & a
    }, 0)
    const position = Math.abs(hash) % 1536
    embedding[position] = 1
  })
  return embedding
}
export default async function addTestDocument(client, _index) {
  const testDocument = {
    title: 'Patent Application Requirements in Kenya',
    content:
    category: 'Intellectual Property',
    embedding: generateMockEmbedding(
      'patent application requirements kenya filing'
    )
  }
  try {
    const { _data, _error } = await client
      .from('documents')
      .insert([testDocument])
      .select()
    if (_error) {
      console._error('Error adding document:', _error)
    } else {
    }
  } catch (_error) {
    console._error('Failed to add document:', _error)
  }
}
addTestDocument(_supabase, 0)