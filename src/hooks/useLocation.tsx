
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useKrogerIntegration } from './useKrogerIntegration';

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
  const { syncKrogerLocations } = useKrogerIntegration();
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

  // Geocode address to coordinates using Nominatim (OpenStreetMap)
  const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number }> => {
    try {
      console.log('Geocoding address:', address);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&countrycodes=us`
      );
      
      if (!response.ok) {
        throw new Error('Geocoding request failed');
      }
      
      const data = await response.json();
      
      if (data.length === 0) {
        throw new Error('Address not found');
      }
      
      const result = {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      };
      
      console.log('Geocoded result:', result);
      return result;
    } catch (error) {
      console.error('Geocoding error:', error);
      throw new Error('Failed to geocode address');
    }
  };

  // Find stores near a location
  const findStoresNear = async (lat: number, lng: number, radiusMiles: number = 25) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Finding stores near:', { lat, lng, radiusMiles });
      
      // First, sync Kroger locations for this area
      await syncKrogerLocations(lat, lng, radiusMiles);
      
      // Then fetch all stores from database
      const { data: storesData, error: storesError } = await supabase
        .from('stores')
        .select('*');

      if (storesError) throw storesError;

      console.log('Found stores in database:', storesData?.length || 0);

      // Calculate distances and filter
      const storesWithDistance = (storesData || []).map((store: any) => {
        const distance = calculateDistance(
          lat, 
          lng, 
          store.latitude, 
          store.longitude
        );
        return { ...store, distance };
      }).filter(store => store.distance <= radiusMiles)
        .sort((a, b) => a.distance - b.distance);

      console.log('Filtered stores within radius:', storesWithDistance.length);
      setStores(storesWithDistance);
    } catch (err) {
      console.error('Error finding stores:', err);
      setError('Failed to find stores');
      setStores([]);
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
    if (!user) return null;

    try {
      // If this is being set as primary, update existing primary locations
      if (location.is_primary) {
        await supabase
          .from('user_locations')
          .update({ is_primary: false })
          .eq('user_id', user.id);
      }

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
      return null;
    }
  };

  // Delete a location
  const deleteLocation = async (locationId: string) => {
    try {
      const { error } = await supabase
        .from('user_locations')
        .delete()
        .eq('id', locationId);

      if (error) throw error;
      await fetchUserLocations();
      return true;
    } catch (err) {
      console.error('Error deleting location:', err);
      setError('Failed to delete location');
      return false;
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
    deleteLocation,
    refetchLocations: fetchUserLocations
  };
};
