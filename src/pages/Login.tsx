import * as React from "react";
import { Truck, Lock, User, Phone, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "../components/AuthContext";
import { toast } from "sonner";
import { motion } from "motion/react";

export default function Login() {
  const { login } = useAuth();
  const [loading, setLoading] = React.useState(false);
  const [isAdmin, setIsAdmin] = React.useState(true);
  const [formData, setFormData] = React.useState({
    email: "",
    phone: "",
    password: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(isAdmin ? { email: formData.email, password: formData.password } : { phone: formData.phone, password: formData.password });
      toast.success("Тавтай морил!");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="flex flex-col items-center mb-8 gap-4">
          <div className="bg-blue-600 p-3 rounded-2xl shadow-xl shadow-blue-500/20">
            <Truck className="text-white" size={32} />
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Хүргэлт</h1>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Goo Agency Delivery System</p>
          </div>
        </div>

        <Card className="border-none shadow-2xl rounded-3xl overflow-hidden bg-white">
          <CardHeader className="space-y-1 pb-8 text-center pt-8 border-b border-slate-50">
            <CardTitle className="text-xl font-black uppercase text-slate-800">Системд нэвтрэх</CardTitle>
            <CardDescription className="text-slate-400 font-bold text-xs uppercase">Мэдээллээ оруулж нэвтэрнэ үү</CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            {/* Role Toggle */}
            <div className="flex bg-slate-100 p-1 rounded-xl mb-8 border border-slate-200/50">
              <button
                onClick={() => setIsAdmin(true)}
                className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${isAdmin ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
              >
                Администратор
              </button>
              <button
                onClick={() => setIsAdmin(false)}
                className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${!isAdmin ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
              >
                Хүргэгч
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <div className="relative">
                  {isAdmin ? (
                    <>
                      <User className="absolute left-3 top-3.5 text-slate-400" size={18} />
                      <Input
                        type="text"
                        placeholder="Админ нэр эсвэл и-мэйл"
                        required
                        className="pl-10 h-12 bg-slate-50 border-transparent rounded-xl focus-visible:ring-blue-500 transition-all font-bold placeholder:text-slate-400"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </>
                  ) : (
                    <>
                      <Phone className="absolute left-3 top-3.5 text-slate-400" size={18} />
                      <Input
                        type="text"
                        placeholder="Утасны дугаар"
                        required
                        className="pl-10 h-12 bg-slate-50 border-transparent rounded-xl focus-visible:ring-blue-500 transition-all font-bold placeholder:text-slate-400"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 text-slate-400" size={18} />
                  <Input
                    type="password"
                    placeholder="Нууц үг"
                    required
                    className="pl-10 h-12 bg-slate-50 border-transparent rounded-xl focus-visible:ring-blue-500 transition-all font-bold placeholder:text-slate-400"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 font-black uppercase text-xs tracking-widest mt-4"
                disabled={loading}
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : "Нэвтрэх"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center mt-8 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
          Goo Agency Delivery System
        </p>
      </motion.div>
    </div>
  );
}
