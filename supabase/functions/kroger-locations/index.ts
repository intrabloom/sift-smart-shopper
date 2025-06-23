

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface KrogerLocation {
  locationId: string;
  name: string;
  address: {
    addressLine1: string;
    city: string;
    state: string;
    zipCode: string;
  };
  geolocation: {
    latitude: number;
    longitude: number;
  };
  phone?: string;
  hours?: any;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { lat, lng, radius = 25 } = await req.json();
    
    console.log(`Searching for Kroger locations near: { lat: ${lat}, lng: ${lng}, radius: ${radius} }`);

    // Get Kroger access token
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Calling kroger-auth function...');
    const authResponse = await supabase.functions.invoke('kroger-auth');
    console.log('Auth response status:', authResponse.status);
    
    if (authResponse.error) {
      throw new Error(`Failed to get Kroger access token: ${authResponse.error.message}`);
    }

    const { access_token } = authResponse.data;
    console.log('Got Kroger access token successfully');

    // Call Kroger locations API
    console.log('Calling Kroger locations API...');
    const krogerUrl = `https://api-ce.kroger.com/v1/locations?filter.lat.near=${lat}&filter.lon.near=${lng}&filter.radiusInMiles=${radius}&filter.limit=50`;
    console.log('Using certification endpoint:', krogerUrl);

    const locationsResponse = await fetch(krogerUrl, {
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Locations response status:', locationsResponse.status);
    
    if (!locationsResponse.ok) {
      throw new Error(`Kroger locations API failed: ${locationsResponse.status}`);
    }

    const locationsData = await locationsResponse.json();
    const locations: KrogerLocation[] = locationsData.data || [];
    
    console.log(`Found Kroger locations: ${locations.length}`);

    // Transform and insert locations into database
    const stores = locations.map(location => {
      // Clean up store name - only remove "Kroger " if it appears to be duplicated
      let cleanName = location.name;
      
      // Check if the name starts with "Kroger Kroger" or "Kroger Ralphs" etc (indicating duplication)
      if (cleanName.startsWith('Kroger ') && !cleanName.startsWith('Kroger -')) {
        const afterKroger = cleanName.substring(7); // Get everything after "Kroger "
        // Only remove the prefix if what follows doesn't start with a dash (indicating it's not "Kroger - Location")
        if (!afterKroger.startsWith('-') && afterKroger.trim() !== '') {
          cleanName = afterKroger;
        }
      }

      return {
        id: `kroger-${location.locationId}`,
        name: cleanName,
        address: location.address.addressLine1,
        city: location.address.city,
        state: location.address.state,
        zip_code: location.address.zipCode,
        latitude: location.geolocation.latitude,
        longitude: location.geolocation.longitude,
        phone: location.phone || null,
        hours: location.hours || {},
        supported_apis: ['kroger_api']
      };
    });

    // Upsert stores into database
    if (stores.length > 0) {
      const { error: insertError } = await supabase
        .from('stores')
        .upsert(stores, { 
          onConflict: 'id',
          ignoreDuplicates: false 
        });

      if (insertError) {
        console.error('Error inserting stores:', insertError);
        throw insertError;
      }
    }

    console.log(`Successfully processed ${stores.length} Kroger locations`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        count: stores.length,
        stores: stores
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error in kroger-locations function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
