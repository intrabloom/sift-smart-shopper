
-- Create stores table with location and API support information
CREATE TABLE public.stores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  phone TEXT,
  hours JSONB DEFAULT '{}',
  supported_apis TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_locations table for saved locations
CREATE TABLE public.user_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL, -- e.g., "Home", "Work"
  address TEXT NOT NULL,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create store_catalogs table for product availability per store
CREATE TABLE public.store_catalogs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID REFERENCES public.stores(id) NOT NULL,
  product_name TEXT NOT NULL,
  brand TEXT,
  upc TEXT,
  price DECIMAL(10, 2),
  in_stock BOOLEAN DEFAULT TRUE,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_store_roster table for user's favorite stores
CREATE TABLE public.user_store_roster (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  store_id UUID REFERENCES public.stores(id) NOT NULL,
  preference_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, store_id)
);

-- Enable RLS on all tables
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_catalogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_store_roster ENABLE ROW LEVEL SECURITY;

-- RLS policies for stores (public read access)
CREATE POLICY "Anyone can view stores" ON public.stores
  FOR SELECT USING (true);

-- RLS policies for user_locations
CREATE POLICY "Users can view their own locations" ON public.user_locations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own locations" ON public.user_locations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own locations" ON public.user_locations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own locations" ON public.user_locations
  FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for store_catalogs (public read access)
CREATE POLICY "Anyone can view store catalogs" ON public.store_catalogs
  FOR SELECT USING (true);

-- RLS policies for user_store_roster
CREATE POLICY "Users can view their own store roster" ON public.user_store_roster
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own store roster" ON public.user_store_roster
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own store roster" ON public.user_store_roster
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete from their own store roster" ON public.user_store_roster
  FOR DELETE USING (auth.uid() = user_id);

-- Add some sample stores data
INSERT INTO public.stores (name, address, city, state, zip_code, latitude, longitude, phone, supported_apis) VALUES
('Walmart Supercenter', '123 Main St', 'Springfield', 'IL', '62701', 39.7817, -89.6501, '(555) 123-4567', ARRAY['walmart']),
('Target', '456 Oak Ave', 'Springfield', 'IL', '62702', 39.7856, -89.6467, '(555) 234-5678', ARRAY['target']),
('Kroger', '789 Elm St', 'Springfield', 'IL', '62703', 39.7889, -89.6423, '(555) 345-6789', ARRAY['kroger']),
('Whole Foods Market', '321 Pine St', 'Springfield', 'IL', '62704', 39.7923, -89.6389, '(555) 456-7890', ARRAY['whole_foods']),
('Costco Wholesale', '654 Cedar Rd', 'Springfield', 'IL', '62705', 39.7756, -89.6534, '(555) 567-8901', ARRAY['costco']),
('Safeway', '987 Birch Ln', 'Springfield', 'IL', '62706', 39.7712, -89.6578, '(555) 678-9012', ARRAY['safeway']);

-- Function to calculate distance between two points
CREATE OR REPLACE FUNCTION calculate_distance(lat1 DECIMAL, lon1 DECIMAL, lat2 DECIMAL, lon2 DECIMAL)
RETURNS DECIMAL AS $$
BEGIN
  RETURN (
    3959 * acos(
      cos(radians(lat1)) * cos(radians(lat2)) * cos(radians(lon2) - radians(lon1)) +
      sin(radians(lat1)) * sin(radians(lat2))
    )
  );
END;
$$ LANGUAGE plpgsql;
