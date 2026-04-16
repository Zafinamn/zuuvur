import * as React from "react";
import { 
  ShoppingBag, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  TrendingUp, 
  DollarSign,
  PackageCheck,
  UserCheck,
  Users
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "motion/react";

interface Stats {
  totalToday: number;
  paidToday: number;
  unpaidToday: number;
  revenueToday: number;
  totalDelivered: number;
}

export default function Dashboard() {
  const [stats, setStats] = React.useState<Stats | null>(null);

  React.useEffect(() => {
    fetch("/api/stats")
      .then(res => res.json())
      .then(data => setStats(data));
  }, []);

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    color, 
    delay,
    valueColor
  }: { 
    title: string; 
    value: string | number; 
    icon: any; 
    color: string;
    delay: number;
    valueColor?: string;
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Card className="border border-[var(--border)] shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">{title}</p>
              <h3 className={`text-2xl font-extrabold ${valueColor || "text-slate-900"}`}>{value}</h3>
            </div>
            <div className={`p-3 rounded-xl ${color} bg-opacity-10 text-${color.split('-')[1]}-600`}>
              <Icon size={20} />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Хянах самбар</h1>
        <p className="text-sm text-slate-500 mt-1">Системийн өнөөдрийн үйл ажиллагааны статистик мэдээлэл.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard 
          title="Өнөөдрийн нийт" 
          value={stats?.totalToday ?? "..."} 
          icon={ShoppingBag} 
          color="bg-blue-500"
          delay={0}
        />
        <StatCard 
          title="Төлөгдсөн" 
          value={stats?.paidToday ?? "..."} 
          icon={CheckCircle} 
          color="bg-green-500"
          valueColor="text-[#22c55e]"
          delay={0.1}
        />
        <StatCard 
          title="Төлөгдөөгүй" 
          value={stats?.unpaidToday ?? "..."} 
          icon={Clock} 
          color="bg-red-500"
          valueColor="text-[#ef4444]"
          delay={0.2}
        />
        <StatCard 
          title="Нийт орлого" 
          value={`${stats?.revenueToday?.toLocaleString() ?? "..."} ₮`} 
          icon={DollarSign} 
          color="bg-indigo-500"
          delay={0.3}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <TrendingUp className="text-slate-400" size={20} />
              Сүүлийн үеийн захиалгууд
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-10">
              <PackageCheck className="mx-auto text-slate-200 mb-3" size={48} />
              <p className="text-slate-400 text-sm italic">Шинэ захиалгууд энд харагдана...</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <UserCheck className="text-slate-400" size={20} />
              Шилдэг хүргэгчид
            </CardTitle>
          </CardHeader>
          <CardContent>
             <div className="text-center py-10">
              <Users className="mx-auto text-slate-200 mb-3" size={48} />
              <p className="text-slate-400 text-sm italic">Хүргэгчдийн мэдээлэл энд харагдана...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
