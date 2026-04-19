import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    const users = await prisma.user.findMany();
    console.log("Users:", JSON.stringify(users, null, 2));
    
    const agents = await prisma.deliveryAgent.findMany();
    console.log("Agents:", JSON.stringify(agents, null, 2));
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
