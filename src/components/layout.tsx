import { Outlet } from "react-router-dom"
import { Sidebar } from "./sidebar"
import { TopBar } from "./topbar"

export function AppLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar className="w-64 flex-shrink-0 hidden md:block" />
      <div className="flex flex-col flex-1 min-w-0">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6 bg-muted/20">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
