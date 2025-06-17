
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin, Clock, Star, Navigation } from "lucide-react";
import { useShoppingList } from "@/hooks/useShoppingList";
import { useStoreRoster } from "@/hooks/useStoreRoster";
import { useAuth } from "@/hooks/useAuth";

const Route = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { roster } = useStoreRoster();
  const { getOptimizedRoute, getTotalCost } = useShoppingList();
  const [route, setRoute] = useState(getOptimizedRoute());

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    setRoute(getOptimizedRoute());
  }, []);

  const getTotalTime = () => {
    return route.reduce((total, stop) => {
      const timeInMinutes = parseInt(stop.estimatedTime);
      return total + timeInMinutes;
    }, 0);
  };

  const getTotalDistance = () => {
    return route.reduce((total, stop) => {
      return total + parseFloat(stop.distance);
    }, 0);
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
      <div className="bg-white shadow-sm p-4 flex items-center justify-between">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/shopping-list')}
            className="mr-3"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold">Optimized Route</h1>
            <p className="text-sm text-gray-500">Smart routing based on your preferences</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500 flex items-center justify-end">
            <Clock className="h-3 w-3 mr-1" />
            {getTotalTime()} min
          </div>
          <div className="font-semibold">${getTotalCost().toFixed(2)}</div>
        </div>
      </div>

      <div className="p-4">
        {route.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Navigation className="h-12 w-12 mx-auto mb-2" />
              No route to optimize
            </div>
            <Button onClick={() => navigate("/shopping-list")}>
              Back to Shopping List
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Route Optimization Info */}
            {roster.length > 0 && (
              <div className="bg-green-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="h-4 w-4 text-green-600" />
                  <h3 className="font-semibold text-green-900">Smart Route Optimization</h3>
                </div>
                <p className="text-sm text-green-800">
                  Route optimized using your store roster preferences. Preferred stores are prioritized to save you time and money.
                </p>
              </div>
            )}

            {/* Route Steps */}
            {route.map((stop, index) => {
              const isPreferredStore = stop.rosterOrder < 3;
              const isInRoster = stop.rosterOrder < 999;
              
              return (
                <div key={stop.store} className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-start space-x-4">
                    <div className={`rounded-full w-8 h-8 flex items-center justify-center text-sm font-semibold ${
                      isPreferredStore 
                        ? 'bg-green-600 text-white' 
                        : 'bg-blue-600 text-white'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg">{stop.store}</h3>
                          {isPreferredStore && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center gap-1">
                              <Star className="h-3 w-3" />
                              Preferred
                            </span>
                          )}
                          {isInRoster && !isPreferredStore && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                              #{stop.rosterOrder + 1} in Roster
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">${stop.subtotal.toFixed(2)}</div>
                          <div className="text-sm text-gray-500 flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {stop.distance}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-2 flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Est. shopping time: {stop.estimatedTime}
                        </span>
                      </div>
                      
                      <div className="space-y-1">
                        {stop.items.map((item, itemIndex) => (
                          <div key={itemIndex} className="flex justify-between text-sm py-1">
                            <span className={item.checked ? 'line-through text-gray-500' : ''}>
                              {item.productName}
                            </span>
                            <span className={item.checked ? 'line-through text-gray-500' : ''}>
                              ${item.price.toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Route Summary */}
            <div className="bg-blue-50 rounded-xl p-4 mt-6">
              <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <Navigation className="h-4 w-4" />
                Route Summary
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm text-blue-800">
                <div className="flex justify-between">
                  <span>Total stores:</span>
                  <span className="font-medium">{route.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total distance:</span>
                  <span className="font-medium">{getTotalDistance().toFixed(1)} mi</span>
                </div>
                <div className="flex justify-between">
                  <span>Est. time:</span>
                  <span className="font-medium">{getTotalTime()} min</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Total cost:</span>
                  <span>${getTotalCost().toFixed(2)}</span>
                </div>
              </div>
              
              {roster.length === 0 && (
                <div className="mt-4 p-3 bg-yellow-100 rounded-lg">
                  <p className="text-xs text-yellow-800">
                    <strong>Tip:</strong> Build your store roster to get even better route optimization based on your preferences!
                  </p>
                </div>
              )}
            </div>

            {/* Action Button */}
            <Button
              onClick={() => navigate('/shopping-list')}
              variant="outline"
              className="w-full"
            >
              Back to Shopping List
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Route;
