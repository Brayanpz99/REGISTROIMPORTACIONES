type AlertItem = {
  id: string
  title: string
  description: string
  severity?: 'info' | 'warning'
}

export function AlertList({ alerts }: { alerts: AlertItem[] }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">Monitoreo</p>
          <h3 className="text-lg font-semibold text-slate-950">Alertas operativas</h3>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">{alerts.length}</span>
      </div>

      {alerts.length === 0 ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">Todo en orden</div>
      ) : (
        <ul className="space-y-3">
          {alerts.map((alert) => (
            <li key={alert.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className={`text-sm font-semibold ${alert.severity === 'warning' ? 'text-amber-700' : 'text-slate-900'}`}>{alert.title}</p>
              <p className="mt-1 text-sm text-slate-600">{alert.description}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
