
-- Create products table for storing product information
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  upc TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  brand TEXT,
  size TEXT,
  category TEXT,
  image_url TEXT,
  ingredients TEXT,
  nutrition_facts JSONB DEFAULT '{}',
  allergens TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create product_prices table for store-specific pricing
CREATE TABLE public.product_prices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) NOT NULL,
  store_id UUID REFERENCES public.stores(id) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  sale_price DECIMAL(10, 2),
  in_stock BOOLEAN DEFAULT TRUE,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, store_id)
);

-- Create user_search_history table for tracking user searches
CREATE TABLE public.user_search_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  product_upc TEXT NOT NULL,
  search_type TEXT NOT NULL CHECK (search_type IN ('barcode', 'text')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on new tables
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_search_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for products (public read access)
CREATE POLICY "Anyone can view products" ON public.products
  FOR SELECT USING (true);

-- RLS policies for product_prices (public read access)
CREATE POLICY "Anyone can view product prices" ON public.product_prices
  FOR SELECT USING (true);

-- RLS policies for user_search_history
CREATE POLICY "Users can view their own search history" ON public.user_search_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own search history" ON public.user_search_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Insert sample products
INSERT INTO public.products (upc, name, brand, size, category, ingredients, allergens) VALUES
('012345678901', 'Organic Bananas', 'Fresh Market', '2 lbs', 'Produce', 'Organic bananas', ARRAY[]::TEXT[]),
('012345678902', 'Whole Milk', 'Dairy Fresh', '1 gallon', 'Dairy', 'Pasteurized milk, vitamin D3', ARRAY['milk']),
('012345678903', 'Sourdough Bread', 'Artisan Bakery', '24 oz', 'Bakery', 'Enriched flour, water, sourdough starter, salt', ARRAY['gluten', 'wheat']),
('012345678904', 'Greek Yogurt', 'Mediterranean', '32 oz', 'Dairy', 'Cultured pasteurized milk, live active cultures', ARRAY['milk']),
('012345678905', 'Organic Spinach', 'Green Valley', '5 oz', 'Produce', 'Organic spinach leaves', ARRAY[]::TEXT[]),
('012345678906', 'Almond Butter', 'Nutty Spread', '16 oz', 'Pantry', 'Dry roasted almonds, sea salt', ARRAY['tree nuts']);

-- Insert sample product prices
INSERT INTO public.product_prices (product_id, store_id, price, in_stock) VALUES
-- Organic Bananas
((SELECT id FROM public.products WHERE upc = '012345678901'), (SELECT id FROM public.stores WHERE name = 'Walmart Supercenter'), 2.98, true),
((SELECT id FROM public.products WHERE upc = '012345678901'), (SELECT id FROM public.stores WHERE name = 'Target'), 3.29, true),
((SELECT id FROM public.products WHERE upc = '012345678901'), (SELECT id FROM public.stores WHERE name = 'Kroger'), 2.79, true),
((SELECT id FROM public.products WHERE upc = '012345678901'), (SELECT id FROM public.stores WHERE name = 'Whole Foods Market'), 4.99, true),

-- Whole Milk
((SELECT id FROM public.products WHERE upc = '012345678902'), (SELECT id FROM public.stores WHERE name = 'Walmart Supercenter'), 3.48, true),
((SELECT id FROM public.products WHERE upc = '012345678902'), (SELECT id FROM public.stores WHERE name = 'Target'), 3.79, true),
((SELECT id FROM public.products WHERE upc = '012345678902'), (SELECT id FROM public.stores WHERE name = 'Kroger'), 3.29, true),

-- Sourdough Bread
((SELECT id FROM public.products WHERE upc = '012345678903'), (SELECT id FROM public.stores WHERE name = 'Walmart Supercenter'), 2.48, true),
((SELECT id FROM public.products WHERE upc = '012345678903'), (SELECT id FROM public.stores WHERE name = 'Whole Foods Market'), 4.99, true),

-- Greek Yogurt
((SELECT id FROM public.products WHERE upc = '012345678904'), (SELECT id FROM public.stores WHERE name = 'Target'), 5.99, true),
((SELECT id FROM public.products WHERE upc = '012345678904'), (SELECT id FROM public.stores WHERE name = 'Kroger'), 4.99, true),
((SELECT id FROM public.products WHERE upc = '012345678904'), (SELECT id FROM public.stores WHERE name = 'Whole Foods Market'), 6.49, true);
