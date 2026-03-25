'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export function CostTrendChart({ data }: { data: Array<{ lotCode: string; adjustedRealUnitCost: number }> }) {
  return (
    <div className="h-80 w-full rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
      <div className="mb-4">
        <p className="text-sm font-medium text-slate-500">Evolución</p>
        <h3 className="text-xl font-semibold text-slate-950">Costo real por lote</h3>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="lotCode" />
          <YAxis />
          <Tooltip formatter={(value: number) => `$${value.toFixed(4)}`} />
          <Line type="monotone" dataKey="adjustedRealUnitCost" stroke="#0f172a" strokeWidth={3} dot />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
