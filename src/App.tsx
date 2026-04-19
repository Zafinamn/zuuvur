import * as React from "react";
import { 
  LayoutDashboard, 
  PlusCircle, 
  Package, 
  Users, 
  Settings, 
  Bell, 
  Search,
  User as UserIcon,
  Truck,
  Menu,
  X
} from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { motion, AnimatePresence } from "motion/react";
import Dashboard from "./pages/Dashboard";
import NewOrder from "./pages/NewOrder";
import Orders from "./pages/Orders";
import Agents from "./pages/Agents";
import { AuthProvider, useAuth } from "./components/AuthContext";
import Login from "./pages/Login";
import { LogOut } from "lucide-react";

type Page = "dashboard" | "new-order" | "orders" | "agents" | "settings";

function SystemClock() {
  const [currentTime, setCurrentTime] = React.useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="hidden lg:flex items-center gap-4 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-r pr-4 border-slate-200">System Time</span>
      <span className="text-sm font-black text-slate-900 tabular-nums">
        {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </span>
    </div>
  );
}

function AppContent() {
  const { user, logout, isLoading } = useAuth();
  const [currentPage, setCurrentPage] = React.useState<Page>("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Truck className="text-blue-600 animate-bounce" size={40} />
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Систем ачаалж байна...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const NavItem = ({ 
    id, 
    icon: Icon, 
    label,
    adminOnly = false
  }: { 
    id: Page; 
    icon: any; 
    label: string;
    adminOnly?: boolean;
  }) => {
    if (adminOnly && user.role !== 'admin') return null;

    return (
      <button
        onClick={() => {
          setCurrentPage(id);
          setIsSidebarOpen(false);
        }}
        className={`group relative w-full flex items-center gap-3 px-6 py-3 transition-all duration-200 ${
          currentPage === id 
            ? "bg-[var(--sidebar-accent)] text-white border-l-4 border-[var(--sidebar-primary)]" 
            : "text-[var(--sidebar-text)] hover:bg-white/5 hover:text-white"
        }`}
      >
        <Icon size={18} className={currentPage === id ? "text-white" : "text-slate-400 group-hover:text-white transition-colors"} />
        <span className="font-bold text-[13px] tracking-tight">{label}</span>
        {currentPage === id && (
          <motion.div 
            layoutId="active-pill"
            className="absolute right-0 top-2 bottom-2 w-1 bg-white rounded-l-full shadow-[0_0_8px_rgba(255,255,255,0.5)]"
          />
        )}
      </button>
    );
  };

  return (
    <div className="flex h-screen bg-[var(--background)] overflow-hidden font-sans">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-[var(--sidebar-bg)] flex flex-col p-0 border-r border-transparent transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <div className="flex items-center justify-between px-6 py-8">
          <div className="flex items-center gap-3">
            <div className="bg-[var(--primary)] w-8 h-8 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Truck className="text-white" size={18} />
            </div>
            <h1 className="font-black text-white tracking-tighter text-xl uppercase">Хүргэлт</h1>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-white/70 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-2">
          <NavItem id="dashboard" icon={LayoutDashboard} label="ХЯНАХ САМБАР" />
          <NavItem id="new-order" icon={PlusCircle} label="ШИНЭ ЗАХИАЛГА" adminOnly />
          <NavItem id="orders" icon={Package} label="ЗАХИАЛГУУД" />
          <NavItem id="agents" icon={Users} label="ХҮРГЭГЧ НАР" adminOnly />
          <NavItem id="settings" icon={Settings} label="ТОХИРГОО" adminOnly />
        </nav>

        <div className="mt-auto p-4 border-t border-white/5 space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/5">
                <UserIcon size={16} className="text-[var(--sidebar-text)]" />
              </div>
              <div className="overflow-hidden">
                <p className="text-[11px] font-black text-white truncate uppercase tracking-widest leading-none mb-1">{user.name}</p>
                <p className="text-[9px] font-bold text-[var(--sidebar-text)] truncate uppercase leading-none">{user.role === 'admin' ? 'Администратор' : 'Хүргэгч'}</p>
              </div>
            </div>
            <button 
              onClick={logout}
              className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
              title="Гарах"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-[var(--border)] flex items-center justify-between px-4 lg:px-8 shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleSidebar}
              className="p-2 -ml-2 text-slate-500 hover:bg-slate-50 rounded-lg lg:hidden"
            >
              <Menu size={20} />
            </button>
            <SystemClock />
          </div>

          <div className="flex items-center gap-3 lg:gap-6">
            <div className="hidden xs:flex flex-col items-end mr-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Тавтай морил</span>
              <span className="text-xs font-black text-slate-900 uppercase">{user.name}</span>
            </div>
            <button className="relative p-2 text-slate-500 hover:bg-slate-50 rounded-xl transition-all hover:scale-110 active:scale-95 shadow-sm border border-slate-100">
              <Bell size={18} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full border-2 border-white animate-pulse"></span>
            </button>
            <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white text-xs font-black shadow-lg shadow-slate-900/10 border border-slate-800 uppercase">
              {user.name.substring(0, 2)}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto bg-[#f8fafc] p-4 lg:p-8">
          <div className="max-w-7xl mx-auto h-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPage}
                initial={{ opacity: 0, scale: 0.99, y: 5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.99, y: -5 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                {currentPage === "dashboard" && <Dashboard />}
                {currentPage === "new-order" && <NewOrder onSuccess={() => setCurrentPage("orders")} />}
                {currentPage === "orders" && <Orders />}
                {currentPage === "agents" && <Agents />}
                {currentPage === "settings" && (
                  <div className="py-10 text-center">
                    <h1 className="text-2xl font-bold text-slate-900">Тохиргоо</h1>
                    <p className="text-slate-500 mt-2">Системийн ерөнхий тохиргоонууд удахгүй нэмэгдэнэ.</p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>
      
      <Toaster position="top-right" richColors />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

