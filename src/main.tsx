import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom"
import { AppLayout } from './components/layout'
import { Dashboard } from './pages/Dashboard'
import { Benchmark } from './pages/Benchmark'
import { Planning } from './pages/Planning'
import { Inbound } from './pages/Inbound'
import { Login } from './pages/Login'
import { Guidelines } from './pages/Guidelines'
import { CandidateProfile } from './pages/CandidateProfile'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import './index.css'

const ProtectedRoute = () => {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  // Se estiver logado, rende o layout wrapper (AppLayout) dos filhos
  return <Outlet />
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/benchmark" element={<Benchmark />} />
              <Route path="/inbound" element={<Inbound />} />
              <Route path="/planning" element={<Planning />} />
              <Route path="/guidelines" element={<Guidelines />} />
              <Route path="/perfil-candidato" element={<CandidateProfile />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
)
