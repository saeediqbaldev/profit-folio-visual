import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { type, value } = await req.json()

    // Validate input
    if (!type || !value) {
      return new Response(
        JSON.stringify({ error: 'Missing type or value' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate type is one of the allowed fields
    if (!['username', 'email', 'phone'].includes(type)) {
      return new Response(
        JSON.stringify({ error: 'Invalid type. Must be username, email, or phone' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate value format based on type
    const trimmedValue = value.trim()
    
    if (type === 'username') {
      if (trimmedValue.length < 3) {
        return new Response(
          JSON.stringify({ available: true }), // Too short to check
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      if (!/^[a-zA-Z0-9_]+$/.test(trimmedValue)) {
        return new Response(
          JSON.stringify({ error: 'Invalid username format' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    if (type === 'email') {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedValue)) {
        return new Response(
          JSON.stringify({ available: true }), // Invalid email, skip check
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    if (type === 'phone') {
      if (trimmedValue.length < 6) {
        return new Response(
          JSON.stringify({ available: true }), // Too short to check
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Create Supabase client with service role (bypasses RLS)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    let query;
    
    if (type === 'username' || type === 'email') {
      // Case-insensitive check for username and email
      query = supabase
        .from('profiles')
        .select('id')
        .ilike(type, trimmedValue)
        .maybeSingle()
    } else {
      // Exact match for phone
      query = supabase
        .from('profiles')
        .select('id')
        .eq(type, trimmedValue)
        .maybeSingle()
    }

    const { data, error } = await query

    if (error) {
      console.error('Database query error:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to check availability' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Return only boolean - never expose actual data
    return new Response(
      JSON.stringify({ available: !data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in check-availability function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
