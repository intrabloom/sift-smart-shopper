
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin, Clock } from "lucide-react";

interface RouteStop {
  store: string;
  items: Array<{ name: string; price: number }>;
  subtotal: number;
  estimatedTime: string;
  distance: string;
}

const Route = () => {
  const [route, setRoute] = useState<RouteStop[]>([]);
  const [totalTime, setTotalTime] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const shoppingList = JSON.parse(localStorage.getItem("shopping_list") || "[]");
    
    // Group items by store and create optimized route
    const storeGroups: { [store: string]: any[] } = {};
    shoppingList.forEach((item: any) => {
      if (!storeGroups[item.store]) {
        storeGroups[item.store] = [];
      }
      storeGroups[item.store].push({
        name: item.productName,
        price: item.price
      });
    });

    // Mock optimized route with estimated times and distances
    const mockRoute: RouteStop[] = Object.entries(storeGroups).map(([store, items], index) => ({
      store,
      items,
      subtotal: items.reduce((sum, item) => sum + item.price, 0),
      estimatedTime: `${10 + index * 5} min`,
      distance: `${0.5 + index * 0.3} mi`
    }));

    // Sort by distance (mock optimization)
    mockRoute.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));

    setRoute(mockRoute);
    setTotalTime(`${mockRoute.length * 15} min`);
  }, []);

  const getTotalCost = () => {
    return route.reduce((total, stop) => total + stop.subtotal, 0);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm p-4 flex items-center justify-between">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="mr-3"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Optimized Route</h1>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500 flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            {totalTime}
          </div>
          <div className="font-semibold">${getTotalCost().toFixed(2)}</div>
        </div>
      </div>

      <div className="p-4">
        {route.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              No route to optimize
            </div>
            <Button onClick={() => navigate("/shopping-list")}>
              Back to Shopping List
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {route.map((stop, index) => (
              <div key={stop.store} className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-start space-x-4">
                  <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-semibold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-lg">{stop.store}</h3>
                      <div className="text-right">
                        <div className="font-semibold">${stop.subtotal.toFixed(2)}</div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {stop.distance}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-600 mb-2">
                      Est. shopping time: {stop.estimatedTime}
                    </div>
                    
                    <div className="space-y-1">
                      {stop.items.map((item, itemIndex) => (
                        <div key={itemIndex} className="flex justify-between text-sm">
                          <span>{item.name}</span>
                          <span>${item.price.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <div className="bg-blue-50 rounded-xl p-4 mt-6">
              <h3 className="font-semibold text-blue-900 mb-2">Route Summary</h3>
              <div className="text-sm text-blue-800">
                <div className="flex justify-between">
                  <span>Total stores:</span>
                  <span>{route.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated time:</span>
                  <span>{totalTime}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Total cost:</span>
                  <span>${getTotalCost().toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Route;
