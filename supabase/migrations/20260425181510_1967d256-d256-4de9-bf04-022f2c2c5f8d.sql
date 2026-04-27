
-- 1. Roles enum & table
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (avoids recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 2. Products table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price NUMERIC NOT NULL CHECK (price >= 0),
  unit TEXT NOT NULL DEFAULT 'كغ',
  category TEXT NOT NULL DEFAULT 'تقليدية',
  image_url TEXT NOT NULL DEFAULT '',
  badge TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Anyone (including anon) can view products
CREATE POLICY "Anyone can view products" ON public.products
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert products" ON public.products
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update products" ON public.products
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete products" ON public.products
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 3. Storage bucket for product images
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true);

CREATE POLICY "Anyone can view product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

CREATE POLICY "Admins can upload product images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update product images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete product images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));

-- 4. Seed initial products
INSERT INTO public.products (name, description, price, unit, category, image_url, badge, sort_order) VALUES
('بقلاوة بالفستق', 'بقلاوة فاخرة محشوة بالفستق الحلبي والعسل الطبيعي', 2800, 'كغ', 'تقليدية', '/src/assets/baklava.jpg', 'الأكثر مبيعاً', 1),
('مقروط بالتمر', 'مقروط محضر بالسميد الفاخر ومحشو بمعجون التمر الطازج', 1800, 'كغ', 'تقليدية', '/src/assets/makroud.jpg', NULL, 2),
('قلب اللوز', 'حلوى السميد باللوز مغموسة بشراب الورد العطري', 2500, 'كغ', 'تقليدية', '/src/assets/kalb-el-louz.jpg', 'جديد', 3),
('غريبية باللوز', 'كعك هش يذوب في الفم محضر بالزبدة الطبيعية واللوز', 2200, 'كغ', 'كعك', '/src/assets/ghribia.jpg', NULL, 4),
('سمسة بالعسل', 'سمسة مقرمشة محشوة باللوز ومغطاة بالعسل الطبيعي', 2600, 'كغ', 'تقليدية', '/src/assets/samsa.jpg', NULL, 5),
('تشكيلة فاخرة', 'صينية متنوعة من أرقى الحلويات التقليدية الجزائرية', 4500, 'صينية', 'مناسبات', '/src/assets/hero-sweets.jpg', 'للمناسبات', 6);
