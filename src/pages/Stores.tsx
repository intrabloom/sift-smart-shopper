
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import LocationInput from '@/components/LocationInput';
import StoreFinder from '@/components/StoreFinder';

const Stores = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; address?: string } | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  const handleLocationSelected = (lat: number, lng: number, address?: string) => {
    setUserLocation({ lat, lng, address });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm p-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/home')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-semibold">Find Stores</h1>
            <p className="text-sm text-gray-500">Discover grocery stores near you</p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => navigate('/store-roster')}
          >
            My Roster
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        <LocationInput onLocationSelected={handleLocationSelected} />
        
        {userLocation && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <p className="text-sm text-gray-600">
                Showing stores near: <span className="font-medium">{userLocation.address || 'Your current location'}</span>
              </p>
            </div>
            <StoreFinder userLat={userLocation.lat} userLng={userLocation.lng} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Stores;
