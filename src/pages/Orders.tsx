import * as React from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Truck,
  MapPin,
  Calendar as CalendarIcon,
  DollarSign
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

export default function Orders() {
  const [orders, setOrders] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState({
    q: "",
    status: "all",
    paymentStatus: "all",
    date: undefined as Date | undefined
  });

  const fetchOrders = React.useCallback(async () => {
    setLoading(true);
    try {
      let url = "/api/orders?";
      if (filter.q) url += `q=${filter.q}&`;
      if (filter.status !== "all") url += `status=${filter.status}&`;
      if (filter.paymentStatus !== "all") url += `paymentStatus=${filter.paymentStatus}&`;
      
      const res = await fetch(url);
      const data = await res.json();
      setOrders(data);
    } catch (e) {
      toast.error("Мэдээлэл татахад алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  React.useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const updateStatus = async (id: number, field: string, value: string) => {
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      if (res.ok) {
        toast.success("Төлөв шинэчлэгдлээ");
        fetchOrders();
      }
    } catch (e) {
      toast.error("Алдаа гарлаа");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING": return <Badge variant="outline" className="bg-[#f1f5f9] text-[#64748b] border-none px-3 py-0.5 rounded-full text-[10px]">Хүлээгдэж буй</Badge>;
      case "ON_DELIVERY": return <Badge variant="outline" className="bg-[#fef9c3] text-[#854d0e] border-none px-3 py-0.5 rounded-full text-[10px]">Гарсан</Badge>;
      case "DELIVERED": return <Badge variant="outline" className="bg-[#dbeafe] text-[#1e40af] border-none px-3 py-0.5 rounded-full text-[10px]">Хүргэгдсэн</Badge>;
      case "CANCELLED": return <Badge variant="outline" className="bg-[#fee2e2] text-[#991b1b] border-none px-3 py-0.5 rounded-full text-[10px]">Цуцлагдсан</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case "PAID": return <Badge variant="outline" className="bg-[#dcfce7] text-[#166534] border-none px-3 py-0.5 rounded-full text-[10px]">Төлсөн</Badge>;
      case "UNPAID": return <Badge variant="outline" className="bg-[#fee2e2] text-[#991b1b] border-none px-3 py-0.5 rounded-full text-[10px]">Төлөөгүй</Badge>;
      case "PARTIAL": return <Badge variant="outline" className="bg-[#fef9c3] text-[#854d0e] border-none px-3 py-0.5 rounded-full text-[10px]">Хэсэгчлэн</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Захиалгууд</h1>
          <p className="text-sm text-slate-500 mt-1">Системд бүртгэлтэй нийт захиалгын жагсаалт.</p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" className="rounded-lg h-10 px-4" onClick={() => setFilter({ q: "", status: "all", paymentStatus: "UNPAID", date: undefined })}>
            <DollarSign size={16} className="mr-2" /> Төлөөгүй
          </Button>
          <Button variant="outline" className="rounded-lg h-10 px-4" onClick={() => fetchOrders()}>
            Шинэчлэх
          </Button>
        </div>
      </div>

      <Card className="border border-[var(--border)] shadow-sm overflow-hidden rounded-xl">
        <CardHeader className="bg-white border-b border-slate-100 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[300px]">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
              <Input 
                placeholder="Захиалга, утасны дугаараар хайх..." 
                className="pl-9 h-10 bg-[#f8fafc] border-slate-200 rounded-lg focus-visible:ring-1" 
                value={filter.q}
                onChange={(e) => setFilter({ ...filter, q: e.target.value })}
              />
            </div>

            <Select value={filter.status} onValueChange={(v) => setFilter({ ...filter, status: v })}>
              <SelectTrigger className="w-[160px] h-10 rounded-lg bg-[#f8fafc] border-slate-200">
                <SelectValue placeholder="Хүргэлт" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Бүх хүргэлт</SelectItem>
                <SelectItem value="PENDING">Хүлээгдэж буй</SelectItem>
                <SelectItem value="ON_DELIVERY">Хүргэлтэнд гарсан</SelectItem>
                <SelectItem value="DELIVERED">Хүргэгдсэн</SelectItem>
                <SelectItem value="CANCELLED">Цуцлагдсан</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filter.paymentStatus} onValueChange={(v) => setFilter({ ...filter, paymentStatus: v })}>
              <SelectTrigger className="w-[160px] h-10 rounded-lg bg-[#f8fafc] border-slate-200">
                <SelectValue placeholder="Төлбөр" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Бүх төлбөр</SelectItem>
                <SelectItem value="PAID">Төлсөн</SelectItem>
                <SelectItem value="UNPAID">Төлөөгүй</SelectItem>
                <SelectItem value="PARTIAL">Хэсэгчлэн</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-[#f8fafc]">
                <TableRow>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-400 h-10">№</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-400 h-10">Хэрэглэгч</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-400 h-10">Утас</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-400 h-10">Хаяг</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-400 h-10 text-right">Дүн</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-400 h-10">Төлбөр</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-400 h-10">Хүргэлт</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-400 h-10 text-center">Үйлдэл</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10 text-slate-400">Уншиж байна...</TableCell>
                  </TableRow>
                ) : orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10 text-slate-400">Захиалга олдсонгүй.</TableCell>
                  </TableRow>
                ) : orders.map((order) => (
                  <TableRow key={order.id} className="hover:bg-slate-50 transition-colors">
                    <TableCell className="font-mono text-[10px] font-bold text-slate-500">{order.orderNumber}</TableCell>
                    <TableCell className="font-semibold text-sm text-slate-800">{order.receiverName}</TableCell>
                    <TableCell className="text-xs text-slate-600">{order.phone}</TableCell>
                    <TableCell className="max-w-[180px] truncate text-xs text-slate-500">
                      <div className="flex flex-col">
                        <span>{order.district}, {order.khoroo}, {order.addressText}</span>
                        {order.latitude && order.longitude && (
                          <a 
                            href={`https://www.openstreetmap.org/?mlat=${order.latitude}&mlon=${order.longitude}#map=17/${order.latitude}/${order.longitude}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-[10px] text-blue-500 hover:underline flex items-center gap-1 mt-1"
                          >
                            <MapPin size={10} /> Байршил харах
                          </a>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-bold text-slate-900">{order.totalAmount.toLocaleString()}₮</TableCell>
                    <TableCell>
                      <Select 
                        value={order.paymentStatus || ""} 
                        onValueChange={(v) => updateStatus(order.id, "paymentStatus", v)}
                      >
                        <SelectTrigger className="border-none shadow-none bg-transparent hover:bg-slate-100 h-7 p-0 px-1 gap-1">
                          {getPaymentBadge(order.paymentStatus)}
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UNPAID">Төлөөгүй</SelectItem>
                          <SelectItem value="PAID">Төлсөн</SelectItem>
                          <SelectItem value="PARTIAL">Хэсэгчлэн</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select 
                        value={order.deliveryStatus || ""} 
                        onValueChange={(v) => updateStatus(order.id, "deliveryStatus", v)}
                      >
                        <SelectTrigger className="border-none shadow-none bg-transparent hover:bg-slate-100 h-7 p-0 px-1 gap-1">
                          {getStatusBadge(order.deliveryStatus)}
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PENDING">Хүлээгдэж буй</SelectItem>
                          <SelectItem value="ON_DELIVERY">Хүргэлтэнд гарсан</SelectItem>
                          <SelectItem value="DELIVERED">Хүргэгдсэн</SelectItem>
                          <SelectItem value="CANCELLED">Цуцлагдсан</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-slate-900">
                          <MoreHorizontal size={14} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
