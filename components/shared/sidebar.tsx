import Link from 'next/link'
import { LayoutDashboard, PackageSearch, FileSpreadsheet } from 'lucide-react'

const items = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/importaciones', label: 'Importaciones', icon: PackageSearch },
  { href: '/exportar', label: 'Exportar', icon: FileSpreadsheet },
]

export function Sidebar() {
  return (
    <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-white xl:block">
      <div className="sticky top-0 flex min-h-screen flex-col p-6">
        <div className="rounded-3xl bg-slate-950 p-5 text-white shadow-soft">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Mini ERP</p>
          <h1 className="mt-2 text-2xl font-semibold">Control de Costos</h1>
          <p className="mt-2 text-sm text-slate-300">Importación multi-ítem, prorrateo, producción y costo real por producto.</p>
        </div>
        <nav className="mt-8 space-y-2">
          {items.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950">
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  )
}
