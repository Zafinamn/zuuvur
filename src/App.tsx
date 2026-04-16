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
  Filter,
  ArrowUpDown,
  CheckCircle2,
  Clock,
  XCircle,
  Truck
} from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import Dashboard from "./pages/Dashboard";
import NewOrder from "./pages/NewOrder";
import Orders from "./pages/Orders";
import Agents from "./pages/Agents";

type Page = "dashboard" | "new-order" | "orders" | "agents" | "settings";

export default function App() {
  const [currentPage, setCurrentPage] = React.useState<Page>("dashboard");

  const NavItem = ({ 
    id, 
    icon: Icon, 
    label 
  }: { 
    id: Page; 
    icon: any; 
    label: string 
  }) => (
    <button
      onClick={() => setCurrentPage(id)}
      className={`w-full flex items-center gap-3 px-6 py-3 transition-all duration-200 ${
        currentPage === id 
          ? "bg-[var(--sidebar-accent)] text-white border-l-4 border-[var(--sidebar-primary)]" 
          : "text-[var(--sidebar-text)] hover:bg-white/5 hover:text-white"
      }`}
    >
      <Icon size={18} />
      <span className="font-medium text-sm">{label}</span>
    </button>
  );

  return (
    <div className="flex h-screen bg-[var(--background)]">
      {/* Sidebar */}
      <aside className="w-60 bg-[var(--sidebar-bg)] flex flex-col p-0 border-r border-transparent">
        <div className="flex items-center gap-3 px-6 py-8">
          <div className="bg-[var(--primary)] w-8 h-8 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Truck className="text-white" size={18} />
          </div>
          <div>
            <h1 className="font-bold text-white tracking-tight text-lg">SwiftLog</h1>
          </div>
        </div>

        <nav className="flex-1">
          <NavItem id="dashboard" icon={LayoutDashboard} label="Хянах самбар" />
          <NavItem id="new-order" icon={PlusCircle} label="Шинэ захиалга" />
          <NavItem id="orders" icon={Package} label="Захиалгууд" />
          <NavItem id="agents" icon={Users} label="Хүргэгч нар" />
          <NavItem id="settings" icon={Settings} label="Тохиргоо" />
        </nav>

        <div className="mt-auto p-4 border-t border-white/5">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/5">
              <UserIcon size={16} className="text-[var(--sidebar-text)]" />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-white truncate">Бат-Эрдэнэ</p>
              <p className="text-[10px] text-[var(--sidebar-text)] truncate">Админ</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-[var(--border)] flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4 bg-[#f1f5f9] px-4 py-2 rounded-lg w-80 border border-[var(--border)]">
            <Search size={16} className="text-slate-400" />
            <input 
              type="text" 
              placeholder="Захиалга, утасны дугаараар хайх..." 
              className="bg-transparent border-none outline-none text-sm w-full placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center gap-6">
            <button className="relative p-2 text-slate-500 hover:bg-slate-50 rounded-full transition-colors">
              <Bell size={18} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-slate-100">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-semibold text-slate-900">Бат-Эрдэнэ</p>
                <p className="text-[10px] text-slate-500">Админ</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-[#e2e8f0]"></div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto bg-[#f8fafc] p-8">
          {currentPage === "dashboard" && <Dashboard />}
          {currentPage === "new-order" && <NewOrder onSuccess={() => setCurrentPage("orders")} />}
          {currentPage === "orders" && <Orders />}
          {currentPage === "agents" && <Agents />}
          {currentPage === "settings" && (
            <div className="max-w-4xl mx-auto py-10 text-center">
              <h1 className="text-2xl font-bold text-slate-900">Тохиргоо</h1>
              <p className="text-slate-500 mt-2">Системийн ерөнхий тохиргоонууд удахгүй нэмэгдэнэ.</p>
            </div>
          )}
        </div>
      </main>
      
      <Toaster position="top-right" richColors />
    </div>
  );
}

