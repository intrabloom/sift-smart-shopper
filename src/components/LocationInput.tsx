
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from '@/hooks/useLocation';

interface LocationInputProps {
  onLocationSelected: (lat: number, lng: number, address?: string) => void;
}

const LocationInput = ({ onLocationSelected }: LocationInputProps) => {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { getCurrentLocation, geocodeAddress } = useLocation();

  const handleUseCurrentLocation = async () => {
    setLoading(true);
    try {
      const location = await getCurrentLocation();
      onLocationSelected(location.lat, location.lng, 'Current Location');
      toast({
        title: "Location found",
        description: "Using your current location",
      });
    } catch (error) {
      toast({
        title: "Location error",
        description: "Could not access your current location. Please enter an address manually.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) return;

    setLoading(true);
    try {
      const location = await geocodeAddress(address);
      onLocationSelected(location.lat, location.lng, address);
      toast({
        title: "Address found",
        description: `Finding stores near ${address}`,
      });
    } catch (error) {
      toast({
        title: "Geocoding error",
        description: "Could not find location for this address",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm space-y-4">
      <h2 className="text-lg font-semibold mb-4">Find Stores Near You</h2>
      
      <form onSubmit={handleAddressSubmit} className="space-y-4">
        <div>
          <Label htmlFor="address">City or Zip Code</Label>
          <Input
            id="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Enter city or zip code"
            className="mt-1"
          />
        </div>
        
        <div className="flex gap-2">
          <Button 
            type="submit" 
            disabled={loading || !address.trim()}
            className="flex-1"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Searching...
              </>
            ) : (
              'Find Stores'
            )}
          </Button>
          
          <Button
            type="button"
            variant="outline"
            onClick={handleUseCurrentLocation}
            disabled={loading}
            className="flex-1"
          >
            <MapPin className="h-4 w-4 mr-2" />
            Use Current Location
          </Button>
        </div>
      </form>
    </div>
  );
};

export default LocationInput;
