
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0'

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
    const { query, locationId } = await req.json();
    
    console.log(`Searching Kroger products for query: ${query}${locationId ? `, locationId: ${locationId}` : ''}`);
    
    if (!query) {
      throw new Error('Search query is required');
    }

    // Get Kroger access token using Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Calling kroger-auth function...');
    const authResponse = await supabase.functions.invoke('kroger-auth');
    console.log('Auth response status:', authResponse.status);

    if (authResponse.error) {
      console.error('Auth error:', authResponse.error);
      throw new Error(`Failed to get Kroger access token: ${authResponse.error.message}`);
    }

    const { access_token } = authResponse.data;
    console.log('Got Kroger access token successfully');

    // Build search URL using certification environment with enhanced parameters
    let searchUrl = `https://api-ce.kroger.com/v1/products?filter.term=${encodeURIComponent(query)}&filter.limit=20`;
    
    // Add location filter if provided for pricing data
    if (locationId) {
      searchUrl += `&filter.locationId=${locationId}`;
    }

    // Add fulfillment filters to get more complete data
    searchUrl += '&filter.fulfillment=ais,crs,dug,sth';

    console.log('Using Kroger certification endpoint:', searchUrl);

    // Search Kroger products
    const productsResponse = await fetch(searchUrl, {
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Accept': 'application/json'
      }
    });

    console.log('Products response status:', productsResponse.status);
    console.log('Products response headers:', Object.fromEntries(productsResponse.headers.entries()));

    if (!productsResponse.ok) {
      const errorText = await productsResponse.text();
      console.error('Kroger products API error response:', errorText);
      throw new Error(`Kroger products API error: ${productsResponse.status} - ${errorText}`);
    }

    const productsData = await productsResponse.json();
    console.log('Raw Kroger API response:', JSON.stringify(productsData, null, 2));
    console.log(`Found ${productsData.data?.length || 0} Kroger products`);
    
    // Log some sample data if available
    if (productsData.data && productsData.data.length > 0) {
      console.log('Sample product:', JSON.stringify(productsData.data[0], null, 2));
    }
    
    // Transform Kroger products to our format with enhanced data extraction
    const transformedProducts = productsData.data?.map((product: any) => {
      // Extract the first item's pricing data if available
      const firstItem = product.items?.[0];
      const pricing = firstItem?.price;
      const nationalPricing = firstItem?.nationalPrice;
      
      // Get the best available image
      const featuredImage = product.images?.find((img: any) => img.featured);
      const anyImage = product.images?.[0];
      const imageToUse = featuredImage || anyImage;
      
      let imageUrl = null;
      if (imageToUse?.sizes && Array.isArray(imageToUse.sizes)) {
        // Prefer large or medium size images
        const preferredImage = imageToUse.sizes.find((size: any) => 
          size.size === 'large' || size.size === 'medium'
        );
        imageUrl = preferredImage?.url || imageToUse.sizes[0]?.url;
      }

      return {
        id: `kroger-${product.productId}`,
        upc: product.upc || product.productId,
        name: product.description || product.brand?.name || 'Unknown Product',
        brand: product.brand?.name || null,
        size: firstItem?.size || null,
        category: product.categories?.[0] || null,
        image_url: imageUrl,
        // Extract pricing data when available
        price: pricing?.regular || nationalPricing?.regular || null,
        sale_price: pricing?.promo || nationalPricing?.promo || null,
        // Store additional Kroger-specific data
        kroger_data: {
          productId: product.productId,
          locationId: locationId,
          temperature: product.temperature,
          categories: product.categories,
          tags: product.tags,
          fulfillment: firstItem?.fulfillment,
          inventory: firstItem?.inventory,
          aisleLocations: product.aisleLocations,
          countryOrigin: product.countryOrigin,
          itemInformation: product.itemInformation
        }
      };
    }) || [];

    console.log('Transformed products:', JSON.stringify(transformedProducts, null, 2));

    return new Response(
      JSON.stringify({ 
        products: transformedProducts,
        count: transformedProducts.length,
        source: 'kroger',
        locationId: locationId,
        hasLocationData: !!locationId,
        debug: {
          query: query,
          locationId: locationId,
          searchUrl: searchUrl,
          rawResponseCount: productsData.data?.length || 0,
          sampleProduct: productsData.data?.[0] ? {
            hasPrice: !!productsData.data[0].items?.[0]?.price,
            hasNationalPrice: !!productsData.data[0].items?.[0]?.nationalPrice,
            fulfillment: productsData.data[0].items?.[0]?.fulfillment
          } : null
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in kroger-products:', error);
    console.error('Error stack:', error.stack);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        stack: error.stack
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
