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
  totalAllTime: number;
  revenueAllTime: number;
}

export default function Dashboard() {
  const [stats, setStats] = React.useState<Stats | null>(null);
  const [recentOrders, setRecentOrders] = React.useState<any[]>([]);
  const [topAgents, setTopAgents] = React.useState<any[]>([]);

  React.useEffect(() => {
    // Fetch Stats
    fetch("/api/stats")
      .then(res => res.json())
      .then(data => setStats(data));

    // Fetch Recent Orders (limit to 5)
    fetch("/api/orders?limit=5")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setRecentOrders(data.slice(0, 5));
        } else {
          console.error("Orders API returned non-array:", data);
          setRecentOrders([]);
        }
      })
      .catch(err => {
        console.error("Orders fetch failed:", err);
        setRecentOrders([]);
      });

    // Fetch Agents and sort by delivered orders
    fetch("/api/agents")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const sorted = data.sort((a: any, b: any) => (b._count?.orders || 0) - (a._count?.orders || 0));
          setTopAgents(sorted.slice(0, 5));
        } else {
          console.error("Agents API returned non-array:", data);
          setTopAgents([]);
        }
      })
      .catch(err => {
        console.error("Agents fetch failed:", err);
        setTopAgents([]);
      });
  }, []);

  const StatCard = ({ 
    title, 
    value, 
    description,
    icon: Icon, 
    color, 
    delay,
    valueColor
  }: { 
    title: string; 
    value: string | number; 
    description?: string;
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
            <div className="space-y-0.5 lg:space-y-1">
              <p className="text-[9px] lg:text-[11px] font-bold uppercase tracking-wider text-slate-400">{title}</p>
              <h3 className={`text-lg lg:text-2xl font-extrabold ${valueColor || "text-slate-900"}`}>{value}</h3>
              {description && <p className="text-[10px] lg:text-xs font-bold text-slate-600">{description}</p>}
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
    <div className="space-y-6 lg:space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-slate-900 tracking-tight">Хянах самбар</h1>
        <p className="text-xs lg:text-sm text-slate-500 mt-1">Системийн өнөөдрийн үйл ажиллагааны статистик мэдээлэл.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-5">
        <StatCard 
          title="Захиалга (Өнөөдөр)" 
          value={stats?.totalToday ?? "0"} 
          description={`Нийт: ${stats?.totalAllTime ?? "0"}`}
          icon={ShoppingBag} 
          color="bg-blue-500"
          delay={0}
        />
        <StatCard 
          title="Орлого (Өнөөдөр)" 
          value={stats?.revenueToday ? stats.revenueToday.toLocaleString() + ' ₮' : "0 ₮"} 
          description={`Нийт: ${stats?.revenueAllTime ? stats.revenueAllTime.toLocaleString() + ' ₮' : "0 ₮"}`}
          icon={DollarSign} 
          color="bg-indigo-500"
          delay={0.1}
        />
        <StatCard 
          title="Төлөгдсөн" 
          value={stats?.paidToday ?? "0"} 
          icon={CheckCircle} 
          color="bg-green-500"
          valueColor="text-[#22c55e]"
          delay={0.2}
        />
        <StatCard 
          title="Төлөгдөөгүй" 
          value={stats?.unpaidToday ?? "0"} 
          icon={Clock} 
          color="bg-red-500"
          valueColor="text-[#ef4444]"
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
            {recentOrders.length > 0 ? (
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center border border-slate-100 shadow-sm">
                        <ShoppingBag className="text-blue-500" size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{order.receiverName}</p>
                        <p className="text-[10px] text-slate-400">{order.orderNumber} • {new Date(order.createdAt).toLocaleTimeString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-900">{order.totalAmount.toLocaleString()}₮</p>
                      <p className={`text-[10px] font-bold ${order.deliveryStatus === 'DELIVERED' ? 'text-green-500' : 'text-blue-500'}`}>
                        {order.deliveryStatus === 'DELIVERED' ? 'Хүргэгдсэн' : 'Хүлээгдэж буй'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <PackageCheck className="mx-auto text-slate-200 mb-3" size={48} />
                <p className="text-slate-400 text-sm italic">Шинэ захиалгууд энд харагдана...</p>
              </div>
            )}
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
            {topAgents.length > 0 ? (
              <div className="space-y-4">
                {topAgents.map((agent) => (
                  <div key={agent.id} className="flex items-center justify-between p-3 border-b border-slate-50 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-bold text-sm">
                        {agent.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{agent.name}</p>
                        <p className="text-[10px] text-slate-400">{agent.phone}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-extrabold text-[#22c55e]">{agent._count.orders}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Хүргэлт</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <Users className="mx-auto text-slate-200 mb-3" size={48} />
                <p className="text-slate-400 text-sm italic">Хүргэгчдийн мэдээлэл энд харагдана...</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
