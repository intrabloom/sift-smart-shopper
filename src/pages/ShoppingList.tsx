
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ShoppingListItem {
  id: number;
  productId: string;
  productName: string;
  store: string;
  price: number;
  addedAt: string;
}

const ShoppingList = () => {
  const [items, setItems] = useState<ShoppingListItem[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const savedList = JSON.parse(localStorage.getItem("shopping_list") || "[]");
    setItems(savedList);
  }, []);

  const removeItem = (id: number) => {
    const updatedItems = items.filter(item => item.id !== id);
    setItems(updatedItems);
    localStorage.setItem("shopping_list", JSON.stringify(updatedItems));
    
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
    navigate("/route");
  };

  const getTotalCost = () => {
    return items.reduce((total, item) => total + item.price, 0);
  };

  const getStoreGroups = () => {
    const groups: { [store: string]: ShoppingListItem[] } = {};
    items.forEach(item => {
      if (!groups[item.store]) {
        groups[item.store] = [];
      }
      groups[item.store].push(item);
    });
    return groups;
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
          <h1 className="text-lg font-semibold">Shopping List</h1>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">{items.length} items</div>
          <div className="font-semibold">${getTotalCost().toFixed(2)}</div>
        </div>
      </div>

      <div className="p-4">
        {items.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              Your shopping list is empty
            </div>
            <Button onClick={() => navigate("/home")}>
              Start Shopping
            </Button>
          </div>
        ) : (
          <>
            {/* Store Groups */}
            <div className="space-y-4 mb-6">
              {Object.entries(getStoreGroups()).map(([store, storeItems]) => (
                <div key={store} className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-lg">{store}</h3>
                    <div className="text-sm text-gray-500">
                      ${storeItems.reduce((sum, item) => sum + item.price, 0).toFixed(2)}
                    </div>
                  </div>
                  <div className="space-y-2">
                    {storeItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium">{item.productName}</div>
                          <div className="text-sm text-gray-500">${item.price.toFixed(2)}</div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(item.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Optimize Route Button */}
            <Button
              onClick={optimizeRoute}
              className="w-full bg-blue-600 hover:bg-blue-700 h-12"
            >
              <MapPin className="h-4 w-4 mr-2" />
              Optimize Shopping Route
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default ShoppingList;
