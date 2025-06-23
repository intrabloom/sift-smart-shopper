
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    const { lat, lng, radius = 25 } = await req.json();
    
    if (!lat || !lng) {
      throw new Error('Latitude and longitude are required');
    }

    console.log('Searching for Kroger locations near:', { lat, lng, radius });

    // Get Kroger access token with better error handling
    console.log('Calling kroger-auth function...');
    const authResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/kroger-auth`, {
      method: 'POST',
      headers: {
        'Authorization': req.headers.get('Authorization') || '',
        'apikey': Deno.env.get('SUPABASE_ANON_KEY') || '',
        'Content-Type': 'application/json'
      }
    });

    console.log('Auth response status:', authResponse.status);

    if (!authResponse.ok) {
      const errorText = await authResponse.text();
      console.error('Auth function error:', errorText);
      
      try {
        const errorData = JSON.parse(errorText);
        throw new Error(`Kroger authentication failed: ${errorData.error}`);
      } catch (parseError) {
        throw new Error(`Kroger authentication failed with status ${authResponse.status}`);
      }
    }

    const authData = await authResponse.json();
    const { access_token } = authData;
    
    if (!access_token) {
      throw new Error('No access token received from Kroger auth');
    }
    
    console.log('Got Kroger access token successfully');

    // Search for Kroger locations using certification environment
    console.log('Calling Kroger locations API...');
    const locationsUrl = `https://api-ce.kroger.com/v1/locations?filter.lat.near=${lat}&filter.lon.near=${lng}&filter.radiusInMiles=${radius}&filter.limit=50`;
    console.log('Using certification endpoint:', locationsUrl);
    
    const locationsResponse = await fetch(locationsUrl, {
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Accept': 'application/json'
      }
    });

    console.log('Locations response status:', locationsResponse.status);

    if (!locationsResponse.ok) {
      const errorText = await locationsResponse.text();
      console.error('Locations API error:', errorText);
      throw new Error(`Kroger locations API error: ${locationsResponse.status} - ${errorText}`);
    }

    const locationsData = await locationsResponse.json();
    console.log('Found Kroger locations:', locationsData.data?.length || 0);
    
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Process and store Kroger locations
    const processedStores = [];
    
    for (const location of locationsData.data || []) {
      try {
        const storeData = {
          id: `kroger-${location.locationId}`,
          name: `Kroger ${location.name || location.address?.addressLine1 || ''}`.trim(),
          address: location.address?.addressLine1 || '',
          city: location.address?.city || '',
          state: location.address?.state || '',
          zip_code: location.address?.zipCode || '',
          latitude: parseFloat(location.geolocation?.latitude || '0'),
          longitude: parseFloat(location.geolocation?.longitude || '0'),
          phone: location.phone || null,
          hours: location.hours || {},
          supported_apis: ['kroger_api']
        };

        // Only process if we have valid coordinates
        if (storeData.latitude !== 0 && storeData.longitude !== 0) {
          // Use upsert to insert or update
          const { error: upsertError } = await supabase
            .from('stores')
            .upsert(storeData, { 
              onConflict: 'id',
              ignoreDuplicates: false 
            });

          if (upsertError) {
            console.error('Error upserting store:', upsertError);
          } else {
            processedStores.push(storeData);
          }
        }
      } catch (storeError) {
        console.error('Error processing individual store:', storeError);
      }
    }

    console.log(`Successfully processed ${processedStores.length} Kroger locations`);

    return new Response(
      JSON.stringify({ 
        stores: processedStores,
        count: processedStores.length 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in kroger-locations:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
