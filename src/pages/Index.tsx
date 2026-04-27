import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/types/product";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Phone, MapPin, Truck, Star, Plus, Minus, X, Instagram, Facebook, Music2, Settings, Loader2, MessageCircle, Copy, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";
import heroImage from "@/assets/hero-sweets.jpg";
import { openWhatsApp } from "@/lib/whatsapp";
import { resolveImg } from "@/lib/productImages";
import { useSiteContent } from "@/hooks/useSiteContent";

interface CartItem extends Product { quantity: number; }

const Index = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const { content } = useSiteContent();

  const orderOnWhatsApp = (p: Product) => {
    openWhatsApp(`السلام عليكم، أريد طلب: ${p.name} (${p.price} دج / ${p.unit})`, content.contact.whatsapp);
  };

  useEffect(() => {
    supabase.from("products").select("*").order("sort_order").then(({ data }) => {
      setProducts(data || []);
      setLoading(false);
    });
  }, []);

  const addToCart = (p: Product) => {
    setCart((prev) => {
      const ex = prev.find((i) => i.id === p.id);
      if (ex) return prev.map((i) => i.id === p.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { ...p, quantity: 1 }];
    });
    toast.success(`تمت إضافة ${p.name} إلى السلة`);
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) => prev.map((i) => i.id === id ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i).filter((i) => i.quantity > 0));
  };

  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  const checkout = () => {
    if (cart.length === 0) return;
    toast.success("تم استلام طلبك! سنتواصل معك قريباً");
    setCart([]);
    setCartOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b border-border">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-warm flex items-center justify-center text-primary-foreground font-bold text-xl">ح</div>
            <div>
              <h1 className="text-xl font-bold leading-none">حلويات تيبازة</h1>
              <p className="text-xs text-muted-foreground">حلويات جزائرية أصيلة</p>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#products" className="hover:text-primary transition-colors">المنتجات</a>
            <a href="#about" className="hover:text-primary transition-colors">من نحن</a>
            <a href="#contact" className="hover:text-primary transition-colors">اتصل بنا</a>
          </nav>
          <div className="flex gap-2">
            <Button asChild variant="ghost" size="icon" title="لوحة التحكم">
              <Link to="/admin"><Settings className="h-5 w-5" /></Link>
            </Button>
            <Button onClick={() => setCartOpen(true)} className="relative bg-primary hover:bg-primary/90">
              <ShoppingCart className="ml-2 h-5 w-5" />
              السلة
              {cartCount > 0 && <span className="absolute -top-2 -left-2 bg-accent text-accent-foreground rounded-full w-6 h-6 text-xs flex items-center justify-center font-bold">{cartCount}</span>}
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={content.hero.image_url || heroImage} alt="حلويات جزائرية تقليدية" className="w-full h-full object-cover" width={1536} height={1024} />
          <div className="absolute inset-0 bg-gradient-hero" />
        </div>
        <div className="container relative py-24 md:py-36 text-center">
          <Badge className="bg-accent text-accent-foreground mb-6 text-sm px-4 py-1">صنع يدوي بحب في تيبازة</Badge>
          <h2 className="text-4xl md:text-6xl font-bold text-primary-foreground mb-6 leading-tight animate-fade-up whitespace-pre-line">
            {content.hero.title}
          </h2>
          <p className="text-lg md:text-xl text-primary-foreground/90 max-w-2xl mx-auto mb-8 whitespace-pre-line">
            {content.hero.subtitle}
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button size="lg" asChild className="bg-background text-primary hover:bg-background/90 shadow-elegant text-lg px-8">
              <a href="#products">اطلب الآن</a>
            </Button>
            <Button size="lg" variant="outline" asChild className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary text-lg px-8">
              <a href="#about">تعرف علينا</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-secondary">
        <div className="container grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: Truck, title: "توصيل سريع", desc: "توصيل لكامل ولاية تيبازة" },
            { icon: Star, title: "جودة فاخرة", desc: "مكونات طبيعية 100%" },
            { icon: MapPin, title: "صناعة محلية", desc: "محضرة في قلب تيبازة" },
          ].map((f, i) => (
            <Card key={i} className="p-6 text-center bg-card border-0 shadow-card-soft hover:shadow-warm transition-all hover:-translate-y-1">
              <div className="w-14 h-14 rounded-full bg-gradient-warm flex items-center justify-center mx-auto mb-4">
                <f.icon className="h-7 w-7 text-primary-foreground" />
              </div>
              <h3 className="text-xl mb-2">{f.title}</h3>
              <p className="text-muted-foreground">{f.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Products */}
      <section id="products" className="py-20">
        <div className="container">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">قائمة المنتجات</Badge>
            <h2 className="text-4xl md:text-5xl mb-4">تشكيلتنا المميزة</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">اختر من بين تشكيلة واسعة من أشهى الحلويات الجزائرية التقليدية</p>
          </div>
          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
          ) : products.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">لا توجد منتجات حالياً</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((p) => (
                <Card key={p.id} className="overflow-hidden border-0 shadow-card-soft hover:shadow-elegant transition-all hover:-translate-y-2 bg-card group">
                  <div className="relative h-64 overflow-hidden">
                    <img src={resolveImg(p.image_url)} alt={p.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    {p.badge && <Badge className="absolute top-4 right-4 bg-accent text-accent-foreground">{p.badge}</Badge>}
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xl">{p.name}</h3>
                      <Badge variant="outline" className="text-xs">{p.category}</Badge>
                    </div>
                    <p className="text-muted-foreground text-sm mb-4 leading-relaxed">{p.description}</p>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <span className="text-2xl font-bold text-primary">{p.price.toLocaleString()}</span>
                        <span className="text-muted-foreground text-sm mr-1">دج / {p.unit}</span>
                      </div>
                      <Button onClick={() => addToCart(p)} size="sm" className="bg-primary hover:bg-primary/90">
                        <Plus className="h-4 w-4 ml-1" /> أضف
                      </Button>
                    </div>
                    <Button
                      onClick={() => orderOnWhatsApp(p)}
                      size="sm"
                      className="w-full bg-[#25D366] hover:bg-[#1ebe57] text-white"
                    >
                      <MessageCircle className="h-4 w-4 ml-1" fill="currentColor" />
                      اطلب عبر واتساب
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-20 bg-gradient-soft">
        <div className="container grid md:grid-cols-2 gap-12 items-center">
          <div>
            <Badge variant="secondary" className="mb-4">قصتنا</Badge>
            <h2 className="text-4xl md:text-5xl mb-6 whitespace-pre-line">{content.about.title}</h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-6 whitespace-pre-line">
              {content.about.body}
            </p>
            <div className="flex flex-wrap gap-3">
              {["عسل طبيعي", "لوز فاخر", "بدون مواد حافظة", "صنع يومي"].map((t) => (
                <Badge key={t} className="bg-accent/20 text-accent-foreground border border-accent px-4 py-1">{t}</Badge>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <img src={resolveImg("/src/assets/baklava.jpg")} alt="بقلاوة" loading="lazy" className="rounded-lg shadow-warm h-48 w-full object-cover" />
            <img src={resolveImg("/src/assets/makroud.jpg")} alt="مقروط" loading="lazy" className="rounded-lg shadow-warm h-48 w-full object-cover mt-8" />
            <img src={resolveImg("/src/assets/kalb-el-louz.jpg")} alt="قلب اللوز" loading="lazy" className="rounded-lg shadow-warm h-48 w-full object-cover" />
            <img src={resolveImg("/src/assets/samsa.jpg")} alt="سمسة" loading="lazy" className="rounded-lg shadow-warm h-48 w-full object-cover mt-8" />
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-20">
        <div className="container max-w-4xl">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">تواصل معنا</Badge>
            <h2 className="text-4xl md:text-5xl mb-4">اطلب أو استفسر</h2>
            <p className="text-muted-foreground">نحن في خدمتكم لجميع طلباتكم في كامل ولاية تيبازة</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6 text-center border-0 shadow-card-soft">
              <Phone className="h-8 w-8 text-primary mx-auto mb-3" />
              <h3 className="text-lg mb-2">الهاتف</h3>
              <p className="text-muted-foreground" dir="ltr">{content.contact.phone}</p>
            </Card>
            <Card className="p-6 text-center border-0 shadow-card-soft">
              <MessageCircle className="h-8 w-8 text-[#25D366] mx-auto mb-3" fill="currentColor" />
              <h3 className="text-lg mb-2">واتساب</h3>
              <p className="text-muted-foreground mb-3" dir="ltr">+{content.contact.whatsapp}</p>
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  const num = `+${content.contact.whatsapp}`;
                  try {
                    await navigator.clipboard.writeText(num);
                    toast.success("تم نسخ الرقم");
                  } catch {
                    const ta = document.createElement("textarea");
                    ta.value = num; document.body.appendChild(ta); ta.select();
                    try { document.execCommand("copy"); toast.success("تم نسخ الرقم"); }
                    catch { toast.error("تعذر النسخ"); }
                    document.body.removeChild(ta);
                  }
                }}
              >
                <Copy className="h-4 w-4 ml-1" /> نسخ الرقم
              </Button>
            </Card>
            <Card className="p-6 text-center border-0 shadow-card-soft">
              <MapPin className="h-8 w-8 text-primary mx-auto mb-3" />
              <h3 className="text-lg mb-2">العنوان</h3>
              <p className="text-muted-foreground whitespace-pre-line">{content.contact.address}</p>
            </Card>
            <Card className="p-6 text-center border-0 shadow-card-soft">
              <Truck className="h-8 w-8 text-primary mx-auto mb-3" />
              <h3 className="text-lg mb-2">التوصيل</h3>
              <p className="text-muted-foreground">كامل ولاية تيبازة</p>
            </Card>
          </div>
        </div>
      </section>

      <footer className="bg-foreground text-background py-12">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-warm flex items-center justify-center text-primary-foreground font-bold">ح</div>
              <div>
                <h3 className="text-lg">حلويات تيبازة</h3>
                <p className="text-sm opacity-70">حلويات جزائرية أصيلة</p>
              </div>
            </div>
            <div className="flex gap-4">
              {content.social.instagram && (
                <a href={content.social.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="w-10 h-10 rounded-full bg-background/10 hover:bg-primary flex items-center justify-center transition-colors"><Instagram className="h-5 w-5" /></a>
              )}
              {content.social.facebook && (
                <a href={content.social.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="w-10 h-10 rounded-full bg-background/10 hover:bg-primary flex items-center justify-center transition-colors"><Facebook className="h-5 w-5" /></a>
              )}
              {content.social.tiktok && (
                <a href={content.social.tiktok} target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="w-10 h-10 rounded-full bg-background/10 hover:bg-primary flex items-center justify-center transition-colors"><Music2 className="h-5 w-5" /></a>
              )}
              {(content.social.custom || []).map((link, i) => (
                <a
                  key={i}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={link.label}
                  title={link.label}
                  className="w-10 h-10 rounded-full bg-background/10 hover:bg-primary flex items-center justify-center transition-colors"
                >
                  <LinkIcon className="h-5 w-5" />
                </a>
              ))}
            </div>
            <p className="text-sm opacity-70">© 2026 حلويات تيبازة. جميع الحقوق محفوظة</p>
          </div>
        </div>
      </footer>

      {/* Cart Drawer */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-foreground/50 backdrop-blur-sm" onClick={() => setCartOpen(false)} />
          <div className="w-full max-w-md bg-background h-full flex flex-col shadow-elegant animate-fade-up">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h3 className="text-2xl">سلة التسوق</h3>
              <Button variant="ghost" size="icon" onClick={() => setCartOpen(false)}><X className="h-5 w-5" /></Button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {cart.length === 0 ? (
                <p className="text-center text-muted-foreground py-12">السلة فارغة</p>
              ) : cart.map((item) => (
                <div key={item.id} className="flex gap-3 bg-secondary rounded-lg p-3">
                  <img src={resolveImg(item.image_url)} alt={item.name} className="w-20 h-20 rounded object-cover" />
                  <div className="flex-1">
                    <h4 className="font-bold text-sm">{item.name}</h4>
                    <p className="text-primary font-bold text-sm mt-1">{(item.price * item.quantity).toLocaleString()} دج</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateQty(item.id, -1)}><Minus className="h-3 w-3" /></Button>
                      <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                      <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateQty(item.id, 1)}><Plus className="h-3 w-3" /></Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {cart.length > 0 && (
              <div className="border-t border-border p-6 space-y-4">
                <div className="flex justify-between text-lg">
                  <span className="font-bold">المجموع:</span>
                  <span className="font-bold text-primary text-2xl">{total.toLocaleString()} دج</span>
                </div>
                <Button onClick={checkout} className="w-full bg-primary hover:bg-primary/90 text-lg py-6">إتمام الطلب</Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
