// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

serve(async (req) => {
  try {
    // Get unprocessed documents from the queue
    const { data: queueItems, error: queueError } = await supabase
      .from('document_processing_queue')
      .select('*')
      .eq('processed', false)
      .order('created_at', { ascending: true })
      .limit(10) // Process 10 at a time
    
    if (queueError) {
      throw new Error(`Queue error: ${queueError.message}`)
    }
    
    if (!queueItems || queueItems.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: "No documents to process" 
      }))
    }
    
    console.log(`Processing ${queueItems.length} documents`)
    
    // Process each document
    for (const item of queueItems) {
      try {
        // Call the process-document function
        const response = await fetch(
          `${Deno.env.get('SUPABASE_URL')}/functions/v1/process-document`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
            },
            body: JSON.stringify({
              record: {
                id: item.document_id,
                content: item.content
              }
            })
          }
        )
        
        if (response.ok) {
          // Mark as processed
          await supabase
            .from('document_processing_queue')
            .update({ 
              processed: true, 
              processed_at: new Date().toISOString() 
            })
            .eq('document_id', item.document_id)
          
          console.log(`Processed document: ${item.document_id}`)
        } else {
          console.error(`Failed to process document ${item.document_id}: ${response.statusText}`)
        }
      } catch (error) {
        console.error(`Error processing document ${item.document_id}:`, error)
      }
    }
    
    return new Response(JSON.stringify({ 
      success: true, 
      processed: queueItems.length 
    }))
    
  } catch (error) {
    console.error('Process queue error:', error)
    return new Response(JSON.stringify({ 
      error: error.message 
    }), { status: 500 })
  }
}) 