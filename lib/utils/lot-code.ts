import { prisma } from '@/lib/prisma'

export async function generateNextLotCode() {
  const count = await prisma.import.count()
  return `IMP-${String(count + 1).padStart(5, '0')}`
}
