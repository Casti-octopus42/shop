import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, ArrowRight } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/admin` },
        });
        if (error) throw error;
        toast.success("تم إنشاء الحساب بنجاح! يمكنك الدخول الآن.");
        setMode("signin");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("مرحباً بعودتك!");
        navigate("/admin");
      }
    } catch (err: any) {
      const msg = (err?.message || "").toLowerCase();
      let safe = "حدث خطأ، يرجى المحاولة مرة أخرى.";
      if (msg.includes("invalid login")) safe = "بيانات الدخول غير صحيحة.";
      else if (msg.includes("already registered") || msg.includes("user already")) safe = "إذا كان البريد مسجلاً، يمكنك تسجيل الدخول مباشرة.";
      else if (msg.includes("password")) safe = "كلمة المرور لا تستوفي الشروط.";
      toast.error(safe);
      console.error("Auth error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-soft p-4">
      <Card className="w-full max-w-md p-8 shadow-elegant border-0">
        <Link to="/" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 mb-6">
          <ArrowRight className="h-4 w-4" /> العودة للمتجر
        </Link>
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-full bg-gradient-warm flex items-center justify-center text-primary-foreground font-bold text-2xl mx-auto mb-4">ح</div>
          <h1 className="text-3xl mb-2">{mode === "signin" ? "تسجيل الدخول" : "إنشاء حساب"}</h1>
          <p className="text-muted-foreground text-sm">لوحة تحكم صاحب المتجر</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} dir="ltr" />
          </div>
          <div>
            <Label htmlFor="password">كلمة المرور</Label>
            <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} dir="ltr" />
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary/90">
            {loading && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
            {mode === "signin" ? "دخول" : "إنشاء"}
          </Button>
        </form>
        <p className="text-center text-sm text-muted-foreground mt-6">
          {mode === "signin" ? "ليس لديك حساب؟" : "لديك حساب؟"}{" "}
          <button onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="text-primary font-bold hover:underline">
            {mode === "signin" ? "إنشاء حساب" : "تسجيل الدخول"}
          </button>
        </p>
      </Card>
    </div>
  );
};

export default Auth;
