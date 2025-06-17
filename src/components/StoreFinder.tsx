
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Phone, Plus, Check, Search } from 'lucide-react';
import { useLocation } from '@/hooks/useLocation';
import { useStoreRoster } from '@/hooks/useStoreRoster';
import { useToast } from '@/hooks/use-toast';

interface StoreFinderProps {
  userLat?: number;
  userLng?: number;
}

const StoreFinder = ({ userLat, userLng }: StoreFinderProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredStores, setFilteredStores] = useState<any[]>([]);
  const { stores, loading, findStoresNear } = useLocation();
  const { addStoreToRoster, isStoreInRoster, loading: rosterLoading } = useStoreRoster();
  const { toast } = useToast();

  useEffect(() => {
    if (userLat && userLng) {
      findStoresNear(userLat, userLng);
    }
  }, [userLat, userLng]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = stores.filter(store =>
        store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        store.address.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredStores(filtered);
    } else {
      setFilteredStores(stores);
    }
  }, [stores, searchQuery]);

  const handleAddToRoster = async (storeId: string, storeName: string) => {
    const success = await addStoreToRoster(storeId);
    if (success) {
      toast({
        title: "Store added",
        description: `${storeName} has been added to your store roster`,
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to add store to your roster",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Finding stores near you...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Search className="h-5 w-5 text-gray-400" />
          <Input
            placeholder="Search stores by name or address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
        </div>
      </div>

      <div className="space-y-3">
        {filteredStores.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-600">
                {stores.length === 0 ? 'No stores found in your area' : 'No stores match your search'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredStores.map((store) => (
            <Card key={store.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{store.name}</h3>
                    <div className="flex items-center text-gray-600 mt-1">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span className="text-sm">
                        {store.address}, {store.city}, {store.state} {store.zip_code}
                      </span>
                    </div>
                    {store.phone && (
                      <div className="flex items-center text-gray-600 mt-1">
                        <Phone className="h-4 w-4 mr-1" />
                        <span className="text-sm">{store.phone}</span>
                      </div>
                    )}
                    {store.distance && (
                      <p className="text-sm text-blue-600 mt-1">
                        {store.distance.toFixed(1)} miles away
                      </p>
                    )}
                    {store.supported_apis && store.supported_apis.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {store.supported_apis.map((api: string) => (
                          <span
                            key={api}
                            className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full"
                          >
                            {api.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="ml-4">
                    {isStoreInRoster(store.id) ? (
                      <Button variant="outline" disabled className="text-green-600">
                        <Check className="h-4 w-4 mr-2" />
                        Added
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleAddToRoster(store.id, store.name)}
                        disabled={rosterLoading}
                        size="sm"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add to Roster
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default StoreFinder;
