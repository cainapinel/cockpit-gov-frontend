import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Loader2, ShieldAlert } from 'lucide-react';

export function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/token/', { username, password });
      login(response.data.access);
      // Wait for auth context state to trickle down
      setTimeout(() => navigate('/'), 100);
    } catch (err: any) {
      if (err.response?.status === 401) {
         setError('Credenciais táticas inválidas.');
      } else {
         setError('Célula do Servidor Indisponível.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-slate-100 flex items-center justify-center relative overflow-hidden">
      {/* Background Visuals */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/20 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-destructive/10 blur-[120px] rounded-full pointer-events-none"></div>
      
      {/* Login Container */}
      <Card className="w-full max-w-sm border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl z-10">
        <CardHeader className="space-y-1 text-center pb-8 border-b border-white/5">
          <div className="mx-auto mb-4">
            <img src="/logo_full_dark.png" alt="ATHENA" className="h-12 w-auto mx-auto" />
          </div>
          <CardDescription className="text-slate-400">Identificação de Operador</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Operador (Username)</label>
              <Input 
                type="text" 
                placeholder="Ex: coordenador_rj" 
                className="bg-zinc-900/50 border-white/10 text-white placeholder:text-zinc-600 h-11"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Chave de Segurança</label>
              <Input 
                type="password" 
                placeholder="••••••••" 
                className="bg-zinc-900/50 border-white/10 text-white placeholder:text-zinc-600 h-11"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
            
            {error && (
              <div className="text-destructive text-sm font-medium pt-2 pb-1 border-l-2 border-destructive pl-2">
                Falha: {error}
              </div>
            )}
            
            <Button 
              type="submit" 
              className="w-full h-11 mt-4 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
              disabled={loading || !username || !password}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Iniciar Turno"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center border-t border-white/5 pt-4">
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">
            Conexão Criptografada (AES-256)
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
