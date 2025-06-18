
-- Update stores table to use DOUBLE PRECISION for coordinates with bounds validation
ALTER TABLE public.stores 
  ALTER COLUMN latitude TYPE DOUBLE PRECISION,
  ALTER COLUMN longitude TYPE DOUBLE PRECISION;

-- Add bounds validation for latitude and longitude
ALTER TABLE public.stores 
  ADD CONSTRAINT check_latitude_bounds CHECK (latitude >= -90 AND latitude <= 90),
  ADD CONSTRAINT check_longitude_bounds CHECK (longitude >= -180 AND longitude <= 180);

-- Update user_locations table to use DOUBLE PRECISION for coordinates with bounds validation
ALTER TABLE public.user_locations 
  ALTER COLUMN latitude TYPE DOUBLE PRECISION,
  ALTER COLUMN longitude TYPE DOUBLE PRECISION;

-- Add bounds validation for user_locations coordinates
ALTER TABLE public.user_locations 
  ADD CONSTRAINT check_user_latitude_bounds CHECK (latitude >= -90 AND latitude <= 90),
  ADD CONSTRAINT check_user_longitude_bounds CHECK (longitude >= -180 AND longitude <= 180);

-- Update product_prices table to use DOUBLE PRECISION for monetary values with bounds validation
ALTER TABLE public.product_prices 
  ALTER COLUMN price TYPE DOUBLE PRECISION,
  ALTER COLUMN sale_price TYPE DOUBLE PRECISION;

-- Add bounds validation for prices (must be positive)
ALTER TABLE public.product_prices 
  ADD CONSTRAINT check_price_positive CHECK (price >= 0),
  ADD CONSTRAINT check_sale_price_positive CHECK (sale_price IS NULL OR sale_price >= 0);

-- Update store_catalogs table to use DOUBLE PRECISION for price with bounds validation
ALTER TABLE public.store_catalogs 
  ALTER COLUMN price TYPE DOUBLE PRECISION;

-- Add bounds validation for catalog prices
ALTER TABLE public.store_catalogs 
  ADD CONSTRAINT check_catalog_price_positive CHECK (price IS NULL OR price >= 0);

-- Update calculate_distance function to use DOUBLE PRECISION with improved performance
CREATE OR REPLACE FUNCTION public.calculate_distance(lat1 DOUBLE PRECISION, lon1 DOUBLE PRECISION, lat2 DOUBLE PRECISION, lon2 DOUBLE PRECISION)
RETURNS DOUBLE PRECISION AS $$
BEGIN
  -- Validate input bounds
  IF lat1 < -90 OR lat1 > 90 OR lat2 < -90 OR lat2 > 90 THEN
    RAISE EXCEPTION 'Latitude must be between -90 and 90 degrees';
  END IF;
  
  IF lon1 < -180 OR lon1 > 180 OR lon2 < -180 OR lon2 > 180 THEN
    RAISE EXCEPTION 'Longitude must be between -180 and 180 degrees';
  END IF;
  
  -- Calculate distance using haversine formula (returns miles)
  RETURN (
    3959 * acos(
      cos(radians(lat1)) * cos(radians(lat2)) * cos(radians(lon2) - radians(lon1)) +
      sin(radians(lat1)) * sin(radians(lat2))
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Update handle_new_user function with security definer and search path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert new profile for authenticated user with fallback display name
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;
