
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShoppingCart, ArrowLeft, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ProductPrice {
  store: string;
  price: number;
  distance: string;
}

const Product = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [product, setProduct] = useState<any>(null);
  const [prices, setPrices] = useState<ProductPrice[]>([]);

  useEffect(() => {
    // Mock product data - in production this would fetch from API
    const mockProduct = {
      id,
      name: "Organic Bananas",
      brand: "Fresh Market",
      size: "2 lbs",
      image: "/placeholder.svg"
    };

    const mockPrices: ProductPrice[] = [
      { store: "Walmart", price: 2.98, distance: "0.5 mi" },
      { store: "Target", price: 3.29, distance: "0.8 mi" },
      { store: "Kroger", price: 2.79, distance: "1.2 mi" },
      { store: "Whole Foods", price: 4.99, distance: "1.5 mi" }
    ].sort((a, b) => a.price - b.price);

    setProduct(mockProduct);
    setPrices(mockPrices);
  }, [id]);

  const addToShoppingList = (store: string, price: number) => {
    const existingList = JSON.parse(localStorage.getItem("shopping_list") || "[]");
    const newItem = {
      id: Date.now(),
      productId: id,
      productName: product.name,
      store,
      price,
      addedAt: new Date().toISOString()
    };

    existingList.push(newItem);
    localStorage.setItem("shopping_list", JSON.stringify(existingList));

    toast({
      title: "Added to list!",
      description: `${product.name} from ${store}`,
    });
  };

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm p-4 flex items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="mr-3"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold">Product Details</h1>
      </div>

      {/* Product Info */}
      <div className="p-4">
        <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <div className="flex items-start space-x-4">
            <img
              src={product.image}
              alt={product.name}
              className="w-20 h-20 rounded-lg bg-gray-100"
            />
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900">{product.name}</h2>
              <p className="text-gray-600">{product.brand}</p>
              <p className="text-sm text-gray-500">{product.size}</p>
            </div>
          </div>
        </div>

        {/* Price Comparison */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Price Comparison</h3>
          <div className="space-y-3">
            {prices.map((priceInfo, index) => (
              <div
                key={priceInfo.store}
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  index === 0 ? 'border-green-200 bg-green-50' : 'border-gray-200'
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium">{priceInfo.store}</h4>
                    {index === 0 && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        Best Price
                      </span>
                    )}
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <MapPin className="h-3 w-3 mr-1" />
                    {priceInfo.distance}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold">${priceInfo.price.toFixed(2)}</div>
                  <Button
                    size="sm"
                    onClick={() => addToShoppingList(priceInfo.store, priceInfo.price)}
                    className="mt-1"
                  >
                    <ShoppingCart className="h-3 w-3 mr-1" />
                    Add
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Product;
