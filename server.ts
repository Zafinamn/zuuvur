import "dotenv/config";
import express from "express";
import { PrismaClient } from "@prisma/client";
import path from "path";

import fs from "fs";

const prisma = new PrismaClient();
export const app = express();
app.use(express.json());

// API health check
app.get("/api/health", async (req, res) => {
  try {
    await prisma.$connect();
    res.json({ status: "ok", database: "connected" });
  } catch (error) {
    res.status(500).json({ status: "error", database: "disconnected", message: error instanceof Error ? error.message : "Database error" });
  }
});

// Request logger 
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

const PORT = 3000;

// API Routes
app.get("/api/customers/search", async (req, res) => {
  const { phone } = req.query;
  if (!phone) return res.status(400).json({ error: "Phone required" });

  try {
    const customer = await prisma.customer.findUnique({
      where: { phone: String(phone) },
      include: { addresses: true },
    });
    res.json(customer);
  } catch (error) {
    console.error("Customer search error:", error);
    if (error instanceof Error && error.message.includes("DATABASE_URL")) {
      return res.status(500).json({ 
        error: "Өгөгдлийн сангийн холболт (DATABASE_URL) тохируулаагүй байна.",
        details: "Settings > Secrets хэсэгт тохируулна уу."
      });
    }
    res.status(500).json({ error: "Search failed" });
  }
});

app.get("/api/orders", async (req, res) => {
  const { status, paymentStatus, phone, q, startDate, endDate, limit, agentId } = req.query;
  
  let where: any = {};
  if (status) where.deliveryStatus = String(status);
  if (paymentStatus) where.paymentStatus = String(paymentStatus);
  if (phone) where.phone = { contains: String(phone) };
  if (agentId) where.agentId = parseInt(String(agentId));
  if (q) {
    where.OR = [
      { receiverName: { contains: String(q) } },
      { orderNumber: { contains: String(q) } },
      { phone: { contains: String(q) } },
    ];
  }
  
  if (startDate && endDate) {
    where.createdAt = {
      gte: new Date(String(startDate)),
      lte: new Date(String(endDate)),
    };
  }

  try {
    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { agent: true },
      take: limit ? parseInt(String(limit)) : undefined,
    });
    res.json(orders);
  } catch (error) {
    console.error("Orders fetch error:", error);
    if (error instanceof Error && error.message.includes("DATABASE_URL")) {
      return res.status(500).json({ 
        error: "Өгөгдлийн сангийн холболтын тохиргоо (DATABASE_URL) дутуу байна.",
        details: "AI Studio-ийн Settings > Secrets хэсэгт DATABASE_URL-ийг тохируулна уу."
      });
    }
    res.status(500).json({ error: "Fetch failed" });
  }
});

