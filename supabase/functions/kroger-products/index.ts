
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
    const { query, locationId } = await req.json();
    
    if (!query) {
      throw new Error('Search query is required');
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

    // Build search URL
    let searchUrl = `https://api.kroger.com/v1/products?filter.term=${encodeURIComponent(query)}&filter.limit=20`;
    
    if (locationId) {
      searchUrl += `&filter.locationId=${locationId}`;
    }

    // Search Kroger products
    const productsResponse = await fetch(searchUrl, {
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Accept': 'application/json'
      }
    });

    if (!productsResponse.ok) {
      throw new Error(`Kroger products API error: ${productsResponse.status}`);
    }

    const productsData = await productsResponse.json();
    
    // Transform Kroger products to our format
    const transformedProducts = productsData.data?.map((product: any) => ({
      id: `kroger-${product.productId}`,
      upc: product.upc || product.productId,
      name: product.description || product.brand?.name || 'Unknown Product',
      brand: product.brand?.name || null,
      size: product.items?.[0]?.size || null,
      category: product.categories?.[0] || null,
      image_url: product.images?.[0]?.sizes?.find((img: any) => 
        img.size === 'large' || img.size === 'medium'
      )?.url || product.images?.[0]?.sizes?.[0]?.url,
      price: product.items?.[0]?.price?.regular || null,
      sale_price: product.items?.[0]?.price?.promo || null,
      kroger_data: {
        productId: product.productId,
        locationId: locationId,
        temperature: product.temperature,
        categories: product.categories,
        tags: product.tags
      }
    })) || [];

    return new Response(
      JSON.stringify({ 
        products: transformedProducts,
        count: transformedProducts.length,
        source: 'kroger'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in kroger-products:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
