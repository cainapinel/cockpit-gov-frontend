import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import { Trash2, AlertCircle, PlusCircle, User, ShieldAlert, History, Target, Scale } from "lucide-react";

interface Fact {
  id: number;
  category: string;
  content: string;
  importance: number;
}

interface ProfileData {
  id: number;
  name: string;
  campaign_region: string;
  master_prompt: string;
  current_approval_rating: number | null;
  facts: Fact[];
}

const CATEGORIES = [
  { value: 'biography', label: 'Biografia', icon: User },
  { value: 'history', label: 'Histórico Político', icon: History },
  { value: 'proposals', label: 'Propostas', icon: Target },
  { value: 'vulnerabilities', label: 'Vulnerabilidades', icon: ShieldAlert },
  { value: 'values', label: 'Valores e Ideologia', icon: Scale },
];

export function CandidateProfile() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  
  // State from Create Fact form
  const [showForm, setShowForm] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('biography');
  const [newImportance, setNewImportance] = useState('3');
  const [formError, setFormError] = useState('');

  const [creatingProfile, setCreatingProfile] = useState(false);
  const [matrixName, setMatrixName] = useState('');
  const [matrixRegion, setMatrixRegion] = useState('');
  
  // Master Prompt States
  const [localMasterPrompt, setLocalMasterPrompt] = useState('');
  const [savingMemory, setSavingMemory] = useState(false);
  const [extractingFacts, setExtractingFacts] = useState(false);
  
  // Approval Rating State
  const [localApproval, setLocalApproval] = useState<string>('');

  const fetchProfile = async () => {
    try {
      setPageError('');
      const res = await api.get('/personas/candidate-profile/');
      // Singleton pattern: The API now returns the object directly or null
      if (res.data && Object.keys(res.data).length > 0) {
        setProfile(res.data);
        if (res.data.master_prompt) {
           setLocalMasterPrompt(res.data.master_prompt);
        }
        setLocalApproval(res.data.current_approval_rating != null ? String(res.data.current_approval_rating) : '');
      } else {
        setProfile(null);
      }
    } catch (err: any) {
      console.error(err);
      setPageError('Erro ao carregar o Perfil do Candidato. Verifique a rede ou CORS.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);
  
  const handleCreateMatrix = async () => {
     if (!matrixName.trim()) { setPageError('O nome do alvo não pode ficar em branco.'); return; }
     setLoading(true);
     try {
       await api.post('/personas/candidate-profile/', {
          name: matrixName,
          campaign_region: matrixRegion
       });
       await fetchProfile();
       setCreatingProfile(false);
     } catch (err) {
       console.error(err);
       setPageError('Erro ao registrar matriz central.');
       setLoading(false);
     }
  };

  const handleAddFact = async () => {
    if (!profile) return;
    if (!newContent.trim()) {
      setFormError('O conteúdo do fato não pode estar vazio.');
      return;
    }
    
    try {
      setFormError('');
      await api.post('/personas/facts/', {
        profile: profile.id,
        category: newCategory,
        content: newContent,
        importance: parseInt(newImportance)
      });
      // Refresh list
      await fetchProfile();
    } catch (err: any) {
      console.error(err);
      setFormError(err.response?.data?.detail || 'Falha ao salvar o novo fato.');
    }
  };

  const handleSaveMemory = async () => {
     setSavingMemory(true);
     setPageError('');
     try {
        await api.post('/personas/candidate-profile/', {
           name: profile?.name,
           campaign_region: profile?.campaign_region,
           master_prompt: localMasterPrompt,
           current_approval_rating: localApproval.trim() !== '' ? parseFloat(localApproval) : null
        });
        await fetchProfile();
     } catch (e) {
        setPageError("Falha ao salvar Memória Mestre.");
     } finally {
        setSavingMemory(false);
     }
  };

  const handleExtractFacts = async () => {
     setExtractingFacts(true);
     setPageError('');
     try {
        // Garantimos que está salvo no banco antes de mandar a IA ler
         await api.post('/personas/candidate-profile/', {
            name: profile?.name,
            campaign_region: profile?.campaign_region,
            master_prompt: localMasterPrompt,
            current_approval_rating: localApproval.trim() !== '' ? parseFloat(localApproval) : null
         });
        
        await api.post('/personas/candidate-profile/process-memory/');
        
        // Refresh Facts list
        await fetchProfile();
        // Feedback de sucesso
        setPageError('');
     } catch (e: any) {
        console.error("Erro na extração:", e.response?.data || e.message);
        setPageError(e.response?.data?.message || "Erro ao extrair dados. O formato da IA falhou, tente novamente.");
     } finally {
        setExtractingFacts(false);
     }
  };

  const handleDeleteFact = async (factId: number) => {
    try {
      setPageError('');
      await api.delete(`/personas/facts/${factId}/`);
      fetchProfile();
    } catch (err: any) {
      console.error(err);
      setPageError('Falha ao excluir o fato.');
    }
  };

  const renderImportanceBadge = (importance: number) => {
    if (importance === 5) return <Badge variant="destructive">Crítico</Badge>;
    if (importance === 4) return <Badge variant="destructive" className="bg-orange-600">Alta</Badge>;
    if (importance === 3) return <Badge variant="secondary" className="bg-yellow-600 hover:bg-yellow-700 text-white">Média</Badge>;
    if (importance === 2) return <Badge variant="secondary" className="bg-blue-600 hover:bg-blue-700 text-white">Baixa</Badge>;
    return <Badge variant="outline">Trivial</Badge>;
  };

  if (loading) return <div className="p-8 text-foreground">Carregando perfil...</div>;

  if (!profile && !loading) {
     return (
        <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] p-8 text-center animate-in fade-in zoom-in duration-500">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6">
               <ShieldAlert className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Perfil de Inteligência Vazio</h1>
            <p className="text-muted-foreground mt-3 max-w-lg mx-auto text-lg">
               Bem-vindo à War Room. O primeiro passo é cadastrar o candidato matriz. Sem ele, a IA não possui viés de defesa ou referencial tático.
            </p>
            
            {!creatingProfile ? (
              <div className="mt-8">
                 <Button onClick={() => setCreatingProfile(true)} className="font-semibold px-6 py-6" size="lg">
                    <User className="mr-2 h-5 w-5" /> Criar Perfil do Candidato
                 </Button>
              </div>
            ) : (
              <div className="mt-8 w-full max-w-sm space-y-4 text-left border border-border p-6 rounded-md bg-card">
                 <div className="space-y-2">
                    <label className="text-sm">Nome Político / Matriz</label>
                    <input type="text" className="w-full bg-background border border-input rounded px-3 py-2 text-sm" placeholder="Ex: Eduardo Paes" value={matrixName} onChange={e => setMatrixName(e.target.value)} />
                 </div>
                 <div className="space-y-2">
                    <label className="text-sm">Região de Abrangência</label>
                    <input type="text" className="w-full bg-background border border-input rounded px-3 py-2 text-sm" placeholder="Ex: Rio de Janeiro" value={matrixRegion} onChange={e => setMatrixRegion(e.target.value)} />
                 </div>
                 <div className="flex justify-end gap-2 pt-2">
                    <Button variant="ghost" onClick={() => setCreatingProfile(false)}>Cancelar</Button>
                    <Button onClick={handleCreateMatrix}>Salvar Matriz</Button>
                 </div>
              </div>
            )}
            
            {pageError && (
               <div className="mt-8 p-4 bg-red-900/20 text-red-400 rounded-md border border-red-900/50 flex items-center gap-2 max-w-md mx-auto">
                 <AlertCircle className="w-5 h-5 flex-shrink-0" />
                 <span className="text-sm text-left">{pageError}</span>
               </div>
            )}
        </div>
     );
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Alvo Estratégico: {profile?.name}
          </h2>
          <p className="text-muted-foreground">
            Base central de inteligência e pontos cegos. ({profile?.campaign_region})
          </p>
        </div>
        {/* Índice de Aprovação Inline */}
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-muted-foreground whitespace-nowrap">Aprovação Global:</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              className="w-24 bg-background border border-input rounded-md px-3 py-2 text-sm font-bold text-center"
              placeholder="N/D"
              value={localApproval}
              onChange={e => setLocalApproval(e.target.value)}
            />
            <span className="text-sm text-muted-foreground">%</span>
            <Button
              variant="secondary"
              size="sm"
              disabled={savingMemory}
              onClick={async () => {
                setSavingMemory(true);
                try {
                  await api.post('/personas/candidate-profile/', {
                    name: profile?.name,
                    campaign_region: profile?.campaign_region,
                    master_prompt: localMasterPrompt,
                    current_approval_rating: localApproval.trim() !== '' ? parseFloat(localApproval) : null
                  });
                  await fetchProfile();
                } catch { setPageError('Falha ao salvar aprovação.'); }
                finally { setSavingMemory(false); }
              }}
            >
              Salvar
            </Button>
          </div>
        </div>
      </div>

      {pageError && (
        <div className="p-4 bg-red-900/30 text-red-400 border border-red-900/50 flex items-center gap-2 rounded-md">
           <AlertCircle className="w-5 h-5" />
           {pageError}
        </div>
      )}

      {/* Seção Superior: Memória Mestre */}
      <Card className="border-border bg-card">
         <CardHeader className="pb-3 border-b border-border/50 bg-background/30 flex flex-row items-center justify-between">
            <div>
               <CardTitle className="text-xl">Memória Mestre e Diretrizes</CardTitle>
               <CardDescription>
                  A verdade absoluta do candidato. Cole aqui biografias, planos de governo longos e red flags sem filtro.
               </CardDescription>
            </div>
            <div className="flex gap-2">
               <Button variant="secondary" onClick={handleSaveMemory} disabled={savingMemory}>
                  {savingMemory ? "Salvando..." : "Salvar Texto"}
               </Button>
               <Button onClick={handleExtractFacts} disabled={extractingFacts || !localMasterPrompt.trim()} className="bg-indigo-600 hover:bg-indigo-700 text-white border border-indigo-500 shadow-lg shadow-indigo-900/20">
                  <span className="mr-2">✨</span> {extractingFacts ? "Analisando 0/1..." : "Extrair Fatos com IA"}
               </Button>
            </div>
         </CardHeader>
         <CardContent className="p-0">
             <textarea 
                className="w-full h-48 bg-transparent border-0 p-4 resize-y text-sm focus:ring-0 leading-relaxed text-foreground placeholder:text-muted-foreground/60 transition-colors hover:bg-background/20"
                placeholder="Insira todo o contexto global do candidato. O motor LLM lerá este texto para definir os debates, simular o plano de governo ou estruturar fatos avulsos logo abaixo..."
                value={localMasterPrompt}
                onChange={e => setLocalMasterPrompt(e.target.value)}
             />
         </CardContent>
      </Card>

      <div className="flex items-center justify-between space-y-2 pt-4">
        <h3 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Matriz de Fatos Estruturados
        </h3>
        <div className="flex items-center space-x-2">
          {!showForm && (
            <Button onClick={() => setShowForm(true)} variant="outline" className="text-xs">
              <PlusCircle className="mr-2 h-4 w-4" /> Cadastrar Fato Sensível Manualmente
            </Button>
          )}
        </div>
      </div>

      {showForm && (
        <Card className="border-indigo-900/50 bg-indigo-950/20">
          <CardHeader>
            <CardTitle className="text-lg">Injetar Novo Fato no Motor</CardTitle>
            <CardDescription>Estes dados serão utilizados ativamente pela IA local durante sabatinas e dox.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {formError && (
              <div className="p-3 bg-red-950/50 text-red-400 border border-red-900 rounded text-sm">
                {formError}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Categoria</label>
                <Select value={newCategory} onValueChange={setNewCategory}>
                  <SelectTrigger className="w-full bg-background/50">
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Letalidade (Importância)</label>
                <Select value={newImportance} onValueChange={setNewImportance}>
                  <SelectTrigger className="w-full bg-background/50 text-red-200">
                    <SelectValue placeholder="Pesos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 - Crítico/Contraditório (Alvo Alto)</SelectItem>
                    <SelectItem value="4">4 - Alta (Uso Padrão)</SelectItem>
                    <SelectItem value="3">3 - Média (Tático)</SelectItem>
                    <SelectItem value="2">2 - Baixa (Ruído)</SelectItem>
                    <SelectItem value="1">1 - Trivial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Conteúdo / Prova / Fato</label>
              <textarea 
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Exemplo: Na prestação de contas do TCE-21 a construtora XYZ possuía laços..."
                value={newContent}
                onChange={e => setNewContent(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
             <Button variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
             <Button variant="destructive" onClick={handleAddFact}>Adicionar à Base</Button>
          </CardFooter>
        </Card>
      )}

      <Tabs defaultValue="vulnerabilities" className="space-y-4">
        <TabsList className="bg-background/50 border border-border">
          {CATEGORIES.map(cat => (
            <TabsTrigger key={cat.value} value={cat.value} className="data-[state=active]:bg-secondary">
               <cat.icon className="w-4 h-4 mr-2" />
               <span className="hidden sm:inline">{cat.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>
        
        {CATEGORIES.map(cat => {
            const filteredFacts = profile?.facts.filter(f => f.category === cat.value).sort((a,b) => b.importance - a.importance) || [];
            return (
              <TabsContent key={cat.value} value={cat.value} className="space-y-4">
                 {filteredFacts.length === 0 ? (
                    <div className="p-8 text-center border border-dashed border-border rounded-lg bg-background/30">
                       <p className="text-muted-foreground">Nenhum dado sensível mapeado na categoria "{cat.label}".</p>
                    </div>
                 ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                       {filteredFacts.map(fact => (
                          <Card key={fact.id} className={`bg-background/60 shadow-none border ${fact.importance >= 4 ? 'border-red-900/50 bg-red-950/10' : 'border-border'}`}>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                               <CardTitle className="text-sm font-medium text-foreground">Fato Registrado</CardTitle>
                               {renderImportanceBadge(fact.importance)}
                            </CardHeader>
                            <CardContent>
                               <p className="text-sm text-muted-foreground leading-relaxed mt-1">
                                  {fact.content}
                               </p>
                            </CardContent>
                            <CardFooter className="pt-0 justify-end">
                               <Button variant="ghost" size="icon" onClick={() => handleDeleteFact(fact.id)} className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-950/50">
                                  <Trash2 className="h-4 w-4" />
                               </Button>
                            </CardFooter>
                          </Card>
                       ))}
                    </div>
                 )}
              </TabsContent>
            );
        })}
      </Tabs>
    </div>
  );
}