app.post("/api/orders", async (req, res) => {
  const data = req.body;
  
  try {
    // 1. Find or create customer
    let customer = await prisma.customer.findUnique({
      where: { phone: data.phone },
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          name: data.receiverName,
          phone: data.phone,
        },
      });
    }

    // 2. Add address if new
    let address = await prisma.address.findFirst({
      where: {
        customerId: customer.id,
        street: data.addressText,
        district: data.district,
        khoroo: data.khoroo,
      },
    });

    if (!address) {
      address = await prisma.address.create({
        data: {
          customerId: customer.id,
          street: data.addressText,
          district: data.district,
          khoroo: data.khoroo,
          description: data.locationDetail,
          latitude: data.latitude ? parseFloat(data.latitude) : null,
          longitude: data.longitude ? parseFloat(data.longitude) : null,
        },
      });
    }

    // 3. Create order
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateStr = `${year}${month}${day}`;
    
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastOrderToday = await prisma.order.findFirst({
      where: {
        orderNumber: {
          startsWith: `ORD-${dateStr}-`
        }
      },
      orderBy: {
        orderNumber: "desc",
      },
    });

    let sequence = "001";
    if (lastOrderToday) {
      const parts = lastOrderToday.orderNumber.split("-");
      const lastSeq = parseInt(parts[2]);
      if (!isNaN(lastSeq)) {
        sequence = String(lastSeq + 1).padStart(3, '0');
      }
    }

    const orderNumber = `ORD-${dateStr}-${sequence}`;
    
    const order = await prisma.order.create({
      data: {
        orderNumber,
        receiverName: data.receiverName,
        phone: data.phone,
        secondaryPhone: data.secondaryPhone,
        district: data.district,
        khoroo: data.khoroo,
        addressText: data.addressText,
        locationDetail: data.locationDetail,
        latitude: data.latitude ? parseFloat(data.latitude) : null,
        longitude: data.longitude ? parseFloat(data.longitude) : null,
        productName: data.productName,
        quantity: parseInt(data.quantity) || 1,
        price: parseFloat(data.price),
        deliveryFee: parseFloat(data.deliveryFee),
        totalAmount: parseFloat(data.totalAmount),
        paymentStatus: data.paymentStatus || "UNPAID",
        paymentMethod: data.paymentMethod || "CASH",
        notes: data.notes,
        customerId: customer.id,
        addressId: address.id,
        agentId: data.agentId ? parseInt(data.agentId) : null,
      },
    });

    // 4. Log creation
    await prisma.statusLog.create({
      data: {
        orderId: order.id,
        oldStatus: "NONE",
        newStatus: "PENDING",
        logType: "DELIVERY",
      },
    });

    res.json(order);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.patch("/api/orders/:id", async (req, res) => {
  const { id } = req.params;
  const data = req.body;

  try {
    const oldOrder = await prisma.order.findUnique({ where: { id: parseInt(id) } });
    if (!oldOrder) return res.status(404).json({ error: "Order not found" });

    // Sanitize and parse data for Prisma
    const updateData: any = {};
    const stringFields = [
      "receiverName", "phone", "secondaryPhone", "district", "khoroo", 
      "addressText", "locationDetail", "productName", "paymentStatus", 
      "paymentMethod", "notes", "deliveryStatus"
    ];
    
    stringFields.forEach(f => {
      if (data[f] !== undefined) updateData[f] = data[f];
    });

    if (data.quantity !== undefined) updateData.quantity = parseInt(data.quantity) || 0;
    if (data.price !== undefined) updateData.price = parseFloat(data.price) || 0;
    if (data.deliveryFee !== undefined) updateData.deliveryFee = parseFloat(data.deliveryFee) || 0;
    if (data.totalAmount !== undefined) updateData.totalAmount = parseFloat(data.totalAmount) || 0;
    if (data.latitude !== undefined) updateData.latitude = data.latitude ? parseFloat(data.latitude) : null;
    if (data.longitude !== undefined) updateData.longitude = data.longitude ? parseFloat(data.longitude) : null;
    if (data.agentId !== undefined) {
      updateData.agentId = data.agentId ? parseInt(data.agentId) : null;
    }

    const order = await prisma.order.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    // Logging
    if (data.deliveryStatus && data.deliveryStatus !== oldOrder.deliveryStatus) {
      await prisma.statusLog.create({
        data: {
          orderId: order.id,
          oldStatus: oldOrder.deliveryStatus,
          newStatus: data.deliveryStatus,
          logType: "DELIVERY",
        },
      });
    }

    if (data.paymentStatus && data.paymentStatus !== oldOrder.paymentStatus) {
      await prisma.statusLog.create({
        data: {
          orderId: order.id,
          oldStatus: oldOrder.paymentStatus,
          newStatus: data.paymentStatus,
          logType: "PAYMENT",
        },
      });
    }

    res.json(order);
  } catch (error: any) {
    console.error("Order update error:", error);
    res.status(500).json({ error: "Update failed" });
  }
});

app.delete("/api/orders/:id", async (req, res) => {
  const { id } = req.params;
  try {
    // Delete logs first due to relations
    await prisma.statusLog.deleteMany({ where: { orderId: parseInt(id) } });
    await prisma.order.delete({ where: { id: parseInt(id) } });
    res.json({ success: true });
  } catch (error) {
    console.error("Order delete error:", error);
    res.status(500).json({ error: "Delete failed" });
  }
});

app.post("/api/login", async (req, res) => {
  const { phone, email, password } = req.body;
  
  try {
    // 1. Try to find in User table (Admin)
    if (email) {
      // Allow 'admin' shorthand for 'admin@delivery.mn'
      const identifier = email === "admin" ? "admin@delivery.mn" : email;
      const user = await prisma.user.findUnique({ where: { email: identifier } });
      if (user) {
        if (user.password === password) {
          return res.json({ 
            success: true, 
            user: { id: user.id, name: user.name, role: user.role, email: user.email } 
          });
        } else {
          return res.status(401).json({ error: "Нэвтрэх нууц үг буруу байна." });
        }
      }
    }

    // 2. Try to find in DeliveryAgent table (Drivers)
    if (phone) {
      const agent = await prisma.deliveryAgent.findUnique({ where: { phone: String(phone) } });
      if (agent) {
        if (agent.password === password) {
          return res.json({ 
            success: true, 
            user: { id: agent.id, name: agent.name, role: agent.role, phone: agent.phone } 
          });
        } else {
          return res.status(401).json({ error: "Нэвтрэх нууц үг буруу байна." });
        }
      }
    }

    res.status(401).json({ error: "Нэвтрэх и-мэйл эсвэл утасны дугаар бүртгэлгүй байна." });
  } catch (error) {
    console.error("Login error:", error);
    if (error instanceof Error && error.message.includes("DATABASE_URL")) {
      return res.status(500).json({ 
        error: "Өгөгдлийн сангийн холболт (DATABASE_URL) тохируулаагүй байна.",
        details: "Settings > Secrets хэсэгт тохируулна уу."
      });
    }
    res.status(500).json({ error: "Нэвтрэхэд алдаа гарлаа. Өгөгдлийн сангийн холболтоо шалгана уу." });
  }
});

app.get("/api/agents", async (req, res) => {
  try {
    const agents = await prisma.deliveryAgent.findMany({
      include: {
        _count: {
          select: { orders: { where: { deliveryStatus: "DELIVERED" } } }
        }
      }
    });
    res.json(agents);
  } catch (error) {
    console.error("Agents fetch error:", error);
    if (error instanceof Error && error.message.includes("DATABASE_URL")) {
      return res.status(500).json({ 
        error: "Өгөгдлийн сангийн холболт (DATABASE_URL) тохируулаагүй байна.",
        details: "Settings > Secrets хэсэгт тохируулна уу."
      });
    }
    res.status(500).json({ error: "Fetch failed" });
  }
});

app.post("/api/agents", async (req, res) => {
  try {
    const { name, phone, password, status } = req.body;
    const agent = await prisma.deliveryAgent.create({ 
      data: {
        name,
        phone,
        password: password || "123456",
        status: status || "active"
      } 
    });
    res.json(agent);
  } catch (error: any) {
    console.error("Agent creation error:", error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: "Энэ утасны дугаар аль хэдийн бүртгэгдсэн байна." });
    }
    res.status(500).json({ error: error.message || "Бүртгэхэд алдаа гарлаа" });
  }
});

