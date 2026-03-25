import './globals.css'
import type { Metadata } from 'next'
import { Sidebar } from '@/components/shared/sidebar'

export const metadata: Metadata = {
  title: 'Mini ERP Costos',
  description: 'Control gerencial de costos de importación y producción',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="min-w-0 flex-1">
            <div className="mx-auto max-w-7xl p-6 lg:p-10">{children}</div>
          </main>
        </div>
      </body>
    </html>
  )
}
