CREATE TABLE public.site_content (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section text NOT NULL UNIQUE,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view site content"
ON public.site_content FOR SELECT
USING (true);

CREATE POLICY "Admins can insert site content"
ON public.site_content FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can update site content"
ON public.site_content FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can delete site content"
ON public.site_content FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TRIGGER site_content_updated_at
BEFORE UPDATE ON public.site_content
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

INSERT INTO public.site_content (section, data) VALUES
  ('hero', '{"title":"حلويات تيبازة الأصيلة","subtitle":"أجود أنواع الحلويات التقليدية والعصرية، محضرة بحب وشغف","image_url":""}'::jsonb),
  ('about', '{"title":"قصتنا","body":"منذ سنوات ونحن نقدم أشهى الحلويات التقليدية الجزائرية بأجود المكونات."}'::jsonb),
  ('contact', '{"phone":"+213 555 000 000","whatsapp":"213555000000","address":"تيبازة، الجزائر"}'::jsonb);