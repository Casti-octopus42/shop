import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Product } from "@/types/product";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, LogOut, Loader2, Upload, ArrowRight, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { resolveImg } from "@/lib/productImages";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SiteContentEditor from "@/components/admin/SiteContentEditor";

const empty = { name: "", description: "", price: 0, unit: "كغ", category: "تقليدية", image_url: "", badge: "", sort_order: 0 };

const Admin = () => {
  const navigate = useNavigate();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [becomingAdmin, setBecomingAdmin] = useState(false);
  const [adminKey, setAdminKey] = useState("");

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  const loadProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("products").select("*").order("sort_order");
    if (error) toast.error("فشل تحميل المنتجات");
    else setProducts(data || []);
    setLoading(false);
  };

  useEffect(() => {
    if (user) loadProducts();
  }, [user]);

  const becomeAdminWithKey = async () => {
    if (!user) return;
    if (!adminKey || adminKey.length < 8) {
      toast.error("الرجاء إدخال مفتاح المدير");
      return;
    }
    setBecomingAdmin(true);
    const { error } = await supabase.rpc("claim_admin_with_key", { _key: adminKey });
    if (error) toast.error("فشل: " + error.message);
    else {
      toast.success("تم تعيينك كمدير للمتجر! إعادة تحميل...");
      setTimeout(() => window.location.reload(), 1500);
    }
    setBecomingAdmin(false);
  };

  const openCreate = () => {
    setEditing(null);
    setForm(empty);
    setDialogOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      name: p.name, description: p.description, price: p.price, unit: p.unit,
      category: p.category, image_url: p.image_url, badge: p.badge || "", sort_order: p.sort_order,
    });
    setDialogOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user!.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("product-images").upload(path, file);
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("product-images").getPublicUrl(path);
      setForm({ ...form, image_url: data.publicUrl });
      toast.success("تم رفع الصورة");
    } catch (err: any) {
      toast.error("فشل رفع الصورة: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.name || !form.image_url) {
      toast.error("الاسم والصورة مطلوبان");
      return;
    }
    setSaving(true);
    const payload = { ...form, badge: form.badge || null, price: Number(form.price), sort_order: Number(form.sort_order) };
    const { error } = editing
      ? await supabase.from("products").update(payload).eq("id", editing.id)
      : await supabase.from("products").insert(payload);
    if (error) toast.error("فشل: " + error.message);
    else {
      toast.success(editing ? "تم التحديث" : "تمت الإضافة");
      setDialogOpen(false);
      loadProducts();
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("products").delete().eq("id", deleteId);
    if (error) toast.error("فشل الحذف");
    else { toast.success("تم الحذف"); loadProducts(); }
    setDeleteId(null);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-soft p-4">
        <Card className="max-w-md w-full p-8 text-center border-0 shadow-elegant">
          <h2 className="text-2xl mb-4">صلاحية الإدارة</h2>
          <p className="text-muted-foreground mb-6 text-sm">
            أدخل مفتاح المدير السري لتفعيل صلاحياتك. هذا المفتاح يُسلَّم لمالك المتجر فقط.
          </p>
          <Input
            type="password"
            placeholder="مفتاح المدير"
            value={adminKey}
            onChange={(e) => setAdminKey(e.target.value)}
            className="mb-3 text-center"
            dir="ltr"
          />
          <Button onClick={becomeAdminWithKey} disabled={becomingAdmin} className="w-full bg-primary hover:bg-primary/90 mb-3">
            {becomingAdmin && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
            تفعيل صلاحيات المدير
          </Button>
          <Button variant="outline" onClick={signOut} className="w-full">تسجيل الخروج</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-muted-foreground hover:text-primary"><ArrowRight className="h-5 w-5" /></Link>
            <div>
              <h1 className="text-xl">لوحة التحكم</h1>
              <p className="text-xs text-muted-foreground">إدارة منتجات المتجر</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={signOut}><LogOut className="h-4 w-4" /></Button>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <Tabs defaultValue="products" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="products">المنتجات</TabsTrigger>
            <TabsTrigger value="content">محتوى الموقع</TabsTrigger>
          </TabsList>

          <TabsContent value="products">
            <div className="flex justify-end mb-4">
              <Button onClick={openCreate} className="bg-primary hover:bg-primary/90"><Plus className="h-4 w-4 ml-1" /> منتج جديد</Button>
            </div>
            {loading ? (
              <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((p) => (
                  <Card key={p.id} className="overflow-hidden border-0 shadow-card-soft">
                    <div className="h-48 bg-muted relative">
                      {p.image_url ? (
                        <img src={resolveImg(p.image_url)} alt={p.name} className="w-full h-full object-cover" />
                      ) : <div className="flex items-center justify-center h-full text-muted-foreground"><ImageIcon className="h-10 w-10" /></div>}
                      {p.badge && <Badge className="absolute top-2 right-2 bg-accent text-accent-foreground">{p.badge}</Badge>}
                    </div>
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold">{p.name}</h3>
                        <Badge variant="outline" className="text-xs">{p.category}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{p.description}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-primary font-bold">{p.price.toLocaleString()} دج / {p.unit}</span>
                        <div className="flex gap-1">
                          <Button size="icon" variant="outline" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                          <Button size="icon" variant="outline" onClick={() => setDeleteId(p.id)} className="text-destructive hover:bg-destructive hover:text-destructive-foreground"><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
                {products.length === 0 && (
                  <div className="col-span-full text-center py-20 text-muted-foreground">لا توجد منتجات بعد. ابدأ بإضافة منتج جديد!</div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="content">
            <SiteContentEditor />
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "تعديل المنتج" : "منتج جديد"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>صورة المنتج *</Label>
              {form.image_url && <img src={resolveImg(form.image_url)} alt="" className="w-full h-40 object-cover rounded-md mb-2" />}
              <div className="flex items-center gap-2">
                <Input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} className="text-xs" />
                {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
              </div>
            </div>
            <div>
              <Label>الاسم *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>الوصف</Label>
              <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>السعر (دج)</Label>
                <Input type="number" min={0} value={form.price} onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} />
              </div>
              <div>
                <Label>الوحدة</Label>
                <Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="كغ، صينية..." />
              </div>
              <div>
                <Label>الفئة</Label>
                <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
              </div>
              <div>
                <Label>الترتيب</Label>
                <Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} />
              </div>
            </div>
            <div>
              <Label>شارة (اختياري)</Label>
              <Input value={form.badge} onChange={(e) => setForm({ ...form, badge: e.target.value })} placeholder="جديد، الأكثر مبيعاً..." />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>إلغاء</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary/90">
              {saving && <Loader2 className="h-4 w-4 animate-spin ml-2" />} حفظ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>هل أنت متأكد من حذف هذا المنتج؟ لا يمكن التراجع.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Admin;
