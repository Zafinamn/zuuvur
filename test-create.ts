import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function test() {
  try {
    const agent = await prisma.deliveryAgent.create({
      data: { name: "Test Agent " + Date.now(), phone: "12345678" }
    })
    console.log('Successfully created agent:', agent)
  } catch (e) {
    console.error('Creation failed:', e)
  } finally {
    await prisma.$disconnect()
  }
}
test()
