
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

    console.log('Checking Kroger credentials...');
    console.log('Client ID exists:', !!clientId);
    console.log('Client Secret exists:', !!clientSecret);

    if (!clientId || !clientSecret) {
      console.error('Missing Kroger API credentials');
      throw new Error('Kroger API credentials not configured');
    }

    // Log the credentials being used (safely)
    console.log('Using Client ID:', clientId?.substring(0, 8) + '...');

    // Use certification environment endpoint for Kroger API
    const tokenUrl = 'https://api-ce.kroger.com/v1/connect/oauth2/token';
    console.log('Using Kroger certification environment:', tokenUrl);

    // Get OAuth token from Kroger
    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`
      },
      body: 'grant_type=client_credentials&scope=product.compact'
    });

    console.log('Token response status:', tokenResponse.status);
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Kroger auth error response:', errorText);
      
      // Try to parse the error response for more details
      try {
        const errorData = JSON.parse(errorText);
        console.error('Parsed error:', errorData);
        throw new Error(`Kroger authentication failed: ${errorData.error_description || errorData.error || 'Unknown error'}`);
      } catch (parseError) {
        throw new Error(`Kroger authentication failed with status ${tokenResponse.status}: ${errorText}`);
      }
    }

    const tokenData = await tokenResponse.json();
    console.log('Successfully obtained Kroger access token');
    
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
