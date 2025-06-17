
import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShoppingCart, ArrowLeft, MapPin, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useProducts } from "@/hooks/useProducts";
import { useLocation } from "@/hooks/useLocation";

interface Product {
  id: string;
  upc: string;
  name: string;
  brand?: string;
  size?: string;
  category?: string;
  image_url?: string;
  ingredients?: string;
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
  const { barcode } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [prices, setPrices] = useState<ProductPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{lat: number; lng: number} | null>(null);
  
  const { getProductByBarcode, getProductPrices } = useProducts();
  const { getCurrentLocation } = useLocation();

  useEffect(() => {
    const loadProduct = async () => {
      if (!barcode) return;

      setLoading(true);
      try {
        // Get user location for distance calculation
        try {
          const location = await getCurrentLocation();
          setUserLocation(location);
        } catch (err) {
          console.log('Could not get user location:', err);
        }

        // Load product data
        const productData = await getProductByBarcode(barcode);
        
        if (!productData) {
          toast({
            title: "Product not found",
            description: "This barcode is not in our database yet",
            variant: "destructive",
          });
          navigate('/home');
          return;
        }

        setProduct(productData);

        // Load price data
        const priceData = await getProductPrices(
          productData.id, 
          userLocation?.lat, 
          userLocation?.lng
        );
        setPrices(priceData);

      } catch (error) {
        console.error('Error loading product:', error);
        toast({
          title: "Error loading product",
          description: "Please try again",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [barcode, getProductByBarcode, getProductPrices, toast, navigate, getCurrentLocation]);

  const addToShoppingList = (store: string, price: number) => {
    const existingList = JSON.parse(localStorage.getItem("shopping_list") || "[]");
    const newItem = {
      id: Date.now(),
      productId: product?.id,
      productName: product?.name,
      store,
      price,
      addedAt: new Date().toISOString()
    };

    existingList.push(newItem);
    localStorage.setItem("shopping_list", JSON.stringify(existingList));

    toast({
      title: "Added to list!",
      description: `${product?.name} from ${store}`,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Product not found</p>
          <Button onClick={() => navigate('/home')} className="mt-4">
            Back to Home
          </Button>
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
            <div className="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <div className="text-gray-400 text-xs text-center">
                  No Image
                </div>
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900">{product.name}</h2>
              {product.brand && <p className="text-gray-600">{product.brand}</p>}
              {product.size && <p className="text-sm text-gray-500">{product.size}</p>}
              {product.category && (
                <span className="inline-block mt-2 text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                  {product.category}
                </span>
              )}
            </div>
          </div>

          {/* Product Details */}
          {(product.ingredients || product.allergens?.length) && (
            <div className="mt-6 pt-6 border-t space-y-4">
              {product.ingredients && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Ingredients</h3>
                  <p className="text-sm text-gray-600">{product.ingredients}</p>
                </div>
              )}
              
              {product.allergens && product.allergens.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Allergens</h3>
                  <div className="flex flex-wrap gap-2">
                    {product.allergens.map((allergen, index) => (
                      <span
                        key={index}
                        className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded"
                      >
                        {allergen}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Price Comparison */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Price Comparison</h3>
          
          {prices.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No pricing information available for this product
            </p>
          ) : (
            <div className="space-y-3">
              {prices.map((priceInfo, index) => (
                <div
                  key={priceInfo.store.id}
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    index === 0 ? 'border-green-200 bg-green-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium">{priceInfo.store.name}</h4>
                      {index === 0 && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                          Best Price
                        </span>
                      )}
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <MapPin className="h-3 w-3 mr-1" />
                      {priceInfo.store.city}, {priceInfo.store.state}
                      {priceInfo.distance && (
                        <span className="ml-2">
                          • {priceInfo.distance.toFixed(1)} mi
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      {priceInfo.sale_price && (
                        <span className="text-sm text-gray-400 line-through">
                          ${priceInfo.price.toFixed(2)}
                        </span>
                      )}
                      <div className="text-lg font-semibold">
                        ${(priceInfo.sale_price || priceInfo.price).toFixed(2)}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => addToShoppingList(priceInfo.store.name, priceInfo.sale_price || priceInfo.price)}
                      className="mt-1"
                    >
                      <ShoppingCart className="h-3 w-3 mr-1" />
                      Add
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Product;
