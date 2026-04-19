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
  Users,
  Activity
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "motion/react";
import { toast } from "sonner";
import { useAuth } from "../components/AuthContext";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

interface Stats {
  totalToday: number;
  paidToday: number;
  unpaidToday: number;
  revenueToday: number;
  totalDelivered: number;
  totalAllTime: number;
  revenueAllTime: number;
}

const chartData = [
  { name: 'Mon', total: 400, revenue: 2400 },
  { name: 'Tue', total: 300, revenue: 1398 },
  { name: 'Wed', total: 200, revenue: 9800 },
  { name: 'Thu', total: 278, revenue: 3908 },
  { name: 'Fri', total: 189, revenue: 4800 },
  { name: 'Sat', total: 239, revenue: 3800 },
  { name: 'Sun', total: 349, revenue: 4300 },
];

const activities = [
  { id: 1, type: 'order', text: 'Шинэ захиалга #ORD-5231', time: '2 минутын өмнө', icon: ShoppingBag, color: 'text-blue-500', bg: 'bg-blue-50' },
  { id: 2, type: 'payment', text: 'Төлбөр баталгаажлаа #ORD-5228', time: '15 минутын өмнө', icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  { id: 3, type: 'delivery', text: 'Хүргэгч замдаа гарлаа - Г.Бат', time: '45 минутын өмнө', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
  { id: 4, type: 'agent', text: 'Шинэ хүргэгч бүртгүүллээ - С.Эрдэнэ', time: '1 цагийн өмнө', icon: UserCheck, color: 'text-indigo-500', bg: 'bg-indigo-50' },
];

const MN_DAYS = ["Ням", "Дав", "Мяг", "Лха", "Пүр", "Баа", "Бям"];

// Persistent timestamp to survive remounts during navigation
let globalLastFetchTime = 0;

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = React.useState<Stats | null>(null);
  const [trendData, setTrendData] = React.useState<any[]>([]);
  const [recentOrders, setRecentOrders] = React.useState<any[]>([]);
  const [topAgents, setTopAgents] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const isAgent = user?.role === 'agent';
    const agentIdParam = isAgent ? `?agentId=${user.id}` : '';
    
    // Prevent double fetches or rapid refreshes across remounts
    const now = Date.now();
    if (now - globalLastFetchTime < 2000) {
      // If we already have data, don't show loading again for a split second remount
      if (stats) setLoading(false);
      return;
    }
    globalLastFetchTime = now;

    setLoading(true);

    fetch(`/api/dashboard/combined${agentIdParam}`)
      .then(async res => {
        const contentType = res.headers.get("content-type");
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || `Error ${res.status}`);
        }
        if (!contentType || !contentType.includes("application/json")) {
          const text = await res.text();
          throw new Error(`Unexpected response: ${text?.substring(0, 50)}`);
        }
        return res.json();
      })
      .then(data => {
        setStats(data.stats);
        
        // Process trend data with day names
        if (Array.isArray(data.trend)) {
          const processedTrend = data.trend.map((t: any) => {
            const date = new Date(t.date);
            return {
              name: MN_DAYS[date.getDay()],
              revenue: t.revenue,
              date: t.date
            };
          });
          setTrendData(processedTrend);
        }

        if (Array.isArray(data.recentOrders)) {
          setRecentOrders(data.recentOrders);
        }

        if (!isAgent && Array.isArray(data.agents)) {
          const sorted = data.agents.sort((a: any, b: any) => (b._count?.orders || 0) - (a._count?.orders || 0));
          setTopAgents(sorted.slice(0, 3));
        }
      })
      .catch(err => {
        console.error("Dashboard data fetch failed:", err.message);
        if (err.message.includes("Rate exceeded")) {
          toast.error("Хянах самбарын мэдээлэл татахад ачаалал их байна. Түр хүлээгээд дахин оролдоно уу.");
        } else {
          toast.error("Мэдээлэл татахад алдаа гарлаа: " + err.message);
        }
      })
      .finally(() => setLoading(false));
  }, [user?.id, user?.role]);

  const StatCard = ({ 
    title, 
    value, 
    description,
    icon: Icon, 
    progressColor, // For progress bar
    iconColor, // For icon text color
    bgColor, // Explicit background for icon container
    delay,
    valueColor,
    percentage,
    isLoading
  }: { 
    title: string; 
    value: string | number; 
    description?: string;
    icon: any; 
    progressColor: string;
    iconColor: string;
    bgColor: string;
    delay: number;
    valueColor?: string;
    percentage?: number;
    isLoading?: boolean;
  }) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay }}
    >
      <Card className="border border-slate-200/60 shadow-sm overflow-hidden group hover:shadow-md transition-all duration-300 bg-white min-h-[140px]">
        <CardContent className="p-5">
          {isLoading ? (
            <div className="animate-pulse space-y-4">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="h-3 w-20 bg-slate-100 rounded" />
                  <div className="h-8 w-24 bg-slate-100 rounded" />
                </div>
                <div className="h-10 w-10 bg-slate-100 rounded-xl" />
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full" />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <div className="space-y-0.5 lg:space-y-1">
                  <p className="text-[9px] lg:text-[11px] font-bold uppercase tracking-wider text-slate-400">{title}</p>
                  <motion.h3 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={String(value)}
                    className={`text-lg lg:text-2xl font-extrabold tracking-tight ${valueColor || "text-slate-900"}`}
                  >
                    {value}
                  </motion.h3>
                  {description && <p className="text-[10px] lg:text-xs font-bold text-slate-500/80">{description}</p>}
                </div>
                <div className={`p-2.5 lg:p-3 rounded-xl ${bgColor} ${iconColor} group-hover:scale-110 transition-transform flex items-center justify-center`}>
                  <Icon size={24} className="lg:w-7 lg:h-7" />
                </div>
              </div>
              {/* Subtle Progress Bar */}
              {percentage !== undefined && (
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(percentage, 100)}%` }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    className={`h-full ${progressColor}`}
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <div className="space-y-6 lg:space-y-10 max-w-7xl mx-auto pb-10">
      <div className="flex items-end justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl lg:text-4xl font-black text-slate-900 tracking-tighter uppercase font-sans">Хянах самбар</h1>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Системийн бодит цагийн мэдээлэл</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatCard 
          title="Захиалга (Өнөөдөр)" 
          value={stats?.totalToday ?? "0"} 
          description={`Нийт: ${stats?.totalAllTime ?? "0"}`}
          icon={ShoppingBag} 
          progressColor="bg-blue-600"
          iconColor="text-blue-600"
          bgColor="bg-blue-50"
          delay={0}
          percentage={stats?.totalAllTime ? (stats.totalToday / stats.totalAllTime) * 100 : 0}
          isLoading={loading}
        />
        <StatCard 
          title="Орлого (Өнөөдөр)" 
          value={stats?.revenueToday ? stats.revenueToday.toLocaleString() + ' ₮' : "0 ₮"} 
          description={`Нийт: ${stats?.revenueAllTime ? stats.revenueAllTime.toLocaleString() + ' ₮' : "0 ₮"}`}
          icon={DollarSign} 
          progressColor="bg-indigo-600"
          iconColor="text-indigo-600"
          bgColor="bg-indigo-50"
          delay={0.1}
          percentage={stats?.revenueAllTime ? (stats.revenueToday / stats.revenueAllTime) * 100 : 0}
          isLoading={loading}
        />
        <StatCard 
          title="Төлөгдсөн" 
          value={stats?.paidToday ?? "0"} 
          icon={CheckCircle} 
          progressColor="bg-emerald-600"
          iconColor="text-emerald-600"
          bgColor="bg-emerald-50"
          valueColor="text-emerald-600"
          delay={0.2}
          percentage={stats?.totalToday ? (stats.paidToday / stats.totalToday) * 100 : 0}
          isLoading={loading}
        />
        <StatCard 
          title="Төлөгдөөгүй" 
          value={stats?.unpaidToday ?? "0"} 
          icon={Clock} 
          progressColor="bg-rose-600"
          iconColor="text-rose-600"
          bgColor="bg-rose-50"
          valueColor="text-rose-600"
          delay={0.3}
          percentage={stats?.totalToday ? (stats.unpaidToday / stats.totalToday) * 100 : 0}
          isLoading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        <Card className={`border-slate-200/60 shadow-sm overflow-hidden rounded-2xl bg-white ${user?.role === 'agent' ? 'lg:col-span-3' : 'lg:col-span-2'}`}>
          <CardHeader className="border-b border-slate-50 px-6 py-5 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 font-sans">
              <Activity className="text-blue-500" size={16} />
              Гүйцэтгэлийн чиг хандлага
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-blue-50 px-2 py-1 rounded-md border border-blue-100">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                <span className="text-[10px] font-black text-blue-600 uppercase">{user?.role === 'agent' ? 'Миний орлого' : 'Нийт орлого'}</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[240px] w-full">
              {loading ? (
                <div className="h-full w-full flex items-center justify-center bg-slate-50/50 rounded-xl animate-pulse">
                  <Activity className="text-slate-200" size={48} />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ left: 15, right: 15, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 8, fontWeight: 800, fill: '#64748b' }}
                      dy={10}
                      height={40}
                      interval={0}
                      padding={{ left: 5, right: 5 }}
                    />
                    <YAxis 
                      hide 
                    />
                    <Tooltip 
                      contentStyle={{ 
                        borderRadius: '12px', 
                        border: 'none', 
                        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', 
                        fontSize: '12px',
                        fontWeight: '900',
                        textTransform: 'uppercase'
                      }} 
                      formatter={(v: any) => [v.toLocaleString() + ' ₮', 'Орлого']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorRevenue)" 
                      animationDuration={1500}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {user?.role !== 'agent' && (
          <Card className="border-slate-200/60 shadow-sm overflow-hidden rounded-2xl bg-white">
            <CardHeader className="border-b border-slate-50 px-6 py-5">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 font-sans">
                <Activity className="text-indigo-500" size={16} />
                Системийн идэвх
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-50">
                {activities.map((act, i) => (
                  <div key={act.id} className="p-4 flex gap-3 hover:bg-slate-50 transition-colors">
                    <div className={`h-8 w-8 rounded-lg ${act.bg} flex items-center justify-center shrink-0`}>
                      <act.icon className={act.color} size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 leading-tight">{act.text}</p>
                      <p className="text-[10px] font-medium text-slate-400 mt-1 uppercase tracking-tight">{act.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className={`border-slate-200/60 shadow-sm overflow-hidden rounded-2xl bg-white ${user?.role === 'agent' ? 'lg:col-span-3' : 'lg:col-span-2'}`}>
          <CardHeader className="border-b border-slate-50 px-6 py-5 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 font-sans">
              <TrendingUp className="text-blue-500" size={16} />
              {user?.role === 'agent' ? 'Миний сүүлийн захиалгууд' : 'Сүүлийн захиалгууд'}
            </CardTitle>
            <div className="h-6 w-6 rounded-full bg-blue-50 flex items-center justify-center">
              <span className="text-[10px] font-bold text-blue-600">{recentOrders.length}</span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {recentOrders.length > 0 ? (
              <div className="divide-y divide-slate-50">
                {recentOrders.map((order, i) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    key={order.id} 
                    className="flex items-center justify-between p-5 hover:bg-slate-50/50 transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-11 w-11 bg-white rounded-xl flex items-center justify-center border border-slate-100 shadow-sm group-hover:border-blue-200 transition-colors">
                        <PackageCheck className="text-slate-400 group-hover:text-blue-500 transition-colors" size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{order.receiverName}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded uppercase">{order.orderNumber}</span>
                          <span className="text-[10px] text-slate-300">•</span>
                          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-tighter">{new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-slate-900">{order.totalAmount.toLocaleString()}₮</p>
                      <div className="flex items-center justify-end gap-1.5 mt-0.5">
                        <div className={`h-1.5 w-1.5 rounded-full ${order.deliveryStatus === 'DELIVERED' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                        <p className={`text-[10px] font-black uppercase tracking-wider ${order.deliveryStatus === 'DELIVERED' ? 'text-emerald-500' : 'text-blue-500'}`}>
                          {order.deliveryStatus === 'DELIVERED' ? 'Хүргэгдсэн' : 'Замдаа'}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                  <PackageCheck className="text-slate-200" size={32} />
                </div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Одоогоор захиалга байхгүй байна</p>
              </div>
            )}
          </CardContent>
        </Card>

        {user?.role !== 'agent' && (
          <Card className="lg:col-span-1 border-slate-200/60 shadow-sm overflow-hidden rounded-2xl bg-white h-fit">
            <CardHeader className="border-b border-slate-50 px-6 py-5">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 font-sans">
                <UserCheck className="text-emerald-500" size={16} />
                Шилдэг хүргэгчид
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {topAgents.length > 0 ? (
                <div className="divide-y divide-slate-50">
                  {topAgents.map((agent, i) => (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                      key={agent.id} 
                      className="flex items-center justify-between p-5 hover:bg-slate-50/50 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-emerald-50 to-indigo-50 border-2 border-white shadow-sm flex items-center justify-center text-indigo-600 font-black text-sm group-hover:scale-110 transition-transform">
                          {agent.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">{agent.name}</p>
                          <p className="text-[10px] font-mono font-bold text-slate-400">{agent.phone}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-base font-black text-emerald-600 leading-none">{agent._count?.orders || 0}</p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Хүргэлт</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20">
                  <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                    <Users className="text-slate-200" size={32} />
                  </div>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Хүргэгч олдсонгүй</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
