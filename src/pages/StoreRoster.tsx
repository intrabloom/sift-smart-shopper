
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, MapPin, Phone, Trash2, Plus } from 'lucide-react';
import { useStoreRoster } from '@/hooks/useStoreRoster';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

const StoreRoster = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { roster, loading, removeStoreFromRoster } = useStoreRoster();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  const handleRemoveStore = async (rosterId: string, storeName: string) => {
    const success = await removeStoreFromRoster(rosterId);
    if (success) {
      toast({
        title: "Store removed",
        description: `${storeName} has been removed from your roster`,
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to remove store from roster",
        variant: "destructive",
      });
    }
  };

  if (authLoading || loading) {
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
          <div>
            <h1 className="text-xl font-semibold">My Store Roster</h1>
            <p className="text-sm text-gray-500">Manage your preferred stores</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {roster.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-gray-400 mb-4">
                <MapPin className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No stores in your roster</h3>
              <p className="text-gray-600 mb-4">
                Add stores to your roster to make shopping easier
              </p>
              <Button onClick={() => navigate('/stores')}>
                <Plus className="h-4 w-4 mr-2" />
                Find Stores
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {roster.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{item.store.name}</h3>
                      <div className="flex items-center text-gray-600 mt-1">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span className="text-sm">
                          {item.store.address}, {item.store.city}, {item.store.state} {item.store.zip_code}
                        </span>
                      </div>
                      {item.store.phone && (
                        <div className="flex items-center text-gray-600 mt-1">
                          <Phone className="h-4 w-4 mr-1" />
                          <span className="text-sm">{item.store.phone}</span>
                        </div>
                      )}
                      {item.store.supported_apis && item.store.supported_apis.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {item.store.supported_apis.map((api: string) => (
                            <span
                              key={api}
                              className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                            >
                              {api.replace('_', ' ')}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveStore(item.id, item.store.name)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StoreRoster;
