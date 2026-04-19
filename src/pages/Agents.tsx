import * as React from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Users, Phone, Package, Plus } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function Agents() {
  const [agents, setAgents] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [open, setOpen] = React.useState(false);

  const fetchAgents = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/agents");
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text.slice(0, 50)}`);
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        setAgents(data);
      } else {
        console.error("Agents fetch non-array:", data);
        setAgents([]);
      }
    } catch (e) {
      console.error("Fetch agents error:", e);
      toast.error(`Мэдээлэл татахад алдаа гарлаа: ${e instanceof Error ? e.message : ""}`);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  const addAgent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        toast.success("Хүргэгч амжилттай бүртгэгдлээ");
        setOpen(false);
        fetchAgents();
      } else {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const err = await res.json();
          toast.error(`Алдаа гарлаа: ${err.error || "Үл мэдэгдэх алдаа"}`);
        } else {
          const text = await res.text();
          console.error("Non-JSON error response:", text);
          toast.error(`Серверийн алдаа (${res.status}): ${text.slice(0, 50)}...`);
        }
      }
    } catch (e) {
      console.error("Fetch catch error:", e);
      toast.error(`Сүлжээний алдаа гарлаа: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-3xl font-black text-slate-900 tracking-tighter uppercase">Хүргэгч нар</h1>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Системийн бүх хүргэгчдийн жагсаалт ба эрх</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger
            render={
              <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-11 shadow-lg shadow-blue-500/20 px-6 font-black uppercase text-xs tracking-widest">
                <Plus size={18} className="mr-2" /> Хүргэгч нэмэх
              </Button>
            }
          />
          <DialogContent className="rounded-3xl border-none shadow-2xl p-0 overflow-hidden max-w-md">
            <DialogHeader className="p-6 bg-slate-900 text-white">
              <DialogTitle className="text-xl font-black uppercase tracking-tight">Шинэ хүргэгч бүртгэх</DialogTitle>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Системд нэвтрэх эрх үүсгэх</p>
            </DialogHeader>
            <form onSubmit={addAgent} className="p-6 space-y-5 bg-white">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Бүтэн нэр</Label>
                <Input name="name" required placeholder="Жишээ: Бат-Эрдэнэ" className="h-12 bg-slate-50 border-transparent rounded-xl focus-visible:ring-blue-500 font-bold" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Утасны дугаар (Нэвтрэх нэр)</Label>
                <Input name="phone" required placeholder="8899XXXX" className="h-12 bg-slate-50 border-transparent rounded-xl focus-visible:ring-blue-500 font-bold" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Нууц үг</Label>
                <Input name="password" required type="password" placeholder="******" defaultValue="123456" className="h-12 bg-slate-50 border-transparent rounded-xl focus-visible:ring-blue-500 font-bold" />
              </div>
              <Button type="submit" className="w-full bg-blue-600 h-12 rounded-xl font-black uppercase text-xs tracking-widest shadow-lg shadow-blue-600/20 mt-2">Хадгалах</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border border-slate-200/60 shadow-sm overflow-hidden rounded-2xl bg-white">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 h-12 pl-6">Хүргэгч</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 h-12">Холбоо барих</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 h-12">Төлөв</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 h-12 text-right pr-6">Гүйцэтгэл</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-20">
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-8 w-8 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Уншиж байна...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : agents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-20 text-slate-400 font-bold text-xs uppercase tracking-widest">Хүргэгч байхгүй байна.</TableCell>
                </TableRow>
              ) : agents.map((agent) => (
                <TableRow key={agent.id} className="hover:bg-slate-50/50 transition-colors group">
                  <TableCell className="pl-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white font-black text-xs shadow-lg shadow-slate-900/10">
                        {agent.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-black text-slate-900 text-sm tracking-tight">{agent.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Agent ID: #{agent.id}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                      <Phone size={14} className="text-slate-300" />
                      {agent.phone}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn(
                      "border-none px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest",
                      agent.status === "active" ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"
                    )}>
                      {agent.status === "active" ? "Идэвхитэй" : "Идэвхигүй"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <div className="inline-flex items-center gap-2 font-black px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-slate-900 text-xs">
                      <Package size={14} className="text-blue-500" />
                      {agent._count.orders}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
