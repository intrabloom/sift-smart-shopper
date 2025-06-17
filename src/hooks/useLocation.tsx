
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface UserLocation {
  id: string;
  name: string;
  address: string;
  city?: string;
  state?: string;
  zip_code?: string;
  latitude: number;
  longitude: number;
  is_primary: boolean;
}

interface Store {
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
  distance?: number;
}

export const useLocation = () => {
  const { user } = useAuth();
  const [userLocations, setUserLocations] = useState<UserLocation[]>([]);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch user's saved locations
  const fetchUserLocations = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_locations')
        .select('*')
        .eq('user_id', user.id)
        .order('is_primary', { ascending: false });

      if (error) throw error;
      setUserLocations(data || []);
    } catch (err) {
      console.error('Error fetching user locations:', err);
      setError('Failed to fetch locations');
    }
  };

  // Get current location using browser geolocation
  const getCurrentLocation = (): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setCurrentLocation(location);
          resolve(location);
        },
        (error) => {
          console.error('Geolocation error:', error);
          reject(new Error('Failed to get current location'));
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
      );
    });
  };

  // Geocode address to coordinates
  const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number }> => {
    // This is a mock implementation - in production you'd use a real geocoding service
    // For now, return Springfield, IL coordinates as default
    return { lat: 39.7817, lng: -89.6501 };
  };

  // Find stores near a location
  const findStoresNear = async (lat: number, lng: number, radiusMiles: number = 25) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('calculate_distance', {
        lat1: lat,
        lon1: lng,
        lat2: lat,
        lon2: lng
      });

      // Since we can't easily do distance calculations in the query without PostGIS,
      // we'll fetch all stores and calculate distance on the frontend
      const { data: storesData, error: storesError } = await supabase
        .from('stores')
        .select('*');

      if (storesError) throw storesError;

      // Calculate distances and filter
      const storesWithDistance = (storesData || []).map((store: any) => {
        const distance = calculateDistance(lat, lng, parseFloat(store.latitude), parseFloat(store.longitude));
        return { ...store, distance };
      }).filter(store => store.distance <= radiusMiles)
        .sort((a, b) => a.distance - b.distance);

      setStores(storesWithDistance);
    } catch (err) {
      console.error('Error finding stores:', err);
      setError('Failed to find stores');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to calculate distance between two points
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 3959; // Earth's radius in miles
    const dLat = toRadians(lat2 - lat1);
    const dLng = toRadians(lng2 - lng1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const toRadians = (degrees: number): number => degrees * (Math.PI / 180);

  // Save a new location
  const saveLocation = async (location: Omit<UserLocation, 'id'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_locations')
        .insert({ ...location, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      await fetchUserLocations();
      return data;
    } catch (err) {
      console.error('Error saving location:', err);
      setError('Failed to save location');
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserLocations();
    }
  }, [user]);

  return {
    userLocations,
    currentLocation,
    stores,
    loading,
    error,
    getCurrentLocation,
    geocodeAddress,
    findStoresNear,
    saveLocation,
    refetchLocations: fetchUserLocations
  };
};
