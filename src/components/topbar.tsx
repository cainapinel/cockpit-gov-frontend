import { useState, useEffect } from "react"
import { Bell, Search, LogOut, Clock, AlertTriangle, ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/contexts/AuthContext"
import { GlobalSearchModal } from "./GlobalSearchModal"

// ─── Session Badge ────────────────────────────────────────────────────────────

function formatTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${String(s).padStart(2, '0')}s`;
  return `${s}s`;
}

type SessionBadgeProps = {
  secondsLeft: number;
  isIdle: boolean;
};

function SessionBadge({ secondsLeft, isIdle }: SessionBadgeProps) {
  const [visible, setVisible] = useState(true);

  // Pisca quando restam menos de 5 minutos
  useEffect(() => {
    if (secondsLeft > 300) { setVisible(true); return; }
    const interval = setInterval(() => setVisible((v) => !v), 800);
    return () => clearInterval(interval);
  }, [secondsLeft]);

  if (secondsLeft <= 0) return null;

  // Idle: usuário inativo, sessão não será renovada
  if (isIdle) {
    return (
      <div
        className="flex items-center gap-1.5 rounded-lg border border-orange-500/40 bg-orange-500/10 px-2.5 py-1 text-xs font-medium text-orange-400"
        title="Você está inativo. A sessão não está sendo renovada."
      >
        <ShieldAlert size={12} className="shrink-0" />
        <span>Sessão pausada — inativo</span>
      </div>
    );
  }

  // Crítico: < 5 min
  if (secondsLeft < 300) {
    return (
      <div
        className="flex items-center gap-1.5 rounded-lg border border-red-500/40 bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-400 transition-opacity duration-300"
        style={{ opacity: visible ? 1 : 0.3 }}
        title="Sessão expirando em breve!"
      >
        <AlertTriangle size={12} className="shrink-0" />
        <span>Expira em {formatTime(secondsLeft)}</span>
      </div>
    );
  }

  // Aviso: 5–15 min
  if (secondsLeft < 900) {
    return (
      <div
        className="flex items-center gap-1.5 rounded-lg border border-yellow-500/40 bg-yellow-500/10 px-2.5 py-1 text-xs font-medium text-yellow-400"
        title="Sessão expirando em breve. Interaja para renovar automaticamente."
      >
        <Clock size={12} className="shrink-0" />
        <span>Sessão: {formatTime(secondsLeft)}</span>
      </div>
    );
  }

  // Normal: > 15 min (exibe apenas o tempo, discreto)
  return (
    <div
      className="flex items-center gap-1.5 rounded-lg border border-green-500/30 bg-green-500/8 px-2.5 py-1 text-xs font-medium text-green-500/80"
      title="Sessão ativa. Renovação automática enquanto você estiver usando."
    >
      <Clock size={11} className="shrink-0" />
      <span>{formatTime(secondsLeft)}</span>
    </div>
  );
}

// ─── TopBar ───────────────────────────────────────────────────────────────────

export function TopBar() {
  const { logout, user, sessionSecondsLeft, isIdle } = useAuth()
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

      <div className="flex items-center space-x-3">
        {/* Session indicator */}
        <SessionBadge secondsLeft={sessionSecondsLeft} isIdle={isIdle} />

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
