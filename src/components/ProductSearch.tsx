
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Loader2, MapPin, DollarSign } from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import { useKrogerIntegration } from '@/hooks/useKrogerIntegration';
import { useToast } from '@/hooks/use-toast';
import KrogerProductSearch from './KrogerProductSearch';

interface Product {
  id: string;
  upc: string;
  name: string;
  brand?: string;
  size?: string;
  category?: string;
  image_url?: string;
  price?: number;
  sale_price?: number;
  kroger_data?: any;
}

interface ProductSearchProps {
  onProductSelect: (product: Product) => void;
  krogerLocationId?: string;
}

const ProductSearch = ({ onProductSelect, krogerLocationId }: ProductSearchProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const { searchProducts } = useProducts();
  const { searchKrogerProducts } = useKrogerIntegration();
  const { toast } = useToast();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      if (activeTab === 'all' || activeTab === 'local') {
        const localProducts = await searchProducts(query);
        
        if (activeTab === 'all') {
          // Also search Kroger if searching all
          const krogerProducts = await searchKrogerProducts(query, krogerLocationId);
          setResults([...localProducts, ...krogerProducts]);
        } else {
          setResults(localProducts);
        }
      }
      
      if (results.length === 0) {
        toast({
          title: "No results found",
          description: "Try searching with different keywords",
        });
      }
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search failed",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All Sources</TabsTrigger>
          <TabsTrigger value="local">Local Database</TabsTrigger>
          <TabsTrigger value="kroger">
            Kroger
            {krogerLocationId && (
              <MapPin className="ml-1 h-3 w-3 text-green-600" />
            )}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              placeholder="Search all products..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={loading || !query.trim()}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </form>
          
          {krogerLocationId && (
            <div className="text-sm text-gray-600 bg-green-50 p-2 rounded flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Location-specific pricing available for Kroger products
            </div>
          )}
          
          {results.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border">
              <div className="p-4 border-b">
                <h3 className="font-semibold">All Results ({results.length})</h3>
              </div>
              <div className="divide-y max-h-96 overflow-y-auto">
                {results.map((product) => (
                  <div
                    key={product.id}
                    className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => onProductSelect(product)}
                  >
                    <div className="flex items-start gap-3">
                      {product.image_url && (
                        <img 
                          src={product.image_url} 
                          alt={product.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                      )}
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{product.name}</h4>
                        {product.brand && (
                          <p className="text-sm text-gray-600">{product.brand}</p>
                        )}
                        <div className="flex items-center gap-3 mt-1">
                          {product.size && (
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                              {product.size}
                            </span>
                          )}
                          {product.category && (
                            <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                              {product.category}
                            </span>
                          )}
                          {product.id.startsWith('kroger-') && (
                            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                              Kroger
                            </span>
                          )}
                          {(product.price || product.sale_price) && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              Pricing Available
                            </span>
                          )}
                        </div>
                        {(product.price || product.sale_price) && (
                          <div className="mt-2 flex items-center gap-2">
                            {product.sale_price && (
                              <span className="text-sm font-medium text-red-600">
                                ${product.sale_price.toFixed(2)}
                              </span>
                            )}
                            {product.price && (
                              <span className={`text-sm ${product.sale_price ? 'line-through text-gray-500' : 'font-medium text-gray-900'}`}>
                                ${product.price.toFixed(2)}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="local" className="space-y-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              placeholder="Search local database..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={loading || !query.trim()}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </form>
          
          {results.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border">
              <div className="p-4 border-b">
                <h3 className="font-semibold">Search Results ({results.length})</h3>
              </div>
              <div className="divide-y">
                {results.map((product) => (
                  <div
                    key={product.id}
                    className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => onProductSelect(product)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{product.name}</h4>
                        {product.brand && (
                          <p className="text-sm text-gray-600">{product.brand}</p>
                        )}
                        <div className="flex items-center gap-3 mt-1">
                          {product.size && (
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                              {product.size}
                            </span>
                          )}
                          {product.category && (
                            <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                              {product.category}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="kroger">
          <KrogerProductSearch 
            onProductSelect={onProductSelect}
            locationId={krogerLocationId}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProductSearch;
