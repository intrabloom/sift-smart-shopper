
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface Product {
  id: string;
  upc: string;
  name: string;
  brand?: string;
  size?: string;
  category?: string;
  image_url?: string;
  ingredients?: string;
  nutrition_facts?: any;
  allergens?: string[];
}

interface ProductPrice {
  store: {
    id: string;
    name: string;
    address: string;
    city: string;
    state: string;
  };
  price: number;
  sale_price?: number;
  in_stock: boolean;
  distance?: number;
}

export const useProducts = () => {
  const { user } = useAuth();

  const searchProducts = async (query: string): Promise<Product[]> => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .or(`name.ilike.%${query}%,brand.ilike.%${query}%,category.ilike.%${query}%`)
      .limit(20);

    if (error) throw error;
    return data || [];
  };

  const getProductByBarcode = async (upc: string): Promise<Product | null> => {
    // Record search history
    if (user) {
      await supabase
        .from('user_search_history')
        .insert({
          user_id: user.id,
          product_upc: upc,
          search_type: 'barcode'
        });
    }

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('upc', upc)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows found
      throw error;
    }
    return data;
  };

  const getProductPrices = async (productId: string, userLat?: number, userLng?: number): Promise<ProductPrice[]> => {
    let query = supabase
      .from('product_prices')
      .select(`
        price,
        sale_price,
        in_stock,
        store:stores(
          id,
          name,
          address,
          city,
          state,
          latitude,
          longitude
        )
      `)
      .eq('product_id', productId)
      .eq('in_stock', true);

    const { data, error } = await query;

    if (error) throw error;

    let prices = data?.map(item => ({
      store: item.store,
      price: Number(item.price),
      sale_price: item.sale_price ? Number(item.sale_price) : undefined,
      in_stock: item.in_stock
    })) || [];

    // Calculate distances if user location provided
    if (userLat && userLng) {
      prices = prices.map(price => ({
        ...price,
        distance: calculateDistance(
          userLat,
          userLng,
          Number(price.store.latitude),
          Number(price.store.longitude)
        )
      }));
    }

    // Sort by price (lowest first)
    return prices.sort((a, b) => (a.sale_price || a.price) - (b.sale_price || b.price));
  };

  return {
    searchProducts,
    getProductByBarcode,
    getProductPrices
  };
};

const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 3959; // Radius of the Earth in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};
