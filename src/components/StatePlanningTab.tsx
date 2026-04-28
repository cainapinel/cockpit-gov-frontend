import { useState } from 'react';
import { Sparkles, Loader2, Edit3, Trash2, Check, Target } from 'lucide-react';

type EixoTema = 'Saúde' | 'Infraestrutura' | 'Segurança' | 'Educação' | 'Economia';

export interface PlanProposal {
  id: string;
  eixo: EixoTema;
  titulo: string;
  texto: string;
}

export function StatePlanningTab() {
  const [tema, setTema] = useState('');
  const [eixo, setEixo] = useState<EixoTema | ''>('');
  const [isLoading, setIsLoading] = useState(false);
  const [propostas, setPropostas] = useState<PlanProposal[]>([
    {
      id: '1',
      eixo: 'Saúde',
      titulo: 'Expansão de Telemedicina Rural',
      texto: 'Implementação de clínicas descentralizadas utilizando infraestrutura de internet satelital para garantir atendimento médico remoto a populações com baixo índice de acesso a hospitais estaduais.'
    },
    {
      id: '2',
      eixo: 'Infraestrutura',
      titulo: 'Monitoramento Preditivo de Rodovias',
      texto: 'Uso de inteligência artificial acoplada a drones para identificar fissuras estruturais em pontes e asfalto de rodovias de alto tráfego antes que ocorram falhas severas, reduzindo custos de manutenção corretiva.'
    }
  ]);

  const eixosOpcoes: EixoTema[] = ['Saúde', 'Infraestrutura', 'Segurança', 'Educação', 'Economia'];

  // Passo 3: Mapa de Cores Estrito por Categoria
  const getBadgeColor = (category: EixoTema) => {
    switch (category) {
      case 'Saúde': return 'bg-green-100 text-green-800 border-green-200';
      case 'Infraestrutura': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Segurança': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Educação': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Economia': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleGenerate = () => {
    if (!tema || !eixo) return;
    setIsLoading(true);
    // Simulando motor de IA do Cockpit
    setTimeout(() => {
        const nova_proposta: PlanProposal = {
            id: Date.now().toString(),
            eixo: eixo as EixoTema,
            titulo: `Diretriz Gerada: ${tema.split(' ')[0]}...`,
            texto: `[Diretriz formulada via IA abordando o tema: ${tema}]. Foco principal no aprimoramento orgânico de métricas intersetoriais alinhadas ao orçamento estadual anual. O detalhamento do plano de ação exige revisão orçamentária prévia.`
        };
        setPropostas([nova_proposta, ...propostas]);
        setIsLoading(false);
        setTema('');
        setEixo('');
    }, 2500);
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-4 space-y-8">
      {/* Passo 1: Refatoração do Container de Geração (Formulário) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col space-y-6">
        <div>
           <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
             <Target className="w-5 h-5 text-gray-500" /> Diretriz Estratégica (Macro)
           </h3>
           <p className="text-sm text-gray-500 mt-1">Forneça o escopo temático para que o motor de Inteligência Governamental desenhe a nova proposta.</p>
        </div>

        {/* Grid Container */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1.5">Contexto ou Tema Principal</label>
            <textarea 
              value={tema}
              onChange={(e) => setTema(e.target.value)}
              disabled={isLoading}
              className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600 resize-none h-24 disabled:bg-gray-50 disabled:cursor-not-allowed transition-all"
              placeholder="Descreva a meta ou problema estrutural da gestão..."
            />
            {/* Texto de apoio sutil */}
            <p className="mt-2 text-xs text-gray-500">
                Dica: Seja específico para a IA. Ex: 'Uso de drones para monitoramento de rodovias'.
            </p>
          </div>

          <div className="md:col-span-1 flex flex-col">
             <label className="text-sm font-medium text-gray-700 mb-1.5">Eixo de Estruturação</label>
             <select 
               value={eixo}
               onChange={(e) => setEixo(e.target.value as EixoTema)}
               disabled={isLoading}
               className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:ring-2 focus:ring-blue-600 bg-white disabled:bg-gray-50 disabled:cursor-not-allowed transition-all"
             >
                <option value="" disabled>Selecionar Eixo Temático...</option>
                {eixosOpcoes.map(e => (
                    <option key={e} value={e}>{e}</option>
                ))}
             </select>
          </div>
        </div>

        {/* Passo 2: Upgrade do Botão de IA */}
        <div className="flex justify-end pt-4 border-t border-gray-100">
            <button
              onClick={handleGenerate}
              disabled={isLoading || !tema.trim() || !eixo}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg transition-all font-medium text-sm
                disabled:opacity-50 disabled:cursor-not-allowed
                bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md"
            >
                {isLoading ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Gerando diretrizes...
                    </>
                ) : (
                    <>
                        <Sparkles className="w-4 h-4" />
                        Gerar Proposta via IA
                    </>
                )}
            </button>
        </div>
      </div>

      {/* Visualização de Propostas */}
      <div className="space-y-5">
         <h4 className="font-semibold text-gray-800 text-lg">Propostas Recentes e Diretrizes Estruturadas</h4>
         
         <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
           {propostas.map((prop) => (
             /* Passo 3: Cards de Propostas Ricos */
             <div key={prop.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col hover:shadow-md transition-all duration-200">
               <div className="flex items-center justify-between mb-4">
                 {/* Badges Dinâmicas */}
                 <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getBadgeColor(prop.eixo)}`}>
                   {prop.eixo}
                 </span>
               </div>
               
               {/* Tipografia */}
               <h5 className="text-lg font-semibold text-gray-900 mb-2.5 tracking-tight">{prop.titulo}</h5>
               <p className="flex-1 leading-relaxed text-gray-700 text-sm line-clamp-3" title="Clique em 'Editar' para ver tudo.">
                 {prop.texto}
               </p>

               {/* Passo 4: Action Bar */}
               <div className="flex items-center justify-between border-t border-gray-100 mt-5 pt-4">
                  <div className="flex gap-2">
                    <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white hover:text-blue-600 hover:bg-blue-50 border border-transparent rounded-md transition-colors">
                      <Edit3 className="w-3.5 h-3.5" /> Editar
                    </button>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white hover:text-red-600 hover:bg-red-50 border border-transparent rounded-md transition-colors group">
                      <Trash2 className="w-3.5 h-3.5 group-hover:text-red-600 transition-colors" /> Excluir
                    </button>
                  </div>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-900 hover:text-white rounded-md transition-all">
                    <Check className="w-3.5 h-3.5" /> Aprovar / Salvar
                  </button>
               </div>
             </div>
           ))}
         </div>
      </div>
    </div>
  );
}
