
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface StoreRosterItem {
  id: string;
  store_id: string;
  preference_order: number;
  store: {
    id: string;
    name: string;
    address: string;
    city: string;
    state: string;
    zip_code: string;
    phone?: string;
    supported_apis: string[];
  };
}

export const useStoreRoster = () => {
  const { user } = useAuth();
  const [roster, setRoster] = useState<StoreRosterItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRoster = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_store_roster')
        .select(`
          id,
          store_id,
          preference_order,
          store:stores(
            id,
            name,
            address,
            city,
            state,
            zip_code,
            phone,
            supported_apis
          )
        `)
        .eq('user_id', user.id)
        .order('preference_order');

      if (error) throw error;
      setRoster(data || []);
    } catch (err) {
      console.error('Error fetching store roster:', err);
    } finally {
      setLoading(false);
    }
  };

  const addStoreToRoster = async (storeId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_store_roster')
        .insert({
          user_id: user.id,
          store_id: storeId,
          preference_order: roster.length
        });

      if (error) throw error;
      await fetchRoster();
      return true;
    } catch (err) {
      console.error('Error adding store to roster:', err);
      return false;
    }
  };

  const removeStoreFromRoster = async (rosterId: string) => {
    try {
      const { error } = await supabase
        .from('user_store_roster')
        .delete()
        .eq('id', rosterId);

      if (error) throw error;
      await fetchRoster();
      return true;
    } catch (err) {
      console.error('Error removing store from roster:', err);
      return false;
    }
  };

  const isStoreInRoster = (storeId: string): boolean => {
    return roster.some(item => item.store_id === storeId);
  };

  useEffect(() => {
    if (user) {
      fetchRoster();
    }
  }, [user]);

  return {
    roster,
    loading,
    addStoreToRoster,
    removeStoreFromRoster,
    isStoreInRoster,
    refetchRoster: fetchRoster
  };
};