app.patch("/api/agents/:id", async (req, res) => {
  const { id } = req.params;
  const { name, phone, password, status } = req.body;
  try {
    const agent = await prisma.deliveryAgent.update({
      where: { id: parseInt(id) },
      data: {
        name,
        phone,
        password,
        status
      }
    });
    res.json(agent);
  } catch (error: any) {
    console.error("Agent update error:", error);
    res.status(500).json({ error: "Update failed" });
  }
});

app.get("/api/stats", async (req, res) => {
  const { agentId } = req.query;
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const filter: any = {};
  if (agentId) filter.agentId = parseInt(String(agentId));

  try {
    const [
      totalToday, 
      paidToday, 
      unpaidToday, 
      revenueToday, 
      totalDelivered,
      totalAllTime,
      revenueAllTime
    ] = await Promise.all([
      prisma.order.count({ where: { ...filter, createdAt: { gte: todayStart } } }),
      prisma.order.count({ where: { ...filter, createdAt: { gte: todayStart }, paymentStatus: "PAID" } }),
      prisma.order.count({ where: { ...filter, createdAt: { gte: todayStart }, paymentStatus: "UNPAID" } }),
      prisma.order.aggregate({
        where: { ...filter, createdAt: { gte: todayStart }, paymentStatus: "PAID" },
        _sum: { totalAmount: true }
      }),
      prisma.order.count({ where: { ...filter, createdAt: { gte: todayStart }, deliveryStatus: "DELIVERED" } }),
      prisma.order.count({ where: { ...filter } }),
      prisma.order.aggregate({
        where: { ...filter, paymentStatus: "PAID" },
        _sum: { totalAmount: true }
      }),
    ]);

    res.json({
      totalToday,
      paidToday,
      unpaidToday,
      revenueToday: revenueToday._sum.totalAmount || 0,
      totalDelivered,
      totalAllTime,
      revenueAllTime: revenueAllTime._sum.totalAmount || 0
    });
  } catch (error) {
    console.error("Stats fetch error:", error);
    res.status(500).json({ error: "Stats failed", details: error instanceof Error ? error.message : String(error) });
  }
});

