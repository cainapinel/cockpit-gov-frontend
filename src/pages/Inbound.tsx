import { useState, useRef, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { UploadCloud, FileText, CheckCircle2, Loader2, RefreshCw, Trash2, AlertCircle, Download, CreditCard, Eye, FileSpreadsheet, X } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DataIntegrationsGrid } from './components/DataIntegrationsGrid';
import { useDocumentStream } from '@/hooks/useDocumentStream';

const categoryConfig: Record<string, { label: string, color: string }> = {
  'expectation': { label: 'População', color: 'bg-emerald-100 text-emerald-800 border-transparent' },
  'candidate': { label: 'Material do Candidato', color: 'bg-cyan-600 text-white font-medium border-transparent' },
  'database': { label: 'Base Matemática', color: 'bg-indigo-500 text-white font-medium border-transparent' }
};

function EmendasUploader() {
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ imported?: number; errors?: string[]; message?: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setResult(null);
    try {
      const formData = new FormData();
      Array.from(files).forEach(f => formData.append('files', f));
      const res = await api.post('/inbound/emendas/upload/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(res.data);
    } catch (err: any) {
      setResult({ errors: [err?.response?.data?.error || err.message || 'Erro desconhecido'] });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div>
      <div
        className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-blue-300 rounded-lg cursor-pointer hover:bg-blue-50/50 transition-colors"
        onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
        onDrop={e => { e.preventDefault(); e.stopPropagation(); handleUpload(e.dataTransfer.files); }}
        onClick={() => fileRef.current?.click()}
      >
        {uploading ? (
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        ) : (
          <UploadCloud className="w-8 h-8 text-blue-400" />
        )}
        <span className="text-sm text-muted-foreground">
          {uploading ? 'Importando emendas...' : 'Arraste CSVs aqui ou clique para selecionar'}
        </span>
        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          multiple
          className="hidden"
          onChange={e => handleUpload(e.target.files)}
        />
      </div>
      {result && (
        <div className={`mt-3 p-3 rounded text-sm ${result.errors && result.errors.length > 0 && !result.imported ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {result.message && <p className="font-medium">{result.message}</p>}
          {result.errors && result.errors.length > 0 && (
            <ul className="mt-1 list-disc list-inside">
              {result.errors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function StatusCell({ doc, onComplete, onConfirmBilling }: { doc: any, onComplete: () => void, onConfirmBilling: (id: number) => void }) {
  const stream = useDocumentStream(doc.id, doc.status);
  const hasCompleted = useRef(false);

  useEffect(() => {
    // 1. Houver transição real para ready ou error
    // 2. O documento já não estivesse concluído antes do SSE
    // 3. A trava do useRef garante execução singular
    if ((stream.status === 'ready' || stream.status === 'error') && doc.status !== 'ready' && doc.status !== 'error') {
      if (!hasCompleted.current) {
        hasCompleted.current = true;
        onComplete();
      }
    }
  }, [stream.status, doc.status]); // onComplete totalmente fora das dependências!

  const currentStatus = stream.status !== 'idle' ? stream.status : doc.status;

  if (currentStatus === 'error') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger><Badge variant="destructive" className="flex items-center gap-1 cursor-help"><AlertCircle className="w-3 h-3" /> Erro de Indexação</Badge></TooltipTrigger>
          <TooltipContent className="bg-destructive text-destructive-foreground max-w-xs p-2">
            <p className="text-xs font-mono">{doc.error_message || "Falha intermitente na Leitura da IA"}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (currentStatus === 'ready') {
    return <Badge className="bg-emerald-500 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Armazenado na Memória</Badge>;
  }

  if (currentStatus === 'pending_approval') {
    return (
      <div className="flex flex-col gap-2 p-2 border border-amber-200 bg-amber-50 rounded-md">
        <span className="text-xs font-medium text-amber-800 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> Taxa de Ingestão: R$ {doc.estimated_cost_brl?.toFixed(2)}
        </span>
        <span className="text-[10px] text-amber-700/80">O volume de imagens excede a cota grátis.</span>
        {/* Você pode usar a prop isConfirmingId do pai aqui para o disabled se quiser */}
        <Button size="sm" onClick={() => onConfirmBilling(doc.id)} className="h-7 text-[10px] bg-amber-500 hover:bg-amber-600">
          <CreditCard className="w-3 h-3 mr-1" /> Autorizar Cobrança
        </Button>
      </div>
    );
  }

  if (currentStatus === 'processing' || currentStatus === 'uploaded') {
    return (
      <div className="w-[200px] flex flex-col gap-1.5 p-1">
        <div className="flex justify-between text-[10px] font-mono font-medium text-primary">
          <span className="truncate pr-2" title={stream.msg}>{stream.msg || "Iniciando processamento..."}</span>
          <span>{stream.percentage}%</span>
        </div>
        <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-amber-500 transition-all duration-300 ease-out"
            style={{ width: `${stream.percentage}%` }}
          />
        </div>
      </div>
    );
  }

  return <Badge variant="outline">{currentStatus}</Badge>;
}


export function Inbound() {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'processing' | 'success' | 'error'>('idle');
  const [sourceType, setSourceType] = useState<'expectation' | 'candidate' | 'database'>('expectation');
  const [uploadQueue, setUploadQueue] = useState<{ id: string, file: File, sourceType: string, status: 'Aguardando' | 'Enviando...' | 'Processamento Iniciado' | 'Erro' }[]>([]);
  const [log, setLog] = useState<string[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);

  // Modal State
  const [docToDelete, setDocToDelete] = useState<number | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [ragContent, setRagContent] = useState<{ document_id: number, filename: string, total_chunks: number, total_pages: number, page: number, chunks: any[] } | null>(null);
  const [ragLoading, setRagLoading] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocuments = async (signal?: AbortSignal) => {
    try {
      const res = await api.get('/inbound/documents/', { signal });
      setDocuments(res.data);
    } catch (err: any) {
      if (err.name === 'CanceledError' || err.message === 'canceled') return;
      console.error("Erro ao carregar documentos", err);
    }
  };

  // 1. Initial Load & Upload Re-sync
  useEffect(() => {
    const controller = new AbortController();
    fetchDocuments(controller.signal);
    return () => controller.abort();
  }, [uploadStatus]);

  // Remover setInterval (Polling obsoleto)
  // O SSE no StatusCell vai lidar com os updates de tempo real

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelection(Array.from(e.dataTransfer.files));
    }
  };

  const addLog = (message: string) => {
    setLog(prev => [...prev.slice(-4), message]);
  };

  const handleFilesSelection = async (selectedFiles: File[]) => {
    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
      'text/csv',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' // xlsx
    ];

    const validFiles = selectedFiles.filter(f => validTypes.includes(f.type) || f.name.match(/\.(pdf|docx|csv|xlsx)$/i));

    if (validFiles.length < selectedFiles.length) {
      addLog(`⚠️ Erro: Alguns arquivos foram ignorados. Apenas PDF, DOCX, CSV e XLSX permitidos.`);
    }

    if (validFiles.length === 0) return;

    // Hidrata a Queue
    const newQueueItems = validFiles.map(f => ({
      id: Math.random().toString(36).substring(7),
      file: f,
      sourceType: sourceType,
      status: 'Aguardando' as const
    }));

    setUploadQueue(prev => [...prev, ...newQueueItems]);
    addLog(`📋 ${validFiles.length} documento(s) adicionados à fila de envio.`);
  };

  const processQueue = async () => {
    if (uploadQueue.length === 0) return;

    setUploadStatus('uploading');
    addLog("📡 Transmitindo fila de arquivos para o Motor de Inteligência...");

    // Processamento Sequencial Fila (for...of iterativo block execution)
    const itemsToUpload = uploadQueue.filter(q => q.status === 'Aguardando');

    for (const item of itemsToUpload) {
      setUploadQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'Enviando...' } : q));

      const singleFormData = new FormData();
      singleFormData.append('file', item.file);
      singleFormData.append('source_type', item.sourceType);

      try {
        await api.post('/inbound/documents/', singleFormData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setUploadQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'Processamento Iniciado' } : q));
        addLog(`✅ Arquivo enviado com sucesso: ${item.file.name}`);
      } catch (err) {
        setUploadQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'Erro' } : q));
        addLog(`❌ Falha na transmissão de rede: ${item.file.name}`);
      }
    }

    setUploadStatus('success');
    addLog(`✅ Lote submetido à Base de Dados. IA prosseguindo análise.`);

    // Limpeza da fila após finalizado (Time para visualizar os success)
    setTimeout(() => {
      setUploadQueue([]);
      setUploadStatus('idle');
    }, 4000);

    fetchDocuments();
  };

  const handleReprocess = async (id: number) => {
    setProcessingId(id);
    addLog("🔄 Injetando diretriz para reprocessamento de leitura pela IA...");
    try {
      await api.post(`/inbound/documents/${id}/reprocess/`);
      addLog("✅ Reprocessamento iniciado com sucesso.");
      fetchDocuments();
    } catch (err) {
      addLog("❌ Falha ao tentar reprocessar.");
    } finally {
      setProcessingId(null);
    }
  };
  // 1. Adicione a trava de loading local
  const [isConfirmingId, setIsConfirmingId] = useState<number | null>(null);

  // 2. Substitua a função atual
  const handleConfirmBilling = async (id: number) => {
    if (isConfirmingId === id) return; // Dropa duplo clique

    setIsConfirmingId(id);
    addLog(`💳 Solicitando autorização financeira para indexação profunda...`);

    try {
      await api.post(`/inbound/documents/${id}/confirm_premium_extraction/`, {
        force_premium_extraction: true
      });

      addLog("✅ Transação aprovada! Iniciando transcrição multimodal.");

      // O refetch muda o status de 'pending_approval' para 'processing'.
      // Como a prop muda, o StatusCell re-renderiza, escapa da tela de pagamento
      // e ativa automaticamente o fluxo do hook de Stream (EventSource).
      fetchDocuments();
    } catch (err) {
      console.error(err);
      addLog("❌ Falha na autorização financeira.");
    } finally {
      setIsConfirmingId(null);
    }
  };

  const handleDelete = async () => {
    if (!docToDelete) return;
    addLog("🗑️ Sincronizando exclusão com Acervo da Inteligência...");
    try {
      await api.delete(`/inbound/documents/${docToDelete}/`);
      addLog("✅ Exclusão vetorial e atômica bem-sucedida.");
      fetchDocuments();
    } catch (err) {
      addLog("❌ Falha crítica ao deletar. O índice pode estar dessincronizado.");
    } finally {
      setDocToDelete(null);
    }
  };

  const [csvExporting, setCsvExporting] = useState(false);

  const handleExportCsv = async () => {
    if (csvExporting) return;
    setCsvExporting(true);
    try {
      const res = await api.get('/inbound/documents/export_csv/');
      const csvText = res.data.csv_content;
      const bom = '\uFEFF';
      const blob = new Blob([bom + csvText], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', res.data.filename || 'acervo_documental.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      addLog(`📥 Tabela exportada como CSV (${res.data.total_documents} documentos).`);
    } catch (err: any) {
      console.error('Export CSV error:', err);
      addLog('❌ Falha ao exportar CSV.');
    } finally {
      setCsvExporting(false);
    }
  };

  const handleViewRag = async (id: number, page: number = 1) => {
    setRagLoading(id);
    try {
      const res = await api.get(`/inbound/documents/${id}/rag_content/`, {
        params: { page, page_size: 50 }
      });
      setRagContent(res.data);
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Falha ao carregar conteúdo RAG.';
      addLog(`❌ ${msg}`);
    } finally {
      setRagLoading(null);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Memória Estratégica Inbound</h1>
        <p className="text-muted-foreground w-3/4">
          Faça a ingestão tática de Processos do TCU, Planilhas Financeiras e Atas de Debates para alimentar a Base de Conhecimento do Cérebro Local.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Painel de Upload */}
        <Card className="bg-card text-card-foreground border-border shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">Uplink de Dados Secundários</CardTitle>
            <CardDescription>Protocolo Multiformato (.PDF, .DOCX, .CSV, .XLSX)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex border rounded-md overflow-hidden bg-muted/30">
              <button
                onClick={() => setSourceType('expectation')}
                className={`flex-1 py-2 px-1 text-[13px] font-medium transition-colors ${sourceType === 'expectation' ? 'bg-primary text-primary-foreground shadow-sm' : 'hover:bg-muted text-muted-foreground'}`}
              >
                Expectativa da População
              </button>
              <button
                onClick={() => setSourceType('candidate')}
                className={`flex-1 py-2 px-1 text-[13px] font-medium transition-colors border-l border-border/50 ${sourceType === 'candidate' ? 'bg-primary text-primary-foreground shadow-sm' : 'hover:bg-muted text-muted-foreground'}`}
              >
                Material do Candidato
              </button>
              <button
                onClick={() => setSourceType('database')}
                className={`flex-1 py-2 px-1 text-[13px] font-medium transition-colors border-l border-border/50 ${sourceType === 'database' ? 'bg-indigo-500 text-white shadow-sm' : 'hover:bg-muted text-muted-foreground'}`}
              >
                Bases de Dados Oficiais
              </button>
            </div>

            <div
              className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center transition-colors ${isDragging ? 'border-primary bg-primary/10' : 'border-border bg-card/50 hover:bg-accent'}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploadStatus === 'processing' || uploadStatus === 'uploading' ? (
                <div className="flex flex-col items-center text-primary">
                  <Loader2 className="h-12 w-12 animate-spin mb-4" />
                  <p className="font-mono text-sm uppercase tracking-widest animate-pulse">
                    {uploadStatus === 'uploading' ? "Nuvem: Enviando..." : "Traduzindo Conhecimento..."}
                  </p>
                </div>
              ) : uploadStatus === 'success' ? (
                <div className="flex flex-col items-center text-emerald-500">
                  <CheckCircle2 className="h-12 w-12 mb-4" />
                  <p className="font-mono text-sm uppercase">Completado</p>
                </div>
              ) : (
                <div className="flex flex-col items-center text-muted-foreground cursor-pointer">
                  <UploadCloud className="h-12 w-12 mb-4" />
                  <p className="font-medium text-foreground mb-1">Arraste Documentos Oficiais Aqui</p>
                  <p className="text-xs">ou clique para navegar</p>
                </div>
              )}
              <input type="file" multiple className="hidden" accept=".pdf,.docx,.csv,.xlsx" ref={fileInputRef} onChange={(e) => e.target.files && handleFilesSelection(Array.from(e.target.files))} />
            </div>

            {uploadQueue.length > 0 && (
              <div className="mt-4 p-4 border rounded-xl border-border bg-background/40">
                <h4 className="text-sm font-semibold mb-3">Fila de Upload ({uploadQueue.length})</h4>
                <div className="space-y-2 mb-4 max-h-32 overflow-y-auto">
                  {uploadQueue.map(item => (
                    <div key={item.id} className="flex items-center justify-between text-xs bg-muted/40 p-2 rounded">
                      <span className="truncate max-w-[200px] text-muted-foreground flex items-center">
                        <FileText className="inline w-3 h-3 mr-1" />
                        {item.file.name}
                        <Badge variant="outline" className={`ml-2 text-[10px] py-0 ${categoryConfig[item.sourceType]?.color || 'bg-red-500 text-white'}`}>
                          {categoryConfig[item.sourceType]?.label || `DESC: ${item.sourceType}`}
                        </Badge>
                      </span>
                      <span className={`${item.status === 'Enviando...' ? 'text-amber-500 animate-pulse' : item.status === 'Processamento Iniciado' ? 'text-emerald-500' : item.status === 'Erro' ? 'text-destructive' : 'text-zinc-500'}`}>
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
                <Button
                  className="w-full h-10 uppercase tracking-wide font-bold transition-all text-xs"
                  disabled={uploadStatus === 'uploading' || uploadStatus === 'processing'}
                  onClick={processQueue}
                >
                  🚀 Enviar Arquivos
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Console de Telemetria */}
        <Card className="bg-card text-card-foreground border-border font-mono text-xs flex flex-col">
          <CardHeader className="pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <CardTitle className="text-sm text-emerald-500 tracking-widest uppercase">Terminal do Acervo IA</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-4 flex-1 overflow-auto bg-background text-foreground">
            {log.length === 0 ? (
              <p className="text-muted-foreground">Aguardando inserção de dados...</p>
            ) : (
              <ul className="space-y-2">
                {log.map((msg, i) => (
                  <li key={i} className="opacity-90">{msg}</li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-10 mb-6">
        <h2 className="text-xl font-semibold mb-4 border-b pb-2">Informações Externas</h2>
        <DataIntegrationsGrid />
      </div>

      {/* Upload Emendas Parlamentares (CSV) */}
      <div className="mt-6 mb-6">
        <Card className="border-dashed border-2 border-blue-200 bg-blue-50/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-blue-600" />
              Emendas Parlamentares — Upload CSV
            </CardTitle>
            <CardDescription>
              Faça upload dos CSVs de emendas parlamentares do <a href="https://portaldatransparencia.gov.br/download-de-dados/emendas" target="_blank" rel="noopener" className="text-blue-600 underline">Portal da Transparência</a>. 
              O sistema filtra automaticamente as emendas destinadas a municípios do RJ.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EmendasUploader />
          </CardContent>
        </Card>
      </div>

      {/* Histórico Inbound - Tabela RAG Resiliente */}
      <div className="mt-10">
        <div className="flex items-center justify-between mb-4 border-b pb-2">
          <h2 className="text-xl font-semibold">Acervo Documental da IA</h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={async () => {
              try {
                const res = await api.post('/inbound/documents/reset_stuck/');
                addLog(`🔄 ${res.data.message}`);
                fetchDocuments();
              } catch { addLog('❌ Falha ao resetar documentos travados.'); }
            }} className="flex items-center gap-2 text-amber-500 border-amber-500/30 hover:bg-amber-500/10">
              <RefreshCw className="h-4 w-4" /> Resetar Travados
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportCsv} disabled={csvExporting} className="flex items-center gap-2">
              {csvExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />} {csvExporting ? 'Exportando...' : 'Exportar CSV'}
            </Button>
          </div>
        </div>
        <Card className="border-border bg-card/50">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="w-[80px]">Docs</TableHead>
                  <TableHead>Arquivo</TableHead>
                  <TableHead className="hidden md:table-cell">Preview Extraído</TableHead>
                  <TableHead className="w-[180px]">Status (Análise)</TableHead>
                  <TableHead className="text-right w-[120px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc: any) => (
                  <TableRow key={doc.id} className="border-border">
                    <TableCell>
                      <FileText className="h-5 w-5 text-muted-foreground" />
                    </TableCell>
                    <TableCell className="font-medium">
                      {doc.filename}
                      <div className="mt-1">
                        <Badge variant="outline" className={`text-[10px] py-0 ${categoryConfig[doc.source_type]?.color || 'bg-red-500 text-white font-bold animate-pulse'}`}>
                          {categoryConfig[doc.source_type]?.label || `CATEGORIA DESCONHECIDA: ${doc.source_type}`}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                      <div className="line-clamp-2 max-w-sm italic">
                        {doc.extracted_text_preview || "Sem preview."}
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusCell doc={doc} onComplete={fetchDocuments} onConfirmBilling={handleConfirmBilling} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 bg-background border-border hover:bg-accent"
                                disabled={doc.status === 'processing' || processingId === doc.id}
                                onClick={() => handleReprocess(doc.id)}
                              >
                                <RefreshCw className={`h-4 w-4 ${processingId === doc.id ? 'animate-spin text-primary' : 'text-muted-foreground'}`} />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Reprocessar Leitura</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 bg-background border-border hover:bg-accent"
                                onClick={() => handleViewRag(doc.id)}
                                disabled={doc.status !== 'ready' || ragLoading === doc.id}
                              >
                                {ragLoading === doc.id ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Visualizar Conteúdo RAG</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 bg-background border-border hover:bg-accent"
                                onClick={() => window.open(doc.file, '_blank')}
                                disabled={!doc.file}
                              >
                                <Download className="h-4 w-4 text-muted-foreground" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Baixar Arquivo</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 bg-background border-border hover:bg-destructive hover:text-destructive-foreground"
                                onClick={() => setDocToDelete(doc.id)}
                              >
                                <Trash2 className="h-4 w-4 text-muted-foreground" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Remover da Base de Conhecimento</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {documents.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground italic">
                      Nenhum documento anexado. O Cérebro da Inteligência está limpo.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={docToDelete !== null} onOpenChange={(open: boolean) => !open && setDocToDelete(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive flex items-center gap-2">
              <AlertCircle className="w-5 h-5" /> Atenção Crítica
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja prosseguir? Esta ação excluirá este arquivo integralmente da base mental da inteligência artificial. Isso empobrecerá temporariamente a capacidade de análise política dela.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-border">Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive hover:bg-destructive/90 text-destructive-foreground" onClick={handleDelete}>
              Confirmar Exclusão
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* RAG Content Viewer */}
      {ragContent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-xl shadow-2xl w-[90vw] max-w-4xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2"><Eye className="h-5 w-5 text-primary" /> Conteúdo Extraído (RAG)</h3>
                <p className="text-sm text-muted-foreground">{ragContent.filename} — {ragContent.total_chunks} chunks indexados (Página {ragContent.page}/{ragContent.total_pages})</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setRagContent(null)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {ragContent.chunks.map((chunk: any) => (
                <div key={chunk.index} className="border border-border rounded-lg p-4 bg-background/50">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="text-xs">Chunk #{chunk.index}</Badge>
                    {chunk.metadata?.page && <span className="text-[10px] text-muted-foreground">Página {chunk.metadata.page}</span>}
                  </div>
                  <pre className="text-xs text-foreground/90 whitespace-pre-wrap font-mono leading-relaxed max-h-64 overflow-y-auto">{chunk.content}</pre>
                </div>
              ))}
              {ragContent.chunks.length === 0 && (
                <p className="text-center text-muted-foreground italic py-10">Nenhum chunk encontrado no índice vetorial para este documento.</p>
              )}
            </div>
            {ragContent.total_pages > 1 && (
              <div className="flex items-center justify-between px-6 py-3 border-t border-border">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={ragContent.page <= 1 || ragLoading !== null}
                  onClick={() => handleViewRag(ragContent.document_id, ragContent.page - 1)}
                >
                  ← Anterior
                </Button>
                <span className="text-xs text-muted-foreground">
                  Página {ragContent.page} de {ragContent.total_pages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={ragContent.page >= ragContent.total_pages || ragLoading !== null}
                  onClick={() => handleViewRag(ragContent.document_id, ragContent.page + 1)}
                >
                  Próxima →
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
