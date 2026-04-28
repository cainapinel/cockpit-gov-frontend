import { NavLink } from "react-router-dom"
import { LayoutDashboard, BarChart3, Inbox, Network, Target, UserCircle } from "lucide-react"
import { cn } from "@/lib/utils"

const navigation = [
  { name: 'Dashboard Executivo', href: '/', icon: LayoutDashboard },
  { name: 'Perfil do Candidato', href: '/perfil-candidato', icon: UserCircle },
  { name: 'Gestor de Planos Estratégicos', href: '/planning', icon: Network },
  { name: 'Benchmarking', href: '/benchmark', icon: BarChart3 },
  { name: 'Inbound (Conhecimento)', href: '/inbound', icon: Inbox },
  { name: 'Guidelines (Treinamento)', href: '/guidelines', icon: Target },
]

export function Sidebar({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col border-r bg-card text-card-foreground", className)}>
      <div className="p-6">
        <h2 className="text-2xl font-bold tracking-tight text-primary">Cockpit Gov</h2>
        <p className="text-sm text-muted-foreground mt-1">Intelligence War Room</p>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              cn(
                isActive ? "bg-primary/10 text-primary border-r-4 border-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors"
              )
            }
          >
            <item.icon
              className={cn("mr-3 h-5 w-5 flex-shrink-0")}
              aria-hidden="true"
            />
            {item.name}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t text-xs text-muted-foreground">
        v2.0 MVP Build
      </div>
    </div>
  )
}
