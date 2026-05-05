import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Database, Loader2, RefreshCw, AlertCircle, CheckCircle2, ServerOff, XCircle, Clock } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface Integration {
    id: number;
    name: string;
    display_name: string;
    description: string;
    is_active: boolean;
    last_synced: string | null;
    sync_started_at: string | null;
    sync_timeout_seconds: number;
    status: 'idle' | 'syncing' | 'processing' | 'success' | 'error' | 'cancelled' | 'timeout';
    last_error_message: string | null;
}

export function DataIntegrationsGrid() {
    const [integrations, setIntegrations] = useState<Integration[]>([]);
    const [loading, setLoading] = useState(true);
    const [rawErrors, setRawErrors] = useState<Record<number, string>>({});

    const fetchIntegrations = async () => {
        try {
            const res = await api.get('/data_ingestion/integrations/');
            setIntegrations(res.data);
            setLoading(false);
        } catch (error) {
            console.error("Falha ao carregar integrações", error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchIntegrations();
        
        // Polling para quando houver tasks rodando em background (syncing ou processing)
        const interval = setInterval(() => {
            setIntegrations(prev => {
                const hasRunningTask = prev.some(i => i.status === 'syncing' || i.status === 'processing');
                if (hasRunningTask) {
                    fetchIntegrations();
                }
                return prev;
            });
        }, 3000);
        
        return () => clearInterval(interval);
    }, []);

    const toggleIntegration = async (id: number, currentStatus: boolean) => {
        setIntegrations(prev => prev.map(i => i.id === id ? {...i, is_active: !currentStatus} : i));
        try {
            await api.patch(`/data_ingestion/integrations/${id}/`, { is_active: !currentStatus });
        } catch (error) {
            console.error("Falha ao salvar estado", error);
            // Rollback
            setIntegrations(prev => prev.map(i => i.id === id ? {...i, is_active: currentStatus} : i));
        }
    };

    const triggerSync = async (id: number) => {
        // Optimistic UI Update
        setIntegrations(prev => prev.map(i => i.id === id ? {...i, status: 'syncing', sync_started_at: new Date().toISOString()} : i));
        try {
            const res = await api.post(`/data_ingestion/integrations/${id}/trigger_sync/`);
            if (res.status === 200) {
                 setRawErrors(prev => ({...prev, [id]: ''}));
                 // Polling will pick up the status change
            }
        } catch (error: any) {
             console.error("Falha a disparar sync", error);
             const data = error.response?.data;
             
             if (data?.raw_response) {
                 setRawErrors(prev => ({...prev, [id]: String(data.raw_response)}));
             }
             
             const errorMsg = data?.error || data?.detail || "Falha ao iniciar sincronização.";
             setIntegrations(prev => prev.map(i => i.id === id ? {
                 ...i, 
                 status: 'error', 
                 last_error_message: errorMsg
             } : i));
             
             setTimeout(fetchIntegrations, 1000);
        }
    };

    const cancelSync = async (id: number) => {
        try {
            await api.post(`/data_ingestion/integrations/${id}/cancel_sync/`);
            setIntegrations(prev => prev.map(i => i.id === id ? {...i, status: 'cancelled', last_error_message: 'Cancelado pelo usuário.'} : i));
            setTimeout(fetchIntegrations, 1000);
        } catch (error: any) {
            console.error("Falha ao cancelar sync", error);
        }
    };

    const getElapsed = (intg: Integration): string | null => {
        if (intg.status !== 'syncing' || !intg.sync_started_at) return null;
        const elapsed = Math.floor((Date.now() - new Date(intg.sync_started_at).getTime()) / 1000);
        const mins = Math.floor(elapsed / 60);
        const secs = elapsed % 60;
        return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
    };

    const getStatusIndicator = (intg: Integration) => {
        const elapsed = getElapsed(intg);
        
        if (intg.status === 'error') {
            return (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Badge variant="destructive" className="flex items-center gap-1 cursor-help"><AlertCircle className="w-3 h-3"/> Erro</Badge>
                        </TooltipTrigger>
                        <TooltipContent className="bg-destructive max-w-[250px]">
                            {intg.last_error_message || "Falha desconhecida de rede"}
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            );
        }
        if (intg.status === 'timeout') {
            return (
                <Badge variant="destructive" className="flex items-center gap-1">
                    <Clock className="w-3 h-3"/> Timeout
                </Badge>
            );
        }
        if (intg.status === 'cancelled') {
            return (
                <Badge variant="secondary" className="flex items-center gap-1 text-orange-500">
                    <XCircle className="w-3 h-3"/> Cancelado
                </Badge>
            );
        }
        if (intg.status === 'success') {
             return <Badge className="bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/30 border-0 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Sincronizado</Badge>;
        }
        if (intg.status === 'syncing') {
             return (
                <Badge variant="secondary" className="flex items-center gap-1 text-amber-500 animate-pulse">
                    <Loader2 className="w-3 h-3 animate-spin"/> {elapsed ? `Rodando ${elapsed}` : 'Conectando...'}
                </Badge>
             );
        }
        if (intg.status === 'processing') {
             return <Badge variant="secondary" className="flex items-center gap-1 text-sky-500 animate-pulse"><Loader2 className="w-3 h-3 animate-spin"/> Traduzindo (IA)...</Badge>;
        }
        return <Badge variant="outline" className="text-muted-foreground border-border">Aguardando Ordens</Badge>;
    };

    if (loading) {
        return <div className="h-40 flex items-center justify-center border border-border rounded-xl bg-card animate-pulse"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground"/></div>;
    }

    if (integrations.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-10 px-4 border-2 border-dashed border-border rounded-xl bg-card/30 text-center transition-all">
                <div className="p-4 bg-muted/50 rounded-full mb-4">
                    <ServerOff className="w-8 h-8 text-muted-foreground/60" />
                </div>
                <h3 className="text-sm font-semibold mb-2">Nenhum Conector de Dados Disponível</h3>
                <p className="text-xs text-muted-foreground max-w-sm">
                    Nenhuma integração externa está ativa ou configurada no banco de dados no momento. As pontes de conexão com TSE e IBGE requerem o provisionamento pelo administrador da plataforma.
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {integrations.map(intg => (
                <Card key={intg.id} className="bg-card text-card-foreground border-border flex flex-col transition-all hover:bg-accent hover:text-accent-foreground">
                    <CardContent className="p-5 flex flex-col flex-1 h-full">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-muted rounded-lg border border-border">
                                    <Database className={`w-5 h-5 ${intg.is_active ? 'text-primary' : 'text-muted-foreground'}`} />
                                </div>
                                <h3 className="font-semibold text-sm">{intg.display_name}</h3>
                            </div>
                            <Switch 
                                checked={intg.is_active} 
                                onCheckedChange={() => toggleIntegration(intg.id, intg.is_active)}
                                className="data-[state=checked]:bg-primary"
                            />
                        </div>
                        
                        <p className="text-xs text-muted-foreground flex-1 mb-4 leading-relaxed">
                            {intg.description}
                        </p>
                        
                        <div className="mt-auto space-y-4">
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-muted-foreground">
                                    Último Sync: {intg.last_synced ? new Date(intg.last_synced).toLocaleString('pt-BR') : 'Nunca'}
                                </span>
                                {getStatusIndicator(intg)}
                            </div>
                            
                            <Button 
                                variant={intg.is_active ? "default" : "secondary"}
                                className={`w-full text-xs h-9 transition-colors ${!intg.is_active && 'opacity-50'}`}
                                disabled={!intg.is_active || intg.status === 'processing'}
                                onClick={() => {
                                    if (intg.status === 'syncing') {
                                        cancelSync(intg.id);
                                    } else {
                                        triggerSync(intg.id);
                                    }
                                }}
                            >
                                {intg.status === 'syncing' ? (
                                    <><XCircle className="w-3 h-3 mr-2" /> Cancelar Sincronização</>
                                ) : intg.status === 'processing' ? (
                                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Traduzindo...</>
                                ) : (
                                    <><RefreshCw className="w-3 h-3 mr-2" /> Forçar Sincronização Agora</>
                                )}
                            </Button>
                            
                            {rawErrors[intg.id] && (
                                <div className="bg-red-100 p-4 font-mono text-sm text-red-900 border border-red-300 rounded overflow-x-auto whitespace-pre-wrap max-h-48 overflow-y-auto mt-2">
                                    {rawErrors[intg.id]}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
