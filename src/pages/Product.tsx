import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShoppingCart, MapPin, Loader2, AlertCircle, Plus, Thermometer, Truck, Store, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useProducts } from "@/hooks/useProducts";
import { useKrogerIntegration } from "@/hooks/useKrogerIntegration";
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
  price?: number;
  sale_price?: number;
  kroger_data?: any;
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
  const { searchKrogerProducts } = useKrogerIntegration();
  const { addItem } = useShoppingList();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [prices, setPrices] = useState<ProductPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isKrogerProduct, setIsKrogerProduct] = useState(false);

  const loadProduct = async (upc: string) => {
    if (retryCount >= 3) {
      setError("Failed to load product after multiple attempts. Please try again later.");
      setLoading(false);
      return;
    }

    try {
      setError(null);
      console.log('Loading product with UPC:', upc);
      
      // First try to get from local database
      const localProduct = await getProductByBarcode(upc);
      
      if (localProduct) {
        console.log('Product found in local database:', localProduct);
        setProduct(localProduct);
        setIsKrogerProduct(false);

        // Load prices for local products
        try {
          const priceData = await getProductPrices(localProduct.id);
          console.log('Prices loaded:', priceData);
          setPrices(priceData);
        } catch (priceError) {
          console.error('Error loading prices:', priceError);
          setPrices([]);
        }
      } else {
        // If not found locally, try Kroger API
        console.log('Product not found locally, searching Kroger...');
        const krogerProducts = await searchKrogerProducts(upc);
        
        if (krogerProducts.length > 0) {
          const krogerProduct = krogerProducts[0];
          console.log('Product found in Kroger:', krogerProduct);
          setProduct(krogerProduct);
          setIsKrogerProduct(true);
          
          // For Kroger products, we don't have separate price data
          // The pricing is already included in the product data
          setPrices([]);
        } else {
          setError("Product not found. This might be a new product not yet in our database or Kroger's catalog.");
          setPrices([]);
        }
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
    
    let store, price;
    
    if (isKrogerProduct) {
      // For Kroger products, use Kroger as store and product's price
      store = 'Kroger';
      price = product.sale_price || product.price || 0;
    } else {
      // For local products, use the best store or provided store info
      const bestStore = prices.length > 0 ? prices.find(p => (p.sale_price || p.price) === Math.min(...prices.map(pr => pr.sale_price || pr.price))) : null;
      store = storeInfo ? storeInfo.store.name : (bestStore?.store.name || 'Unknown Store');
      price = storeInfo ? (storeInfo.sale_price || storeInfo.price) : (bestStore?.sale_price || bestStore?.price || 0);
    }
    
    const item = {
      productId: product.id,
      productName: product.name,
      store: store,
      storeId: storeInfo?.store.id || (isKrogerProduct ? 'kroger' : undefined),
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

  // Helper function to get detailed pricing from Kroger data
  const getKrogerPricing = () => {
    if (!isKrogerProduct || !product?.kroger_data) return null;
    
    const firstItem = product.kroger_data.items?.[0];
    if (!firstItem) return null;
    
    return {
      price: firstItem.price,
      nationalPrice: firstItem.nationalPrice,
      inventory: firstItem.inventory,
      fulfillment: firstItem.fulfillment
    };
  };

  const krogerPricing = getKrogerPricing();

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
                {isKrogerProduct && (
                  <span className="text-sm bg-red-100 text-red-700 px-2 py-1 rounded">
                    Kroger
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-2">UPC: {product.upc}</p>
            </div>
          </div>
        </div>

        {/* Enhanced Kroger Pricing Section */}
        {isKrogerProduct && krogerPricing && (
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold">Kroger Pricing & Availability</h2>
            </div>
            <div className="p-6 space-y-4">
              {/* Main Pricing */}
              {(krogerPricing.price || krogerPricing.nationalPrice) && (
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-green-800">Store Price</p>
                      <p className="text-sm text-green-600">Location-specific pricing</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        {krogerPricing.price?.promo && (
                          <p className="text-2xl font-bold text-red-600">
                            ${krogerPricing.price.promo.toFixed(2)}
                          </p>
                        )}
                        <p className={`text-lg font-semibold ${krogerPricing.price?.promo ? 'line-through text-gray-500' : 'text-green-700'}`}>
                          ${(krogerPricing.price?.regular || 0).toFixed(2)}
                        </p>
                        {krogerPricing.price?.regularPerUnitEstimate && (
                          <p className="text-xs text-gray-500">
                            ~${krogerPricing.price.regularPerUnitEstimate.toFixed(2)}/unit
                          </p>
                        )}
                      </div>
                      <Button
                        onClick={() => handleAddToList()}
                        size="icon"
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* National Pricing */}
              {krogerPricing.nationalPrice && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-blue-800">National Price</p>
                      <p className="text-sm text-blue-600">Standard pricing</p>
                    </div>
                    <div className="text-right">
                      {krogerPricing.nationalPrice.promo && (
                        <p className="text-xl font-bold text-red-600">
                          ${krogerPricing.nationalPrice.promo.toFixed(2)}
                        </p>
                      )}
                      <p className={`text-lg font-semibold ${krogerPricing.nationalPrice.promo ? 'line-through text-gray-500' : 'text-blue-700'}`}>
                        ${krogerPricing.nationalPrice.regular.toFixed(2)}
                      </p>
                      {krogerPricing.nationalPrice.regularPerUnitEstimate && (
                        <p className="text-xs text-gray-500">
                          ~${krogerPricing.nationalPrice.regularPerUnitEstimate.toFixed(2)}/unit
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Fulfillment Options */}
              {krogerPricing.fulfillment && (
                <div>
                  <h3 className="font-medium text-gray-700 mb-3">Available Services</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className={`p-3 rounded-lg border ${krogerPricing.fulfillment.inStore ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex items-center gap-2">
                        <Store className={`h-4 w-4 ${krogerPricing.fulfillment.inStore ? 'text-green-600' : 'text-gray-400'}`} />
                        <span className={`text-sm font-medium ${krogerPricing.fulfillment.inStore ? 'text-green-700' : 'text-gray-500'}`}>
                          In-Store
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        {krogerPricing.fulfillment.inStore ? 'Available' : 'Not Available'}
                      </p>
                    </div>
                    <div className={`p-3 rounded-lg border ${krogerPricing.fulfillment.curbside ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex items-center gap-2">
                        <MapPin className={`h-4 w-4 ${krogerPricing.fulfillment.curbside ? 'text-green-600' : 'text-gray-400'}`} />
                        <span className={`text-sm font-medium ${krogerPricing.fulfillment.curbside ? 'text-green-700' : 'text-gray-500'}`}>
                          Curbside
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        {krogerPricing.fulfillment.curbside ? 'Available' : 'Not Available'}
                      </p>
                    </div>
                    <div className={`p-3 rounded-lg border ${krogerPricing.fulfillment.delivery ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex items-center gap-2">
                        <Truck className={`h-4 w-4 ${krogerPricing.fulfillment.delivery ? 'text-green-600' : 'text-gray-400'}`} />
                        <span className={`text-sm font-medium ${krogerPricing.fulfillment.delivery ? 'text-green-700' : 'text-gray-500'}`}>
                          Delivery
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        {krogerPricing.fulfillment.delivery ? 'Available' : 'Not Available'}
                      </p>
                    </div>
                    <div className={`p-3 rounded-lg border ${krogerPricing.fulfillment.shipToHome ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex items-center gap-2">
                        <Package className={`h-4 w-4 ${krogerPricing.fulfillment.shipToHome ? 'text-green-600' : 'text-gray-400'}`} />
                        <span className={`text-sm font-medium ${krogerPricing.fulfillment.shipToHome ? 'text-green-700' : 'text-gray-500'}`}>
                          Ship to Home
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        {krogerPricing.fulfillment.shipToHome ? 'Available' : 'Not Available'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Inventory Status */}
              {krogerPricing.inventory && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${krogerPricing.inventory.stockLevel === 'high' ? 'bg-green-500' : krogerPricing.inventory.stockLevel === 'medium' ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                    <span className="text-sm font-medium text-gray-700">
                      Stock Level: {krogerPricing.inventory.stockLevel || 'Unknown'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Basic Pricing for Kroger products without detailed data */}
        {isKrogerProduct && !krogerPricing && (product.price || product.sale_price) && (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-green-800">Kroger Price</p>
                  <p className="text-sm text-green-600">Kroger</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-700">
                      ${(product.sale_price || product.price)?.toFixed(2)}
                    </p>
                    {product.sale_price && product.price && (
                      <p className="text-sm text-gray-500 line-through">
                        ${product.price.toFixed(2)}
                      </p>
                    )}
                  </div>
                  <Button
                    onClick={() => handleAddToList()}
                    size="icon"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Store Prices for local products */}
        {!isKrogerProduct && prices.length > 0 && (
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

        {/* Enhanced Kroger Product Details */}
        {isKrogerProduct && product.kroger_data && (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Product Details</h2>
            
            {/* Temperature Information */}
            {product.kroger_data.temperature && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Thermometer className="h-4 w-4 text-blue-600" />
                  <h3 className="font-medium text-gray-700">Temperature Requirements</h3>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-sm px-3 py-1 rounded-full ${
                    product.kroger_data.temperature.indicator === 'Frozen' ? 'bg-blue-100 text-blue-700' :
                    product.kroger_data.temperature.indicator === 'Refrigerated' ? 'bg-green-100 text-green-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {product.kroger_data.temperature.indicator}
                  </span>
                  {product.kroger_data.temperature.heatSensitive && (
                    <span className="text-sm bg-red-100 text-red-700 px-3 py-1 rounded-full">
                      Heat Sensitive
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Categories */}
            {product.kroger_data.categories && product.kroger_data.categories.length > 0 && (
              <div className="mb-4">
                <h3 className="font-medium text-gray-700 mb-2">Categories</h3>
                <div className="flex flex-wrap gap-2">
                  {product.kroger_data.categories.map((category: string, index: number) => (
                    <span
                      key={index}
                      className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full"
                    >
                      {category}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Country of Origin */}
            {product.kroger_data.countryOrigin && product.kroger_data.countryOrigin !== 'null' && (
              <div className="mb-4">
                <h3 className="font-medium text-gray-700 mb-2">Country of Origin</h3>
                <p className="text-sm text-gray-600">{product.kroger_data.countryOrigin}</p>
              </div>
            )}

            {/* Aisle Locations */}
            {product.kroger_data.aisleLocations && product.kroger_data.aisleLocations.length > 0 && (
              <div className="mb-4">
                <h3 className="font-medium text-gray-700 mb-2">Store Location</h3>
                <div className="space-y-2">
                  {product.kroger_data.aisleLocations.map((location: any, index: number) => (
                    <div key={index} className="text-sm bg-gray-50 p-2 rounded">
                      <p><strong>Aisle {location.number}</strong> - {location.description}</p>
                      {location.shelfNumber && (
                        <p className="text-gray-600">Shelf {location.shelfNumber}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Regular Product Details for local products */}
        {!isKrogerProduct && (product.ingredients || (product.allergens && product.allergens.length > 0)) && (
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
            Add to Shopping List
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Product;
