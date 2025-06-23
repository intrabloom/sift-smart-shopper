
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface KrogerProduct {
  id: string;
  upc: string;
  name: string;
  brand?: string;
  size?: string;
  category?: string;
  image_url?: string;
  price?: number;
  sale_price?: number;
  kroger_data?: any;
}

interface KrogerStore {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  latitude: number;
  longitude: number;
  phone?: string;
  hours?: any;
  supported_apis: string[];
}

export const useKrogerIntegration = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const searchKrogerProducts = async (query: string, locationId?: string): Promise<KrogerProduct[]> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('kroger-products', {
        body: { query, locationId }
      });

      if (error) throw error;
      return data.products || [];
    } catch (error) {
      console.error('Error searching Kroger products:', error);
      toast({
        title: "Search failed",
        description: "Failed to search Kroger products. Please try again.",
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  const syncKrogerLocations = async (lat: number, lng: number, radius = 25): Promise<KrogerStore[]> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('kroger-locations', {
        body: { lat, lng, radius }
      });

      if (error) throw error;
      
      toast({
        title: "Success",
        description: `Found and synced ${data.count} Kroger locations`,
      });
      
      return data.stores || [];
    } catch (error) {
      console.error('Error syncing Kroger locations:', error);
      toast({
        title: "Sync failed",
        description: "Failed to sync Kroger locations. Please try again.",
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    searchKrogerProducts,
    syncKrogerLocations
  };
};
