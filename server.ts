import express from "express";
import { createServer as createViteServer } from "vite";
import { PrismaClient } from "@prisma/client";
import path from "path";

const prisma = new PrismaClient();
const app = express();
app.use(express.json());

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
    res.status(500).json({ error: "Search failed" });
  }
});

app.get("/api/orders", async (req, res) => {
  const { status, paymentStatus, phone, q, startDate, endDate } = req.query;
  
  let where: any = {};
  if (status) where.deliveryStatus = String(status);
  if (paymentStatus) where.paymentStatus = String(paymentStatus);
  if (phone) where.phone = { contains: String(phone) };
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
    });
    res.json(orders);
  } catch (error) {
    console.error("Orders fetch error:", error);
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
    const orderNumber = `ORD-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 100)}`;
    
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

    const order = await prisma.order.update({
      where: { id: parseInt(id) },
      data,
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
    res.status(500).json({ error: "Fetch failed" });
  }
});

app.post("/api/agents", async (req, res) => {
  try {
    const agent = await prisma.deliveryAgent.create({ data: req.body });
    res.json(agent);
  } catch (error) {
    console.error("Agent creation error:", error);
    res.status(500).json({ error: "Create failed" });
  }
});

app.get("/api/stats", async (req, res) => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  try {
    const [totalToday, paidToday, unpaidToday, revenueToday, totalDelivered] = await Promise.all([
      prisma.order.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.order.count({ where: { createdAt: { gte: todayStart }, paymentStatus: "PAID" } }),
      prisma.order.count({ where: { createdAt: { gte: todayStart }, paymentStatus: "UNPAID" } }),
      prisma.order.aggregate({
        where: { createdAt: { gte: todayStart }, paymentStatus: "PAID" },
        _sum: { totalAmount: true }
      }),
      prisma.order.count({ where: { createdAt: { gte: todayStart }, deliveryStatus: "DELIVERED" } }),
    ]);

    res.json({
      totalToday,
      paidToday,
      unpaidToday,
      revenueToday: revenueToday._sum.totalAmount || 0,
      totalDelivered
    });
  } catch (error) {
    console.error("Stats fetch error:", error);
    res.status(500).json({ error: "Stats failed", details: error instanceof Error ? error.message : String(error) });
  }
});

async function startServer() {
  // Seed admin if not exists
  const admin = await prisma.user.findUnique({ where: { email: "admin@delivery.mn" } });
  if (!admin) {
    await prisma.user.create({
      data: {
        email: "admin@delivery.mn",
        password: "admin",
        name: "Admin User",
      }
    });
    console.log("Admin user created: admin@delivery.mn / admin");
  }

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
