export type InsurancePolicyStatus = 'no_record' | 'active' | 'warning' | 'expired'

export type InsurancePolicyState = {
  status: InsurancePolicyStatus
  daysRemaining: number | null
}

const DAY_MS = 24 * 60 * 60 * 1000

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function getInsurancePolicyState(insuranceExpiresAt?: Date | string | null, now: Date = new Date()): InsurancePolicyState {
  if (!insuranceExpiresAt) {
    return { status: 'no_record', daysRemaining: null }
  }

  const today = startOfDay(now)
  const expires = startOfDay(new Date(insuranceExpiresAt))
  const diffMs = expires.getTime() - today.getTime()
  const daysRemaining = Math.floor(diffMs / DAY_MS)

  if (daysRemaining < 0) {
    return { status: 'expired', daysRemaining }
  }

  if (daysRemaining <= 20) {
    return { status: 'warning', daysRemaining }
  }

  return { status: 'active', daysRemaining }
}
