import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface HeroContent { title: string; subtitle: string; image_url: string; }
export interface AboutContent { title: string; body: string; }
export interface ContactContent { phone: string; whatsapp: string; address: string; }
export interface CustomLink { label: string; url: string; icon?: string; }
export interface SocialContent {
  instagram: string;
  facebook: string;
  tiktok: string;
  custom?: CustomLink[];
}

export interface SiteContent {
  hero: HeroContent;
  about: AboutContent;
  contact: ContactContent;
  social: SocialContent;
}

const defaults: SiteContent = {
  hero: { title: "حلويات تيبازة الأصيلة", subtitle: "أجود أنواع الحلويات التقليدية والعصرية", image_url: "" },
  about: { title: "قصتنا", body: "منذ سنوات ونحن نقدم أشهى الحلويات التقليدية الجزائرية." },
  contact: { phone: "+213 555 000 000", whatsapp: "213555000000", address: "تيبازة، الجزائر" },
  social: { instagram: "", facebook: "", tiktok: "", custom: [] },
};

export const useSiteContent = () => {
  const [content, setContent] = useState<SiteContent>(defaults);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("site_content").select("section, data").then(({ data }) => {
      if (data) {
        const merged = { ...defaults };
        for (const row of data) {
          const section = row.section as keyof SiteContent;
          if (section in merged) {
            (merged as any)[section] = { ...(merged as any)[section], ...(row.data as any) };
          }
        }
        if (!Array.isArray(merged.social.custom)) merged.social.custom = [];
        setContent(merged);
      }
      setLoading(false);
    });
  }, []);

  return { content, loading };
};
