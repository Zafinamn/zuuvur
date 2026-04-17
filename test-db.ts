import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    const agents = await prisma.deliveryAgent.findMany()
    console.log('Successfully connected and fetched agents:', agents.length)
  } catch (e) {
    console.error('Connection failed:', e)
  } finally {
    await prisma.$disconnect()
  }
}

main()
