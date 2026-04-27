import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import type { CustomLink } from "@/hooks/useSiteContent";

type Section = "hero" | "about" | "contact" | "social";

interface Row { section: Section; data: Record<string, any>; }

// Validate https URL; optionally enforce a host substring (e.g. "instagram.com")
const isValidUrl = (value: string, hostMustInclude?: string): boolean => {
  if (!value) return true; // empty is allowed (means "not set")
  try {
    const u = new URL(value);
    if (u.protocol !== "https:") return false;
    if (hostMustInclude && !u.hostname.toLowerCase().includes(hostMustInclude)) return false;
    return true;
  } catch {
    return false;
  }
};

const SiteContentEditor = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<Record<Section, Record<string, any>>>({
    hero: { title: "", subtitle: "", image_url: "" },
    about: { title: "", body: "" },
    contact: { phone: "", whatsapp: "", address: "" },
    social: { instagram: "", facebook: "", tiktok: "", custom: [] as CustomLink[] },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Section | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    supabase.from("site_content").select("section, data").then(({ data }) => {
      if (data) {
        const next = { ...rows };
        for (const r of data as Row[]) {
          if (r.section in next) next[r.section] = { ...next[r.section], ...r.data };
        }
        if (!Array.isArray(next.social.custom)) next.social.custom = [];
        setRows(next);
      }
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = (section: Section, key: string, value: any) => {
    setRows((prev) => ({ ...prev, [section]: { ...prev[section], [key]: value } }));
  };

  const updateCustom = (idx: number, key: keyof CustomLink, value: string) => {
    const list: CustomLink[] = [...(rows.social.custom || [])];
    list[idx] = { ...list[idx], [key]: value };
    update("social", "custom", list);
  };
  const addCustom = () => {
    const list: CustomLink[] = [...(rows.social.custom || []), { label: "", url: "" }];
    update("social", "custom", list);
  };
  const removeCustom = (idx: number) => {
    const list: CustomLink[] = [...(rows.social.custom || [])];
    list.splice(idx, 1);
    update("social", "custom", list);
  };

  const save = async (section: Section) => {
    // Validate social URLs before saving
    if (section === "social") {
      const checks: Array<[string, string, string]> = [
        ["instagram", rows.social.instagram, "instagram.com"],
        ["facebook", rows.social.facebook, "facebook.com"],
        ["tiktok", rows.social.tiktok, "tiktok.com"],
      ];
      for (const [name, val, host] of checks) {
        if (val && !isValidUrl(val, host)) {
          toast.error(`رابط ${name} غير صالح. يجب أن يبدأ بـ https:// ويحتوي ${host}`);
          return;
        }
      }
      const customs: CustomLink[] = rows.social.custom || [];
      for (const link of customs) {
        if (!link.label?.trim() || !link.url?.trim()) {
          toast.error("يرجى ملء الاسم والرابط لكل عنصر مخصص");
          return;
        }
        if (!isValidUrl(link.url)) {
          toast.error(`رابط "${link.label}" غير صالح. يجب أن يبدأ بـ https://`);
          return;
        }
      }
    }

    setSaving(section);
    const { error } = await supabase
      .from("site_content")
      .upsert({ section, data: rows[section] }, { onConflict: "section" });
    if (error) toast.error("فشل الحفظ: " + error.message);
    else toast.success("تم الحفظ");
    setSaving(null);
  };

  const uploadHeroImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/hero-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("product-images").upload(path, file);
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("product-images").getPublicUrl(path);
      update("hero", "image_url", data.publicUrl);
      toast.success("تم رفع الصورة");
    } catch (err: any) {
      toast.error("فشل الرفع: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const customLinks: CustomLink[] = rows.social.custom || [];

  return (
    <div className="space-y-6">
      {/* Hero */}
      <Card className="p-6 border-0 shadow-card-soft">
        <h3 className="text-xl mb-4 font-bold">قسم الواجهة (Hero)</h3>
        <div className="space-y-4">
          <div>
            <Label>العنوان الرئيسي</Label>
            <Textarea rows={2} value={rows.hero.title} onChange={(e) => update("hero", "title", e.target.value)} />
          </div>
          <div>
            <Label>العنوان الفرعي</Label>
            <Textarea rows={3} value={rows.hero.subtitle} onChange={(e) => update("hero", "subtitle", e.target.value)} />
          </div>
          <div>
            <Label>صورة الخلفية</Label>
            {rows.hero.image_url && (
              <img src={rows.hero.image_url} alt="" className="w-full h-40 object-cover rounded-md mb-2" />
            )}
            <div className="flex items-center gap-2">
              <Input type="file" accept="image/*" onChange={uploadHeroImage} disabled={uploading} className="text-xs" />
              {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
            </div>
            {rows.hero.image_url && (
              <Button variant="outline" size="sm" className="mt-2" onClick={() => update("hero", "image_url", "")}>
                استخدام الصورة الافتراضية
              </Button>
            )}
          </div>
          <Button onClick={() => save("hero")} disabled={saving === "hero"} className="bg-primary hover:bg-primary/90">
            {saving === "hero" && <Loader2 className="h-4 w-4 animate-spin ml-2" />} حفظ
          </Button>
        </div>
      </Card>

      {/* About */}
      <Card className="p-6 border-0 shadow-card-soft">
        <h3 className="text-xl mb-4 font-bold">قسم "من نحن"</h3>
        <div className="space-y-4">
          <div>
            <Label>العنوان</Label>
            <Input value={rows.about.title} onChange={(e) => update("about", "title", e.target.value)} />
          </div>
          <div>
            <Label>النص</Label>
            <Textarea rows={6} value={rows.about.body} onChange={(e) => update("about", "body", e.target.value)} />
          </div>
          <Button onClick={() => save("about")} disabled={saving === "about"} className="bg-primary hover:bg-primary/90">
            {saving === "about" && <Loader2 className="h-4 w-4 animate-spin ml-2" />} حفظ
          </Button>
        </div>
      </Card>

      {/* Contact */}
      <Card className="p-6 border-0 shadow-card-soft">
        <h3 className="text-xl mb-4 font-bold">معلومات الاتصال</h3>
        <div className="space-y-4">
          <div>
            <Label>الهاتف</Label>
            <Input dir="ltr" value={rows.contact.phone} onChange={(e) => update("contact", "phone", e.target.value)} placeholder="+213 555 12 34 56" />
          </div>
          <div>
            <Label>واتساب (أرقام فقط، مع رمز الدولة)</Label>
            <Input dir="ltr" value={rows.contact.whatsapp} onChange={(e) => update("contact", "whatsapp", e.target.value)} placeholder="213555123456" />
          </div>
          <div>
            <Label>العنوان</Label>
            <Textarea rows={2} value={rows.contact.address} onChange={(e) => update("contact", "address", e.target.value)} />
          </div>
          <Button onClick={() => save("contact")} disabled={saving === "contact"} className="bg-primary hover:bg-primary/90">
            {saving === "contact" && <Loader2 className="h-4 w-4 animate-spin ml-2" />} حفظ
          </Button>
        </div>
      </Card>

      {/* Social */}
      <Card className="p-6 border-0 shadow-card-soft">
        <h3 className="text-xl mb-4 font-bold">روابط وسائل التواصل الاجتماعي</h3>
        <p className="text-xs text-muted-foreground mb-4">يجب أن تبدأ كل الروابط بـ https://</p>
        <div className="space-y-4">
          <div>
            <Label>رابط Instagram</Label>
            <Input dir="ltr" value={rows.social.instagram} onChange={(e) => update("social", "instagram", e.target.value)} placeholder="https://instagram.com/username" />
          </div>
          <div>
            <Label>رابط Facebook</Label>
            <Input dir="ltr" value={rows.social.facebook} onChange={(e) => update("social", "facebook", e.target.value)} placeholder="https://facebook.com/page" />
          </div>
          <div>
            <Label>رابط TikTok</Label>
            <Input dir="ltr" value={rows.social.tiktok} onChange={(e) => update("social", "tiktok", e.target.value)} placeholder="https://tiktok.com/@username" />
          </div>

          <div className="pt-4 border-t border-border">
            <div className="flex items-center justify-between mb-3">
              <Label className="text-base">روابط إضافية (YouTube، Google Maps، …)</Label>
              <Button type="button" variant="outline" size="sm" onClick={addCustom}>
                <Plus className="h-4 w-4 ml-1" /> إضافة رابط
              </Button>
            </div>
            {customLinks.length === 0 && (
              <p className="text-sm text-muted-foreground">لا توجد روابط إضافية بعد.</p>
            )}
            <div className="space-y-3">
              {customLinks.map((link, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-[1fr_2fr_auto] gap-2 items-end">
                  <div>
                    <Label className="text-xs">الاسم</Label>
                    <Input
                      value={link.label}
                      onChange={(e) => updateCustom(idx, "label", e.target.value)}
                      placeholder="YouTube"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">الرابط</Label>
                    <Input
                      dir="ltr"
                      value={link.url}
                      onChange={(e) => updateCustom(idx, "url", e.target.value)}
                      placeholder="https://youtube.com/@channel"
                    />
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeCustom(idx)} aria-label="حذف">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <Button onClick={() => save("social")} disabled={saving === "social"} className="bg-primary hover:bg-primary/90">
            {saving === "social" && <Loader2 className="h-4 w-4 animate-spin ml-2" />} حفظ
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default SiteContentEditor;
