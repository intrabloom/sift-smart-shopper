
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin, X, Check, ShoppingCart, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useShoppingList } from "@/hooks/useShoppingList";
import { useStoreRoster } from "@/hooks/useStoreRoster";
import { useAuth } from "@/hooks/useAuth";

const ShoppingList = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const { roster } = useStoreRoster();
  const { 
    items, 
    isLoading: listLoading,
    removeItem, 
    toggleItem, 
    clearList, 
    getOptimizedRoute, 
    getTotalCost, 
    getItemsByStore 
  } = useShoppingList();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    console.log('ShoppingList rendered with items:', items);
    console.log('Items count:', items.length);
    console.log('Loading states - auth:', authLoading, 'list:', listLoading);
  }, [items, authLoading, listLoading]);

  const handleRemoveItem = (id: number) => {
    console.log('Removing item with id:', id);
    removeItem(id);
    toast({
      title: "Item removed",
      description: "Item removed from shopping list",
    });
  };

  const optimizeRoute = () => {
    if (items.length === 0) {
      toast({
        title: "Empty list",
        description: "Add items to your list first",
        variant: "destructive",
      });
      return;
    }
    console.log('Navigating to route with items:', items);
    navigate("/route");
  };

  const handleClearList = () => {
    clearList();
    toast({
      title: "List cleared",
      description: "All items have been removed from your shopping list",
    });
  };

  const storeGroups = getItemsByStore();
  const totalCost = getTotalCost();

  // Show loading spinner while authentication or list is loading
  if (authLoading || listLoading) {
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
            onClick={() => navigate('/home')}
            className="mr-3"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold">Shopping List</h1>
            <p className="text-sm text-gray-500">{items.length} items</p>
          </div>
        </div>
        <div className="text-right">
          <div className="font-semibold text-lg">${totalCost.toFixed(2)}</div>
          {items.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearList}
              className="text-red-600 hover:text-red-700 mt-1"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Clear All
            </Button>
          )}
        </div>
      </div>

      <div className="p-4">
        {items.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <ShoppingCart className="h-12 w-12 mx-auto mb-2" />
              Your shopping list is empty
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Add items from product pages to build your shopping list
            </p>
            <Button onClick={() => navigate("/home")}>
              Start Shopping
            </Button>
            
            {/* Debug info in development */}
            <div className="mt-8 p-4 bg-yellow-50 rounded-lg">
              <p className="text-xs text-yellow-800">
                <strong>Debug Info:</strong> Items in list: {items.length}
              </p>
              <p className="text-xs text-yellow-700 mt-1">
                LocalStorage key: shopping_list
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Roster Integration Notice */}
            {roster.length > 0 && (
              <div className="bg-blue-50 rounded-xl p-4 mb-4">
                <p className="text-sm text-blue-800">
                  <strong>Smart Routing:</strong> Your route will be optimized based on your store roster preferences for the best shopping experience.
                </p>
              </div>
            )}

            {/* Store Groups */}
            <div className="space-y-4 mb-6">
              {Object.entries(storeGroups).map(([store, storeItems]) => {
                const rosterStore = roster.find(r => r.store.name === store);
                const isPreferredStore = rosterStore && rosterStore.preference_order < 3;
                
                return (
                  <div key={store} className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">{store}</h3>
                        {isPreferredStore && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                            Preferred Store
                          </span>
                        )}
                        {rosterStore && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                            #{rosterStore.preference_order + 1} in Roster
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        ${storeItems.reduce((sum, item) => sum + item.price, 0).toFixed(2)}
                      </div>
                    </div>
                    <div className="space-y-2">
                      {storeItems.map((item) => (
                        <div 
                          key={item.id} 
                          className={`flex items-center justify-between p-2 bg-gray-50 rounded-lg transition-opacity ${
                            item.checked ? 'opacity-60' : ''
                          }`}
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <button
                              onClick={() => toggleItem(item.id)}
                              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                item.checked 
                                  ? 'bg-green-500 border-green-500 text-white' 
                                  : 'border-gray-300 hover:border-green-400'
                              }`}
                            >
                              {item.checked && <Check className="h-3 w-3" />}
                            </button>
                            <div className={item.checked ? 'line-through' : ''}>
                              <div className="font-medium">{item.productName}</div>
                              <div className="text-sm text-gray-500">${item.price.toFixed(2)}</div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                onClick={optimizeRoute}
                className="w-full bg-blue-600 hover:bg-blue-700 h-12"
              >
                <MapPin className="h-4 w-4 mr-2" />
                Optimize Shopping Route
              </Button>
              
              {roster.length === 0 && (
                <div className="bg-yellow-50 rounded-xl p-4">
                  <p className="text-sm text-yellow-800 mb-2">
                    <strong>Tip:</strong> Add stores to your roster for smarter route optimization!
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/stores')}
                  >
                    Build Store Roster
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ShoppingList;
