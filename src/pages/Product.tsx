import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShoppingCart, MapPin, Loader2, AlertCircle, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useProducts } from "@/hooks/useProducts";
import { useShoppingList } from "@/hooks/useShoppingList";

interface Product {
  id: string;
  upc: string;
  name: string;
  brand?: string;
  size?: string;
  category?: string;
  image_url?: string;
  ingredients?: string;
  nutrition_facts?: any;
  allergens?: string[];
}

interface ProductPrice {
  store: {
    id: string;
    name: string;
    address: string;
    city: string;
    state: string;
  };
  price: number;
  sale_price?: number;
  in_stock: boolean;
  distance?: number;
}

const Product = () => {
  const { barcode } = useParams<{ barcode: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { getProductByBarcode, getProductPrices } = useProducts();
  const { addItem } = useShoppingList();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [prices, setPrices] = useState<ProductPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const loadProduct = async (upc: string) => {
    if (retryCount >= 3) {
      setError("Failed to load product after multiple attempts. Please try again later.");
      setLoading(false);
      return;
    }

    try {
      setError(null);
      console.log('Loading product with UPC:', upc);
      
      const productData = await getProductByBarcode(upc);
      
      if (!productData) {
        setError("Product not found. This might be a new product not yet in our database.");
        setPrices([]);
        setLoading(false);
        return;
      }

      console.log('Product found:', productData);
      setProduct(productData);

      // Load prices
      try {
        const priceData = await getProductPrices(productData.id);
        console.log('Prices loaded:', priceData);
        setPrices(priceData);
      } catch (priceError) {
        console.error('Error loading prices:', priceError);
        // Don't fail the whole component if prices fail to load
        setPrices([]);
      }

      setLoading(false);
    } catch (err) {
      console.error('Error loading product:', err);
      setRetryCount(prev => prev + 1);
      
      if (retryCount >= 2) {
        setError("Unable to load product data. Please check your connection and try again.");
        setLoading(false);
      } else {
        // Retry after a short delay
        setTimeout(() => loadProduct(upc), 1000);
      }
    }
  };

  useEffect(() => {
    if (barcode) {
      setRetryCount(0);
      loadProduct(barcode);
    } else {
      setError("No product barcode provided.");
      setLoading(false);
    }
  }, [barcode]);

  const handleAddToList = (storeInfo?: ProductPrice) => {
    if (!product) return;
    
    const store = storeInfo ? storeInfo.store.name : (bestStore?.store.name || 'Unknown Store');
    const price = storeInfo ? (storeInfo.sale_price || storeInfo.price) : (bestStore?.sale_price || bestStore?.price || 0);
    
    const item = {
      productId: product.id,
      productName: product.name,
      store: store,
      storeId: storeInfo?.store.id || bestStore?.store.id,
      price: price
    };
    
    console.log('Adding item to shopping list:', item);
    addItem(item);
    
    toast({
      title: "Added to shopping list",
      description: `${product.name} from ${store} has been added to your shopping list.`,
    });
  };

  const handleRetry = () => {
    if (barcode) {
      setLoading(true);
      setError(null);
      setRetryCount(0);
      loadProduct(barcode);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading product information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="p-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/home")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </div>

        <div className="flex items-center justify-center px-4">
          <div className="bg-white rounded-xl p-8 shadow-sm text-center max-w-md">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Unable to Load Product
            </h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="space-y-3">
              <Button onClick={handleRetry} className="w-full">
                Try Again
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate("/home")}
                className="w-full"
              >
                Back to Home
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="p-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/home")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </div>

        <div className="flex items-center justify-center px-4">
          <div className="bg-white rounded-xl p-8 shadow-sm text-center max-w-md">
            <AlertCircle className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Product Not Found
            </h2>
            <p className="text-gray-600 mb-6">
              We couldn't find information for barcode: {barcode}
            </p>
            <Button onClick={() => navigate("/home")} className="w-full">
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const lowestPrice = prices.length > 0 ? Math.min(...prices.map(p => p.sale_price || p.price)) : null;
  const bestStore = prices.find(p => (p.sale_price || p.price) === lowestPrice);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm p-4">
        <Button
          variant="ghost"
          onClick={() => navigate("/home")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>
      </div>

      <div className="p-4 space-y-6">
        {/* Product Info */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-start space-x-4">
            <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <div className="text-gray-400 text-xs text-center">No Image</div>
              )}
            </div>
            
            <div className="flex-1">
              <h1 className="text-xl font-semibold text-gray-900">{product.name}</h1>
              {product.brand && (
                <p className="text-gray-600">{product.brand}</p>
              )}
              <div className="flex items-center gap-3 mt-2">
                {product.size && (
                  <span className="text-sm bg-gray-100 text-gray-600 px-2 py-1 rounded">
                    {product.size}
                  </span>
                )}
                {product.category && (
                  <span className="text-sm bg-blue-100 text-blue-600 px-2 py-1 rounded">
                    {product.category}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-2">UPC: {product.upc}</p>
            </div>
          </div>

          {bestStore && (
            <div className="mt-4 p-4 bg-green-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-green-800">Best Price</p>
                  <p className="text-sm text-green-600">{bestStore.store.name}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-700">
                      ${(bestStore.sale_price || bestStore.price).toFixed(2)}
                    </p>
                    {bestStore.sale_price && (
                      <p className="text-sm text-gray-500 line-through">
                        ${bestStore.price.toFixed(2)}
                      </p>
                    )}
                  </div>
                  <Button
                    onClick={() => handleAddToList(bestStore)}
                    size="icon"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Store Prices */}
        {prices.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold">Available At ({prices.length} stores)</h2>
            </div>
            <div className="divide-y">
              {prices.map((priceInfo, index) => (
                <div key={index} className="p-4 flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium">{priceInfo.store.name}</h3>
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                      <MapPin className="h-3 w-3 mr-1" />
                      {priceInfo.store.address}, {priceInfo.store.city}
                      {priceInfo.distance && (
                        <span className="ml-2">({priceInfo.distance.toFixed(1)} mi)</span>
                      )}
                    </div>
                    {!priceInfo.in_stock && (
                      <span className="text-sm text-red-500">Out of Stock</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-lg font-semibold">
                        ${(priceInfo.sale_price || priceInfo.price).toFixed(2)}
                      </p>
                      {priceInfo.sale_price && (
                        <p className="text-sm text-gray-500 line-through">
                          ${priceInfo.price.toFixed(2)}
                        </p>
                      )}
                    </div>
                    <Button
                      onClick={() => handleAddToList(priceInfo)}
                      size="icon"
                      className="bg-blue-600 hover:bg-blue-700"
                      disabled={!priceInfo.in_stock}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Product Details */}
        {(product.ingredients || (product.allergens && product.allergens.length > 0)) && (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Product Details</h2>
            
            {product.ingredients && (
              <div className="mb-4">
                <h3 className="font-medium text-gray-700 mb-2">Ingredients</h3>
                <p className="text-sm text-gray-600">{product.ingredients}</p>
              </div>
            )}
            
            {product.allergens && product.allergens.length > 0 && (
              <div>
                <h3 className="font-medium text-gray-700 mb-2">Allergens</h3>
                <div className="flex flex-wrap gap-2">
                  {product.allergens.map((allergen, index) => (
                    <span
                      key={index}
                      className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full"
                    >
                      {allergen}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Add to Shopping List */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <Button
            onClick={() => handleAddToList()}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            <ShoppingCart className="h-5 w-5 mr-2" />
            Add Best Price to Shopping List
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Product;
