import * as React from "react";

interface User {
  id: number;
  name: string;
  role: "admin" | "agent";
  email?: string;
  phone?: string;
}

interface AuthContextType {
  user: User | null;
  login: (credentials: { phone?: string; email?: string; password?: string }) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = React.createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const savedUser = localStorage.getItem("swiftlog_user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (credentials: { phone?: string; email?: string; password?: string }) => {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });

    const data = await res.json();
    if (data.success) {
      setUser(data.user);
      localStorage.setItem("swiftlog_user", JSON.stringify(data.user));
    } else {
      const error: any = new Error(data.error || "Нэвтэрч чадсангүй");
      error.details = data.details;
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("swiftlog_user");
  };

  const value = React.useMemo(() => ({
    user,
    login,
    logout,
    isLoading
  }), [user, isLoading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
