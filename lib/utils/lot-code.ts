import { prisma } from '@/lib/prisma'

export async function generateNextLotCode() {
  const count = await prisma.importLot.count()
  return `BZ-ECU-${String(count + 1).padStart(4, '0')}`
}
