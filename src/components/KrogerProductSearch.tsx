
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2 } from 'lucide-react';
import { useKrogerIntegration } from '@/hooks/useKrogerIntegration';

interface KrogerProduct {
  id: string;
  upc: string;
  name: string;
  brand?: string;
  size?: string;
  category?: string;
  image_url?: string;
  price?: number;
  sale_price?: number;
}

interface KrogerProductSearchProps {
  onProductSelect: (product: KrogerProduct) => void;
  locationId?: string;
}

const KrogerProductSearch = ({ onProductSelect, locationId }: KrogerProductSearchProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<KrogerProduct[]>([]);
  const { loading, searchKrogerProducts } = useKrogerIntegration();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const products = await searchKrogerProducts(query, locationId);
    setResults(products);
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          placeholder="Search Kroger products..."
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
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="font-semibold">Kroger Results ({results.length})</h3>
            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
              Kroger
            </span>
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
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default KrogerProductSearch;
