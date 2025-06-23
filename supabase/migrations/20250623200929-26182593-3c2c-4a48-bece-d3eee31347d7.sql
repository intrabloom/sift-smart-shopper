
-- Drop ALL foreign key constraints that reference stores.id
ALTER TABLE public.store_catalogs DROP CONSTRAINT IF EXISTS store_catalogs_store_id_fkey;
ALTER TABLE public.user_store_roster DROP CONSTRAINT IF EXISTS user_store_roster_store_id_fkey;
ALTER TABLE public.product_prices DROP CONSTRAINT IF EXISTS product_prices_store_id_fkey;

-- Change the stores table id column from UUID to TEXT
ALTER TABLE public.stores ALTER COLUMN id TYPE TEXT;

-- Update ALL the foreign key columns to TEXT as well
ALTER TABLE public.store_catalogs ALTER COLUMN store_id TYPE TEXT;
ALTER TABLE public.user_store_roster ALTER COLUMN store_id TYPE TEXT;
ALTER TABLE public.product_prices ALTER COLUMN store_id TYPE TEXT;

-- Recreate ALL the foreign key constraints
ALTER TABLE public.store_catalogs 
  ADD CONSTRAINT store_catalogs_store_id_fkey 
  FOREIGN KEY (store_id) REFERENCES public.stores(id);

ALTER TABLE public.user_store_roster 
  ADD CONSTRAINT user_store_roster_store_id_fkey 
  FOREIGN KEY (store_id) REFERENCES public.stores(id);

ALTER TABLE public.product_prices 
  ADD CONSTRAINT product_prices_store_id_fkey 
  FOREIGN KEY (store_id) REFERENCES public.stores(id);