app.get("/api/stats/trend", async (req, res) => {
  const { agentId } = req.query;
  const now = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(now.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const filter: any = {
    createdAt: { gte: sevenDaysAgo },
    paymentStatus: "PAID"
  };
  if (agentId) filter.agentId = parseInt(String(agentId));

  try {
    const orders = await prisma.order.findMany({
      where: filter,
      select: {
        createdAt: true,
        totalAmount: true
      }
    });

    // Group by date
    const dailyData: Record<string, number> = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      dailyData[dateStr] = 0;
    }

    orders.forEach(o => {
      const dateStr = o.createdAt.toISOString().split('T')[0];
      if (dailyData[dateStr] !== undefined) {
        dailyData[dateStr] += o.totalAmount;
      }
    });

    const result = Object.entries(dailyData)
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => a.date.localeCompare(b.date));

    res.json(result);
  } catch (error) {
    console.error("Trend fetch error:", error);
    res.status(500).json({ error: "Failed to fetch trend" });
  }
});

app.get("/api/dashboard/combined", async (req, res) => {
  const { agentId } = req.query;
  const now = new Date();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(now.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const filter: any = {};
  if (agentId) filter.agentId = parseInt(String(agentId));

  // Simple in-memory cache to prevent loops or rapid refreshes hitting DB
  const cacheKey = `dashboard_${agentId || 'admin'}`;
  const nowTs = Date.now();
  if (dashboardCache[cacheKey] && nowTs - dashboardCache[cacheKey].ts < 10000) {
    return res.json(dashboardCache[cacheKey].data);
  }

  try {
    const [
      todayOrdersData,
      allTimeStats,
      trendOrders,
      recentOrders,
      topAgents,
      recentActivities
    ] = await Promise.all([
      // 1. Fetch today's order data in one go for memory processing
      prisma.order.findMany({
        where: { ...filter, createdAt: { gte: todayStart } },
        select: { paymentStatus: true, deliveryStatus: true, totalAmount: true }
      }),
      // 2. All time totals
      Promise.all([
        prisma.order.count({ where: filter }),
        prisma.order.aggregate({
          where: { ...filter, paymentStatus: "PAID" },
          _sum: { totalAmount: true }
        })
      ]),
      // 3. Trend
      prisma.order.findMany({
        where: { ...filter, createdAt: { gte: sevenDaysAgo }, paymentStatus: "PAID" },
        select: { createdAt: true, totalAmount: true }
      }),
      // 4. Recent Orders
      prisma.order.findMany({
        where: filter,
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { agent: true }
      }),
      // 5. Top Agents
      !agentId ? prisma.deliveryAgent.findMany({
        include: {
          _count: {
            select: { orders: { where: { deliveryStatus: "DELIVERED" } } }
          }
        }
      }) : Promise.resolve([]),
      // 6. Recent Activities from StatusLog
      prisma.statusLog.findMany({
        where: agentId ? { order: { agentId: parseInt(String(agentId)) } } : {},
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { order: true, user: true }
      })
    ]);

    // Process today's stats in memory
    let totalToday = todayOrdersData.length;
    let paidToday = 0;
    let unpaidToday = 0;
    let revenueToday = 0;
    let totalDelivered = 0;

    todayOrdersData.forEach(o => {
      if (o.paymentStatus === "PAID") {
        paidToday++;
        revenueToday += o.totalAmount;
      } else {
        unpaidToday++;
      }
      if (o.deliveryStatus === "DELIVERED") {
        totalDelivered++;
      }
    });

    const statsResult = {
      totalToday,
      paidToday,
      unpaidToday,
      revenueToday,
      totalDelivered,
      totalAllTime: allTimeStats[0],
      revenueAllTime: allTimeStats[1]._sum.totalAmount || 0
    };

    // Process trend
    const dailyData: Record<string, number> = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      dailyData[dateStr] = 0;
    }
    trendOrders.forEach(o => {
      const dateStr = o.createdAt.toISOString().split('T')[0];
      if (dailyData[dateStr] !== undefined) dailyData[dateStr] += o.totalAmount;
    });
    const trendResult = Object.entries(dailyData)
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const finalData = {
      stats: statsResult,
      trend: trendResult,
      recentOrders,
      agents: topAgents,
      activities: recentActivities.map(log => {
        let text = "";
        let icon = "Activity";
        
        if (log.logType === "PAYMENT") {
          text = `Төлбөр ${log.newStatus === 'PAID' ? 'баталгаажлаа' : 'цуцлагдлаа'} #${log.order.orderNumber}`;
          icon = "CheckCircle";
        } else if (log.logType === "DELIVERY") {
          const statusMap: any = {
            "ON_DELIVERY": "Замдаа гарлаа",
            "DELIVERED": "Хүргэгдлээ",
            "PENDING": "Хүлээгдэж байна",
            "CANCELLED": "Цуцлагдлаа"
          };
          text = `${statusMap[log.newStatus] || log.newStatus} #${log.order.orderNumber}`;
          icon = "PackageCheck";
        }
        
        return {
          id: log.id,
          text,
          time: log.createdAt,
          type: log.logType.toLowerCase(),
          icon
        };
      })
    };

    // Update cache
    dashboardCache[cacheKey] = { ts: nowTs, data: finalData };

    res.json(finalData);
  } catch (error) {
    console.error("Combined dashboard error:", error);
    res.status(500).json({ error: "Failed to load dashboard data" });
  }
});

const dashboardCache: Record<string, { ts: number, data: any }> = {};

export default app;

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production: Serve static files from 'dist'
    const distPath = path.join(process.cwd(), "dist");
    console.log(`Serving static files from: ${distPath}`);
    
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get("*", (req, res, next) => {
        if (req.url.startsWith("/api")) return next();
        res.sendFile(path.join(distPath, "index.html"));
      });
    } else {
      console.warn("WARNING: dist directory not found. Static files will not be served.");
      app.get("*", (req, res, next) => {
        if (req.url.startsWith("/api")) return next();
        res.status(404).send("Front-end build (dist) not found. Please run 'npm run build' first.");
      });
    }
  }

  // Background tasks
  try {
    await prisma.$connect();
    console.log("Connected to Supabase successfully.");
    
    // Ensure admin user exists with the correct password
    await prisma.user.upsert({
      where: { email: "admin@delivery.mn" },
      update: { password: "123456" },
      create: {
        email: "admin@delivery.mn",
        password: "123456",
        name: "Admin User",
        role: "admin"
      }
    });
    console.log("Admin user synced: admin@delivery.mn / 123456");
  } catch (err) {
    console.error("Database startup tasks failed:", err);
  }

  // Start listening
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
