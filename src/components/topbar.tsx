import { useState, useEffect } from "react"
import { Bell, Search, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/contexts/AuthContext"
import { GlobalSearchModal } from "./GlobalSearchModal"

export function TopBar() {
  const { logout, user } = useAuth()
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  // Global hotkey interceptor for Cmd+K or Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setIsSearchOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])
  
  // Handlers for graceful fallbacks
  const displayName = user ? (user.first_name ? `${user.first_name} ${user.last_name || ''}` : user.username) : "Carregando...";
  const displayRole = user?.role || "Usuário Logado";
  const displayInitials = user?.first_name ? user.first_name.charAt(0).toUpperCase() : "U";

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-6 shadow-sm">
      <div className="flex flex-1 items-center space-x-4">
        <Button 
          variant="outline" 
          onClick={() => setIsSearchOpen(true)}
          className="relative w-full max-w-md justify-start text-sm text-muted-foreground bg-muted/40 hover:bg-muted/80 border-gray-200 transition-all shadow-sm"
        >
          <Search className="mr-2 h-4 w-4" />
          <span>Busca global ou comando...</span>
          <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-6 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>
        <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      </div>

      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive" />
          <span className="sr-only">Notificações</span>
        </Button>
        <div className="flex items-center space-x-2 border-l pl-4 ml-2">
          <div className="flex flex-col text-right">
            <span className="text-sm font-medium leading-none">{displayName}</span>
            <span className="text-xs text-muted-foreground mt-1">
              {displayRole} {user?.region_access_level ? `(${user.region_access_level})` : ""}
            </span>
          </div>
          <Avatar>
            <AvatarImage src="" alt="Avatar" />
            <AvatarFallback>{displayInitials}</AvatarFallback>
          </Avatar>
          <Button variant="ghost" size="icon" onClick={logout} title="Sair da ATHENA">
            <LogOut className="h-5 w-5 text-muted-foreground hover:text-destructive" />
          </Button>
        </div>
      </div>
    </header>
  )
}
