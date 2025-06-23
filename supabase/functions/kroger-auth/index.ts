
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clientId = Deno.env.get('KROGER_CLIENT_ID');
    const clientSecret = Deno.env.get('KROGER_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      throw new Error('Kroger API credentials not configured');
    }

    // Get OAuth token from Kroger
    const tokenResponse = await fetch('https://api.kroger.com/v1/connect/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`
      },
      body: 'grant_type=client_credentials&scope=product.compact'
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Kroger auth error:', errorText);
      throw new Error(`Failed to authenticate with Kroger: ${tokenResponse.status}`);
    }

    const tokenData = await tokenResponse.json();
    
    return new Response(
      JSON.stringify({ 
        access_token: tokenData.access_token,
        expires_in: tokenData.expires_in 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in kroger-auth:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
