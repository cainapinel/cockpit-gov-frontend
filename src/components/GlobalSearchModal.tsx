import { useState, useEffect, useRef } from 'react';
import { Search, Loader2, FileText, Database, MapPin, LayoutDashboard, Navigation, UserCheck } from 'lucide-react';
import { api } from '@/lib/api';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus on mount
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    const delayDebounceFn = setTimeout(async () => {
      try {
        const res = await api.get(`/search/global/?q=${encodeURIComponent(query)}`);
        setResults(res.data);
      } catch (err) {
        console.error("Search failed:", err);
        setResults(null);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  // Global Keydown (Escape) inside modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Search Input Area */}
        <div className="flex items-center px-4 py-3 border-b">
          <Search className="w-5 h-5 text-gray-400 mr-3" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent border-none outline-none text-lg placeholder-gray-400 text-gray-900"
            placeholder="Buscar inteligência, documentos, planos ou comandos..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {loading && <Loader2 className="w-5 h-5 text-primary animate-spin" />}
        </div>

        {/* Results Area */}
        <div className="max-h-[60vh] overflow-y-auto p-2 scrollbar-thin">
          {!query.trim() && (
            <div className="p-8 text-center text-gray-500">
              <Database className="w-10 h-10 mx-auto text-gray-300 mb-3" />
              <p>Digite para pesquisar em toda a base de dados da ATHENA.</p>
              <div className="flex gap-2 justify-center mt-4">
                 <span className="text-xs bg-gray-100 px-2 py-1 rounded">cmd+k</span> para abrir
                 <span className="text-xs bg-gray-100 px-2 py-1 rounded">esc</span> para fechar
              </div>
            </div>
          )}

          {query.trim() && results && !loading && (
            <div className="space-y-4 pb-4">
              {/* Vazio Universal */}
              {results.documents?.length === 0 && results.plans?.length === 0 && results.metrics?.length === 0 && results.navigation?.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  <p>Nenhum resultado encontrado para "{query}".</p>
                </div>
              )}

              {/* RAG Documents */}
              {results.documents?.length > 0 && (
                <div className="px-2">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2 flex items-center gap-1 mt-4">
                    <Database className="w-3 h-3" /> Inteligência Documental (RAG)
                  </h3>
                  {results.documents.map((doc: any) => (
                    <button key={doc.id} className="w-full text-left p-3 rounded-lg hover:bg-gray-100 transition-colors flex flex-col gap-1 focus:outline-none focus:ring-2 focus:ring-primary">
                      <div className="flex items-center gap-2">
                         <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded border border-blue-200 line-clamp-1">{doc.source}</span>
                      </div>
                      <p className="text-sm text-gray-700 italic line-clamp-2">"... {doc.contentPreview} ..."</p>
                    </button>
                  ))}
                </div>
              )}

              {/* Planos SQL */}
              {results.plans?.length > 0 && (
                <div className="px-2">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2 flex items-center gap-1 mt-4">
                    <FileText className="w-3 h-3" /> Planos e Estratégias
                  </h3>
                  {results.plans.map((plan: any) => (
                    <button key={plan.id} className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none">
                      <div className="flex flex-col text-left">
                        <span className="text-sm font-medium text-gray-900 flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-primary" /> {plan.title}
                        </span>
                        {plan.subtitle && <span className="text-xs text-gray-500 ml-6">↳ {plan.subtitle}</span>}
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full border ${plan.status === 'completed' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
                        {plan.status}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Informações da Matriz */}
              {results.metrics?.length > 0 && (
                <div className="px-2">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2 flex items-center gap-1 mt-4">
                    <UserCheck className="w-3 h-3" /> Fatos da Matriz de Campanha
                  </h3>
                  {results.metrics.map((fact: any) => (
                    <button key={fact.id} className="w-full flex flex-col text-left p-3 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none">
                      <span className="text-xs font-semibold text-gray-900 mb-1">{fact.title}</span>
                      <span className="text-sm text-gray-600 line-clamp-2">{fact.content}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Navigation Options */}
              {results.navigation?.length > 0 && (
                <div className="px-2">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2 flex items-center gap-1 mt-4">
                    <Navigation className="w-3 h-3" /> Comandos Rápidos
                  </h3>
                  {results.navigation.map((nav: any, idx: number) => (
                    <button key={idx} onClick={() => { window.location.href = nav.path }} className="w-full flex items-center p-3 rounded-lg hover:bg-gray-100 transition-colors text-left focus:outline-none">
                      <LayoutDashboard className="w-4 h-4 text-gray-500 mr-2" />
                      <span className="text-sm font-medium text-gray-900">{nav.title}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="bg-gray-50 border-t p-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
             <span className="text-xs text-gray-500 flex items-center gap-1"><kbd className="bg-white border rounded px-1 shadow-sm">↑</kbd><kbd className="bg-white border rounded px-1 shadow-sm">↓</kbd> Navegar</span>
             <span className="text-xs text-gray-500 flex items-center gap-1"><kbd className="bg-white border rounded px-1 shadow-sm">↵</kbd> Acessar</span>
          </div>
          <span className="text-xs font-medium text-gray-400">ATHENA Search Engine</span>
        </div>
      </div>
    </div>
  );
}
