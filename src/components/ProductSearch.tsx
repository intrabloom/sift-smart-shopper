
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2 } from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import { useToast } from '@/hooks/use-toast';

interface Product {
  id: string;
  upc: string;
  name: string;
  brand?: string;
  size?: string;
  category?: string;
}

interface ProductSearchProps {
  onProductSelect: (product: Product) => void;
}

const ProductSearch = ({ onProductSelect }: ProductSearchProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const { searchProducts } = useProducts();
  const { toast } = useToast();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const products = await searchProducts(query);
      setResults(products);
      
      if (products.length === 0) {
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
      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          placeholder="Search for products..."
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
    </div>
  );
};

export default ProductSearch;
