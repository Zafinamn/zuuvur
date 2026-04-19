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
          <h1 className="text-xl lg:text-2xl font-bold text-slate-900 tracking-tight">Хүргэгч нар</h1>
          <p className="text-xs lg:text-sm text-slate-500 mt-1">Системийн бүх хүргэгчдийн жагсаалт.</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger
            render={
              <Button className="bg-[#2563eb] hover:bg-[#1e40af] rounded-lg h-10 shadow-lg shadow-blue-500/20 px-5 w-full sm:w-auto">
                <Plus size={18} className="mr-2" /> Хүргэгч нэмэх
              </Button>
            }
          />
          <DialogContent className="rounded-xl border border-[var(--border)]">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Шинэ хүргэгч бүртгэх</DialogTitle>
            </DialogHeader>
            <form onSubmit={addAgent} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Хүргэгчийн нэр</Label>
                <Input name="name" required placeholder="Нэр" className="h-10 bg-[#f8fafc] border-slate-200" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Утасны дугаар</Label>
                <Input name="phone" required placeholder="Утас" className="h-10 bg-[#f8fafc] border-slate-200" />
              </div>
              <Button type="submit" className="w-full bg-[#2563eb] h-11 rounded-lg font-bold shadow-lg shadow-blue-500/10">Хадгалах</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border border-[var(--border)] shadow-sm overflow-hidden rounded-xl">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-[#f8fafc]">
              <TableRow>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-400 h-10">Нэр</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-400 h-10">Утас</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-400 h-10">Төлөв</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-400 h-10 text-right">Хүргэсэн тоо</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-10">Уншиж байна...</TableCell>
                </TableRow>
              ) : agents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-10 text-slate-400">Хүргэгч байхгүй байна.</TableCell>
                </TableRow>
              ) : agents.map((agent) => (
                <TableRow key={agent.id} className="hover:bg-slate-50 transition-colors">
                  <TableCell className="font-semibold text-sm text-slate-800 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                      <Users size={14} />
                    </div>
                    {agent.name}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Phone size={12} className="text-slate-300" />
                      {agent.phone}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={agent.status === "active" ? "bg-[#dcfce7] text-[#166534] border-none px-3 py-0.5 rounded-full text-[10px]" : "bg-slate-100 text-slate-500 border-none px-3 py-0.5 rounded-full text-[10px]"}>
                      {agent.status === "active" ? "Идэвхитэй" : "Идэвхигүй"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex items-center gap-2 font-bold px-3 py-1 bg-[#f1f5f9] rounded-lg text-slate-600 text-xs">
                      <Package size={12} className="text-slate-400" />
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
