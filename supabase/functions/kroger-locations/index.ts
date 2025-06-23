
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

    // Get Kroger access token
    const authResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/kroger-auth`, {
      headers: {
        'Authorization': req.headers.get('Authorization') || '',
        'apikey': Deno.env.get('SUPABASE_ANON_KEY') || ''
      }
    });

    if (!authResponse.ok) {
      throw new Error('Failed to authenticate with Kroger');
    }

    const { access_token } = await authResponse.json();

    // Search for Kroger locations
    const locationsResponse = await fetch(
      `https://api.kroger.com/v1/locations?filter.lat.near=${lat}&filter.lon.near=${lng}&filter.radiusInMiles=${radius}&filter.limit=50`,
      {
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Accept': 'application/json'
        }
      }
    );

    if (!locationsResponse.ok) {
      throw new Error(`Kroger locations API error: ${locationsResponse.status}`);
    }

    const locationsData = await locationsResponse.json();
    
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Process and store Kroger locations
    const processedStores = [];
    
    for (const location of locationsData.data) {
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
        // Check if store already exists
        const { data: existingStore } = await supabase
          .from('stores')
          .select('id')
          .eq('id', storeData.id)
          .single();

        if (!existingStore) {
          // Insert new store
          const { error: insertError } = await supabase
            .from('stores')
            .insert(storeData);

          if (insertError && !insertError.message.includes('duplicate key')) {
            console.error('Error inserting store:', insertError);
          }
        } else {
          // Update existing store
          const { error: updateError } = await supabase
            .from('stores')
            .update(storeData)
            .eq('id', storeData.id);

          if (updateError) {
            console.error('Error updating store:', updateError);
          }
        }

        processedStores.push(storeData);
      }
    }

    console.log(`Processed ${processedStores.length} Kroger locations`);

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
