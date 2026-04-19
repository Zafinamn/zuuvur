import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
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
    console.log("Admin password updated to 123456");
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
