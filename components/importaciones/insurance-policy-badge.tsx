import { InsurancePolicyStatus } from '@/lib/utils/insurance-policy'

const statusMap: Record<InsurancePolicyStatus, { label: string; className: string }> = {
  no_record: { label: 'sin registro', className: 'bg-slate-100 text-slate-700' },
  active: { label: 'vigente', className: 'bg-emerald-100 text-emerald-700' },
  warning: { label: 'próxima a vencer', className: 'bg-amber-100 text-amber-700' },
  expired: { label: 'vencida', className: 'bg-rose-100 text-rose-700' },
}

export function InsurancePolicyBadge({ status }: { status: InsurancePolicyStatus }) {
  const item = statusMap[status]

  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.className}`}>{item.label}</span>
}
