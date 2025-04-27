import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.1'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the form data from the request
    const formData = await req.formData()
    const file = formData.get('file') as File
    const uploadId = formData.get('uploadId')

    if (!file || !uploadId) {
      throw new Error('File and uploadId are required')
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        }
      }
    )

    // Read file content
    const arrayBuffer = await file.arrayBuffer()
    const fileContent = new Uint8Array(arrayBuffer)

    // Upload file to storage
    const { data: uploadData, error: uploadError } = await supabaseClient
      .storage
      .from('files')
      .upload(`bulk-uploads/${uploadId}/${file.name}`, fileContent, {
        contentType: file.type,
        upsert: true
      })

    if (uploadError) {
      throw uploadError
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseClient
      .storage
      .from('files')
      .getPublicUrl(`bulk-uploads/${uploadId}/${file.name}`)

    console.log('File uploaded successfully:', publicUrl)

    return new Response(
      JSON.stringify({ success: true, url: publicUrl }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error processing upload:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})