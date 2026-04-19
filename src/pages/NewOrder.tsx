import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  MapContainer, 
  TileLayer, 
  useMap, 
  useMapEvents 
} from "react-leaflet";
import L from "leaflet";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import "leaflet/dist/leaflet.css";

// Fix for default marker icons in Leaflet
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

function MapEvents({ onChange }: { onChange: (pos: { lat: number, lng: number }) => void }) {
  const map = useMapEvents({
    moveend: () => {
      const center = map.getCenter();
      onChange({ lat: center.lat, lng: center.lng });
    },
  });
  return null;
}

function ChangeView({ center }: { center: { lat: number; lng: number } }) {
  const map = useMap();
  React.useEffect(() => {
    map.setView([center.lat, center.lng]);
  }, [center, map]);
  return null;
}
import { 
  User, 
  Phone, 
  MapPin, 
  Package, 
  CreditCard, 
  Truck,
  Search,
  History,
  Info
} from "lucide-react";

const districts = [
  "Баянзүрх", "Сонгинохайрхан", "Баянгол", "Хан-Уул", "Сүхбаатар", "Чингэлтэй", "Налайх", "Багануур"
];

const formSchema = z.object({
  receiverName: z.string().min(2, "Нэр оруулна уу"),
  phone: z.string().min(8, "Утасны дугаар оруулна уу"),
  secondaryPhone: z.string().optional(),
  district: z.string().min(1, "Дүүрэг сонгоно уу"),
  khoroo: z.string().min(1, "Хороо оруулна уу"),
  addressText: z.string().min(5, "Дэлгэрэнгүй хаяг оруулна уу"),
  locationDetail: z.string().optional(),
  productName: z.string().min(1, "Барааны нэр оруулна уу"),
  quantity: z.preprocess((val) => Number(val), z.number().min(1, "Тоо ширхэг оруулна уу")),
  price: z.preprocess((val) => Number(val), z.number().default(0)),
  deliveryFee: z.preprocess((val) => Number(val), z.number().default(5000)),
  totalAmount: z.number(),
  paymentStatus: z.string().default("UNPAID"),
  paymentMethod: z.string().default("CASH"),
  agentId: z.string().optional(),
  notes: z.string().optional(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
});

interface FormValues {
  receiverName: string;
  phone: string;
  secondaryPhone?: string;
  district: string;
  khoroo: string;
  addressText: string;
  locationDetail?: string;
  productName: string;
  quantity: number;
  price: number;
  deliveryFee: number;
  totalAmount: number;
  paymentStatus: string;
  paymentMethod: string;
  agentId?: string;
  notes?: string;
  latitude?: number | null;
  longitude?: number | null;
}

export default function NewOrder({ onSuccess, initialData, className }: { onSuccess: () => void, initialData?: any, className?: string }) {
  const [agents, setAgents] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [prevAddresses, setPrevAddresses] = React.useState<any[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      receiverName: initialData?.receiverName || "",
      phone: initialData?.phone || "",
      secondaryPhone: initialData?.secondaryPhone || "",
      district: initialData?.district || "",
      khoroo: initialData?.khoroo || "",
      addressText: initialData?.addressText || "",
      locationDetail: initialData?.locationDetail || "",
      productName: initialData?.productName || "",
      quantity: initialData?.quantity || 1,
      price: initialData?.price || 0,
      deliveryFee: initialData?.deliveryFee || 5000,
      totalAmount: initialData?.totalAmount || 5000,
      paymentStatus: initialData?.paymentStatus || "UNPAID",
      paymentMethod: initialData?.paymentMethod || "CASH",
      agentId: initialData?.agentId?.toString() || "",
      notes: initialData?.notes || "",
      latitude: initialData?.latitude || null,
      longitude: initialData?.longitude || null
    } as any
  });

  const { watch, setValue, register, reset } = form;

  React.useEffect(() => {
    if (initialData) {
      reset({
        receiverName: initialData.receiverName,
        phone: initialData.phone,
        secondaryPhone: initialData.secondaryPhone || "",
        district: initialData.district,
        khoroo: initialData.khoroo,
        addressText: initialData.addressText,
        locationDetail: initialData.locationDetail || "",
        productName: initialData.productName,
        quantity: initialData.quantity,
        price: initialData.price,
        deliveryFee: initialData.deliveryFee,
        totalAmount: initialData.totalAmount,
        paymentStatus: initialData.paymentStatus,
        paymentMethod: initialData.paymentMethod,
        agentId: initialData.agentId?.toString() || "",
        notes: initialData.notes || "",
        latitude: initialData.latitude,
        longitude: initialData.longitude
      });
      if (initialData.latitude && initialData.longitude) {
        setMapCenter({ lat: initialData.latitude, lng: initialData.longitude });
      }
    }
  }, [initialData, reset]);

  const price = watch("price");
  const deliveryFee = watch("deliveryFee");
  const quantity = watch("quantity");
  const latitude = watch("latitude");
  const longitude = watch("longitude");

  const [mapCenter, setMapCenter] = React.useState<{ lat: number; lng: number }>({ lat: 47.9188, lng: 106.9176 }); // Ulaanbaatar center

  React.useEffect(() => {
    const f = parseFloat(String(deliveryFee)) || 0;
    setValue("totalAmount", f);
  }, [deliveryFee, setValue]);

  React.useEffect(() => {
    fetch("/api/agents").then(res => res.json()).then(setAgents);
  }, []);

  const searchCustomer = async (phone: string) => {
    if (phone.length < 8) return;
    try {
      const res = await fetch(`/api/customers/search?phone=${phone}`);
      if (res.ok) {
        const data = await res.json();
        if (data) {
          setValue("receiverName", data.name);
          setPrevAddresses(data.addresses || []);
          toast.info("Өмнөх хэрэглэгчийн мэдээлэл олдлоо");
        }
      }
    } catch (e) {}
  };

  const useAddress = (addr: any) => {
    setValue("district", addr.district);
    setValue("khoroo", addr.khoroo);
    setValue("addressText", addr.street);
    setValue("locationDetail", addr.description);
    setPrevAddresses([]);
    if (addr.latitude && addr.longitude) {
      setValue("latitude", addr.latitude);
      setValue("longitude", addr.longitude);
      setMapCenter({ lat: addr.latitude, lng: addr.longitude });
    }
  };

  const onSubmit = async (values: any) => {
    setLoading(true);
    try {
      const url = initialData ? `/api/orders/${initialData.id}` : "/api/orders";
      const method = initialData ? "PATCH" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (res.ok) {
        toast.success(initialData ? "Захиалга амжилттай шинэчлэгдлээ" : "Захиалга амжилттай бүртгэгдлээ");
        onSuccess();
      } else {
        toast.error("Алдаа гарлаа");
      }
    } catch (e) {
      toast.error("Сүлжээний алдаа");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn("max-w-5xl mx-auto space-y-6 pb-20", className)}>
      {!initialData && (
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Шинэ захиалга</h1>
            <p className="text-sm text-slate-500 mt-1">Хүргэлтийн мэдээллийг үнэн зөв оруулна уу.</p>
          </div>
        </div>
      )}

      <form onSubmit={form.handleSubmit(onSubmit as any)} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Info */}
        <div className="lg:col-span-2 space-y-6">
          {prevAddresses.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-3 bg-[#eff6ff] p-4 rounded-xl border border-dashed border-[#2563eb] sm:items-center">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#2563eb] animate-pulse"></div>
                <strong className="text-sm text-[#1e293b]">Дугаар хайлт:</strong>
              </div>
              <span className="text-xs text-slate-600">
                {watch("phone")}-аар олдсон {prevAddresses.length} хаяг байна.
              </span>
              <div className="sm:ml-auto flex gap-2">
                {prevAddresses.slice(0, 1).map((addr, i) => (
                  <Button 
                    key={i}
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    className="bg-white border-slate-200 h-8 text-[10px]"
                    onClick={() => useAddress(addr)}
                  >
                    Өмнөх хаяг ашиглах
                  </Button>
                ))}
              </div>
            </div>
          )}

          <Card className="border border-[var(--border)] shadow-sm rounded-xl">
            <CardHeader className="bg-[#f8fafc]/50 border-b border-slate-50">
              <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <User size={14} className="text-blue-500" />
                Хэрэглэгч
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-xs font-semibold">Утасны дугаар</Label>
                <div className="relative">
                  <Input 
                    {...register("phone")} 
                    placeholder="8888xxxx" 
                    onBlur={(e) => searchCustomer(e.target.value)}
                    className="pl-10 h-10 bg-[#f8fafc] border-slate-200 focus-visible:ring-1"
                  />
                  <Phone size={14} className="absolute left-3 top-3 text-slate-400" />
                </div>
                {form.formState.errors.phone && <p className="text-[10px] text-red-500 font-medium">{form.formState.errors.phone.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="receiverName" className="text-xs font-semibold">Хүлээн авагчийн нэр</Label>
                <div className="relative">
                  <Input {...register("receiverName")} placeholder="Нэр" className="pl-10 h-10 bg-[#f8fafc] border-slate-200 focus-visible:ring-1" />
                  <User size={14} className="absolute left-3 top-3 text-slate-400" />
                </div>
                {form.formState.errors.receiverName && <p className="text-[10px] text-red-500 font-medium">{form.formState.errors.receiverName.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="secondaryPhone" className="text-xs font-semibold">Нэмэлт утас</Label>
                <Input {...register("secondaryPhone")} placeholder="Заавал биш" className="h-10 bg-[#f8fafc] border-slate-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-[var(--border)] shadow-sm rounded-xl">
            <CardHeader className="bg-[#f8fafc]/50 border-b border-slate-50">
              <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <MapPin size={14} className="text-red-500" />
                Хаяг
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Дүүрэг</Label>
                <Select 
                  onValueChange={(v) => setValue("district", v)}
                  value={watch("district") || ""}
                >
                  <SelectTrigger className="h-10 bg-[#f8fafc] border-slate-200">
                    <SelectValue placeholder="Дүүрэг сонгох" />
                  </SelectTrigger>
                  <SelectContent>
                    {districts.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold">Хороо</Label>
                <Input {...register("khoroo")} placeholder="Хороо" className="h-10 bg-[#f8fafc] border-slate-200" />
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label className="text-xs font-semibold">Дэлгэрэнгүй хаяг / Байр, тоот</Label>
                <Input {...register("addressText")} placeholder="Жишээ: 12-р байр 45 тоот" className="h-10 bg-[#f8fafc] border-slate-200" />
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label className="text-xs font-semibold">Байршлын тайлбар (Очих зам)</Label>
                <Input {...register("locationDetail")} placeholder="Жишээ: Номин супермаркетын баруун талын байр" className="h-10 bg-[#f8fafc] border-slate-200" />
              </div>

              <div className="md:col-span-2 space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold flex items-center gap-2">
                    <MapPin size={14} className="text-red-500" />
                    Газрын зураг дээр тэмдэглэх
                  </Label>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    className="h-8 text-[10px]"
                    onClick={() => {
                      if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition((pos) => {
                          const { latitude, longitude } = pos.coords;
                          setValue("latitude", latitude);
                          setValue("longitude", longitude);
                          setMapCenter({ lat: latitude, lng: longitude });
                        });
                      }
                    }}
                  >
                    Миний байршил
                  </Button>
                </div>
                
                <div className="h-[300px] w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-100 relative z-0">
                  <MapContainer
                    center={[mapCenter.lat, mapCenter.lng]}
                    zoom={15}
                    style={{ height: "100%", width: "100%" }}
                    className="z-0"
                    zoomControl={false}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <ChangeView center={mapCenter} />
                    <MapEvents onChange={(pos) => {
                      setMapCenter(pos);
                      setValue("latitude", pos.lat);
                      setValue("longitude", pos.lng);
                    }} />
                  </MapContainer>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none mb-8 z-[400]">
                     <MapPin size={32} className="text-red-600 drop-shadow-lg" />
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 italic">Газрын зургаа хөдөлгөж байршлаа голлуулна уу. Төв цэгт байгаа тэмдэг нь таны сонгосон байршил болно.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-[var(--border)] shadow-sm rounded-xl">
            <CardHeader className="bg-[#f8fafc]/50 border-b border-slate-50">
              <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Package size={14} className="text-indigo-500" />
                Бараа
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-3 space-y-2">
                <Label className="text-xs font-semibold">Барааны нэр</Label>
                <Input {...register("productName")} placeholder="Барааны нэр" className="h-10 bg-[#f8fafc] border-slate-200" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Тоо ширхэг</Label>
                <Input {...register("quantity")} type="number" className="h-10 bg-[#f8fafc] border-slate-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Summary */}
        <div className="space-y-6">
          <Card className="border-none shadow-lg bg-[#0f172a] text-white rounded-xl">
            <CardHeader>
              <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <CreditCard size={14} className="text-white" />
                Төлбөр тооцоо
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-300">Хүргэлтийн төлбөр</Label>
                <Input 
                  {...register("deliveryFee")} 
                  type="number" 
                  className="bg-slate-800 border-slate-700 text-white h-10" 
                />
              </div>

              <div className="pt-4 border-t border-white/10 space-y-3">
                <div className="flex justify-between items-center text-xs text-slate-400">
                  <span>Хүргэлт:</span>
                  <span className="text-slate-200 font-medium">{parseFloat(String(watch("deliveryFee"))).toLocaleString()} ₮</span>
                </div>
                <div className="flex justify-between items-center text-lg font-extrabold text-white pt-3 border-t border-white/10">
                  <span>НИЙТ:</span>
                  <span className="text-[#22c55e]">{watch("totalAmount").toLocaleString()} ₮</span>
                </div>
              </div>

              <div className="space-y-2 pt-4">
                <Label className="text-xs font-semibold text-slate-300">Төлбөрийн төлөв</Label>
                <Select onValueChange={(v) => setValue("paymentStatus", v)} value={watch("paymentStatus") || ""}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 h-10 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UNPAID">Төлөөгүй</SelectItem>
                    <SelectItem value="PAID">Төлсөн</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-300">Төлбөрийн арга</Label>
                <Select onValueChange={(v) => setValue("paymentMethod", v)} value={watch("paymentMethod") || ""}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 h-10 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">Бэлэн</SelectItem>
                    <SelectItem value="BANK">Дансаар</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-[var(--border)] shadow-sm rounded-xl">
            <CardHeader className="bg-[#f8fafc]/50 border-b border-slate-50">
              <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Truck size={14} className="text-orange-500" />
                Хүргэгч
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Хүргэгч оноох</Label>
                <Select onValueChange={(v) => setValue("agentId", v)} value={watch("agentId") || ""}>
                  <SelectTrigger className="h-10 bg-[#f8fafc] border-slate-200">
                    <SelectValue placeholder="Сонгох" />
                  </SelectTrigger>
                  <SelectContent>
                    {agents.map(a => <SelectItem key={a.id} value={a.id.toString()}>{a.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold">Тэмдэглэл</Label>
                <Input {...register("notes")} placeholder="Нэмэлт тайлбар" className="h-10 bg-[#f8fafc] border-slate-200 text-xs" />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-[#2563eb] hover:bg-[#1e40af] font-bold h-11 rounded-lg text-sm shadow-lg shadow-blue-500/20"
                disabled={loading}
              >
                {loading ? "Хадгалж байна..." : (initialData ? "ӨӨРЧЛӨЛТ ХАДГАЛАХ" : "БҮРТГЭЛ ХАДГАЛАХ")}
              </Button>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
