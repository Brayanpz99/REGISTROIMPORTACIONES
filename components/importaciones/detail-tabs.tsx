'use client'

import { useMemo, useState } from 'react'

type TabDef = {
  id: string
  label: string
  content: React.ReactNode
}

export function DetailTabs({ tabs }: { tabs: TabDef[] }) {
  const defaultTab = useMemo(() => tabs[0]?.id ?? 'resumen', [tabs])
  const [active, setActive] = useState(defaultTab)

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-soft">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const selected = active === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActive(tab.id)}
                className={`rounded-xl px-4 py-2 text-sm font-medium transition ${selected ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {tabs.map((tab) => (
        <div key={tab.id} className={active === tab.id ? 'block' : 'hidden'}>
          {tab.content}
        </div>
      ))}
    </section>
  )
}
