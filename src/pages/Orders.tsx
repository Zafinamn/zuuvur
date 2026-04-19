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
import { useAuth } from "../components/AuthContext";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
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
  DollarSign,
  Pencil,
  Trash2
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import NewOrder from "./NewOrder";

export default function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [editingOrder, setEditingOrder] = React.useState<any | null>(null);
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
      
      if (user?.role === 'agent') {
        url += `agentId=${user.id}&`;
      }
      
      const res = await fetch(url);
      const data = await res.json();
      if (Array.isArray(data)) {
        setOrders(data);
      } else {
        console.error("Orders fetch non-array:", data);
        setOrders([]);
        if (data.error) toast.error(`Алдаа: ${data.error}`);
      }
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

  const deleteOrder = async (id: number) => {
    if (!confirm("Та энэ захиалгыг устгахдаа итгэлтэй байна уу?")) return;
    
    try {
      const res = await fetch(`/api/orders/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Захиалга устгагдлаа");
        fetchOrders();
      } else {
        toast.error("Устгахад алдаа гарлаа");
      }
    } catch (e) {
      toast.error("Сүлжээний алдаа");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING": return <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200/50 px-3 py-1 rounded-lg text-[10px] font-black uppercase">Хүлээгдэж буй</Badge>;
      case "ON_DELIVERY": return <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200/50 px-3 py-1 rounded-lg text-[10px] font-black uppercase">Замдаа яваа</Badge>;
      case "DELIVERED": return <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200/50 px-3 py-1 rounded-lg text-[10px] font-black uppercase">Хүргэгдсэн</Badge>;
      case "CANCELLED": return <Badge variant="outline" className="bg-slate-50 text-slate-400 border-slate-200/50 px-3 py-1 rounded-lg text-[10px] font-black uppercase">Цуцлагдсан</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case "PAID": return <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200/50 px-3 py-1 rounded-lg text-[10px] font-black uppercase">Төлсөн</Badge>;
      case "UNPAID": return <Badge variant="outline" className="bg-rose-50 text-rose-600 border-rose-200/50 px-3 py-1 rounded-lg text-[10px] font-black uppercase">Төлөөгүй</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const summary = React.useMemo(() => {
    return {
      pending: orders.filter(o => o.deliveryStatus === 'PENDING').length,
      onDelivery: orders.filter(o => o.deliveryStatus === 'ON_DELIVERY').length,
      unpaid: orders.filter(o => o.paymentStatus === 'UNPAID').length,
    };
  }, [orders]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-3xl font-black text-slate-900 tracking-tighter uppercase">Захиалгууд</h1>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Системд бүртгэлтэй нийт захиалгын хяналт</p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="rounded-xl h-10 px-4 border-slate-200 hover:bg-slate-50 font-bold text-xs" onClick={() => fetchOrders()}>
            Шинэчлэх
          </Button>
        </div>
      </div>

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button 
          onClick={() => setFilter({ ...filter, status: 'PENDING', paymentStatus: 'all' })}
          className={cn(
            "p-4 rounded-2xl border transition-all text-left group",
            filter.status === 'PENDING' ? "bg-amber-50 border-amber-200" : "bg-white border-slate-100 hover:border-amber-200"
          )}
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Хүлээгдэж буй</p>
              <h3 className="text-xl font-black text-slate-900">{summary.pending}</h3>
            </div>
          </div>
        </button>

        <button 
          onClick={() => setFilter({ ...filter, status: 'ON_DELIVERY', paymentStatus: 'all' })}
          className={cn(
            "p-4 rounded-2xl border transition-all text-left",
            filter.status === 'ON_DELIVERY' ? "bg-blue-50 border-blue-200" : "bg-white border-slate-100 hover:border-blue-200"
          )}
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
              <Truck size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Замдаа яваа</p>
              <h3 className="text-xl font-black text-slate-900">{summary.onDelivery}</h3>
            </div>
          </div>
        </button>

        <button 
          onClick={() => setFilter({ ...filter, paymentStatus: 'UNPAID', status: 'all' })}
          className={cn(
            "p-4 rounded-2xl border transition-all text-left",
            filter.paymentStatus === 'UNPAID' ? "bg-rose-50 border-rose-200" : "bg-white border-slate-100 hover:border-rose-200"
          )}
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600">
              <DollarSign size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Төлөөгүй</p>
              <h3 className="text-xl font-black text-slate-900">{summary.unpaid}</h3>
            </div>
          </div>
        </button>
      </div>

      <Card className="border border-slate-200/60 shadow-sm overflow-hidden rounded-2xl bg-white">
        <CardHeader className="bg-white border-b border-slate-50 p-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 text-slate-400" size={16} />
              <Input 
                placeholder="Нэр, утас, дугаараар хайх..." 
                className="pl-10 h-11 bg-slate-50 border-transparent rounded-xl focus-visible:ring-1 transition-all" 
                value={filter.q}
                onChange={(e) => setFilter({ ...filter, q: e.target.value })}
              />
            </div>

            <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-100">
              {[
                { id: 'all', label: 'Бүгд' },
                { id: 'PENDING', label: 'Хүлээгдэх' },
                { id: 'ON_DELIVERY', label: 'Замдаа' },
                { id: 'DELIVERED', label: 'Хүргэгдсэн' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilter({ ...filter, status: tab.id })}
                  className={cn(
                    "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all",
                    filter.status === tab.id 
                      ? "bg-white text-blue-600 shadow-sm" 
                      : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <Select value={filter.paymentStatus} onValueChange={(v) => setFilter({ ...filter, paymentStatus: v })}>
              <SelectTrigger className="w-full lg:w-[140px] h-11 rounded-xl bg-slate-50 border-transparent font-bold text-xs">
                <SelectValue placeholder="Төлбөр" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                <SelectItem value="all" className="text-xs font-bold">Бүх төлбөр</SelectItem>
                <SelectItem value="PAID" className="text-xs font-bold text-emerald-600">Төлсөн</SelectItem>
                <SelectItem value="UNPAID" className="text-xs font-bold text-rose-600">Төлөөгүй</SelectItem>
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
                ) : orders.map((order, i) => (
                  <TableRow 
                    key={order.id} 
                    className="hover:bg-slate-900 group transition-all duration-200 cursor-default"
                  >
                    <TableCell className="font-mono text-[10px] font-bold text-slate-500 group-hover:text-blue-400 transition-colors uppercase tracking-widest">{order.orderNumber}</TableCell>
                    <TableCell className="font-bold text-[13px] text-slate-800 group-hover:text-white transition-colors tracking-tight">{order.receiverName}</TableCell>
                    <TableCell className="text-xs font-medium text-slate-600 group-hover:text-slate-300 transition-colors">{order.phone}</TableCell>
                    <TableCell className="max-w-[180px] truncate text-[11px] font-medium text-slate-500 group-hover:text-slate-400 transition-colors">
                      <div className="flex flex-col">
                        <span className="truncate">{order.district}, {order.khoroo}, {order.addressText}</span>
                        {order.latitude && order.longitude && (
                          <a 
                            href={`https://www.openstreetmap.org/?mlat=${order.latitude}&mlon=${order.longitude}#map=17/${order.latitude}/${order.longitude}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-[10px] text-blue-500 group-hover:text-blue-400 font-black hover:underline flex items-center gap-1 mt-1 transition-colors uppercase"
                          >
                            <MapPin size={10} /> Байршил
                          </a>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-black text-slate-900 group-hover:text-white transition-colors">{order.totalAmount.toLocaleString()}₮</TableCell>
                    <TableCell>
                      <Select 
                        value={order.paymentStatus || ""} 
                        onValueChange={(v) => updateStatus(order.id, "paymentStatus", v)}
                      >
                        <SelectTrigger className="border-none shadow-none bg-transparent hover:bg-white/10 group-hover:text-white h-7 p-0 px-1 gap-1 transition-colors">
                          {getPaymentBadge(order.paymentStatus)}
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                          <SelectItem value="UNPAID">Төлөөгүй</SelectItem>
                          <SelectItem value="PAID">Төлсөн</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select 
                        value={order.deliveryStatus || ""} 
                        onValueChange={(v) => updateStatus(order.id, "deliveryStatus", v)}
                      >
                        <SelectTrigger className="border-none shadow-none bg-transparent hover:bg-white/10 group-hover:text-white h-7 p-0 px-1 gap-1 transition-colors">
                          {getStatusBadge(order.deliveryStatus)}
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                          <SelectItem value="PENDING">Хүлээгдэж буй</SelectItem>
                          <SelectItem value="ON_DELIVERY">Хүргэлтэнд гарсан</SelectItem>
                          <SelectItem value="DELIVERED">Хүргэгдсэн</SelectItem>
                          <SelectItem value="CANCELLED">Цуцлагдсан</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {order.deliveryStatus === 'PENDING' && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-amber-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg"
                            onClick={() => updateStatus(order.id, "deliveryStatus", "ON_DELIVERY")}
                            title="Хүргэлтэнд гаргах"
                          >
                            <Truck size={14} />
                          </Button>
                        )}
                        {order.deliveryStatus === 'ON_DELIVERY' && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                            onClick={() => updateStatus(order.id, "deliveryStatus", "DELIVERED")}
                            title="Хүргэгдсэн гэж тэмдэглэх"
                          >
                            <CheckCircle2 size={14} />
                          </Button>
                        )}
                        {order.paymentStatus === 'UNPAID' && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg"
                            onClick={() => updateStatus(order.id, "paymentStatus", "PAID")}
                            title="Төлбөр төлөгдсөн"
                          >
                            <DollarSign size={14} />
                          </Button>
                        )}
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "h-8 w-8 text-slate-400 hover:text-slate-900 group-hover:text-white group-hover:bg-white/10 transition-colors rounded-lg")}>
                            <MoreHorizontal size={14} />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 p-1.5 rounded-xl border-slate-100 shadow-2xl">
                            <DropdownMenuItem 
                              className="text-xs font-bold px-3 py-2 rounded-lg cursor-pointer flex items-center gap-2 hover:bg-slate-50"
                              onClick={() => setEditingOrder(order)}
                            >
                              <Pencil size={14} className="text-slate-400" /> Засварлах
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="my-1 bg-slate-50" />
                            <DropdownMenuItem 
                              className="text-xs font-bold px-3 py-2 rounded-lg cursor-pointer text-rose-600 focus:text-rose-600 focus:bg-rose-50 flex items-center gap-2"
                              onClick={() => deleteOrder(order.id)}
                            >
                              <Trash2 size={14} /> Устгах
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!editingOrder} onOpenChange={(open) => !open && setEditingOrder(null)}>
        <DialogContent className="sm:max-w-[95vw] lg:max-w-6xl max-h-[90vh] overflow-y-auto p-0 border-none bg-slate-50">
          <DialogHeader className="p-6 bg-white border-b sticky top-0 z-10">
            <DialogTitle className="text-xl font-bold">Захиалга засах</DialogTitle>
          </DialogHeader>
          <div className="p-6">
            {editingOrder && (
              <NewOrder 
                className="max-w-full pb-0 mt-0"
                initialData={editingOrder} 
                onSuccess={() => {
                  setEditingOrder(null);
                  fetchOrders();
                }} 
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
