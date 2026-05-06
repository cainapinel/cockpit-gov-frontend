import { X, Heart, MessageCircle, Globe, ExternalLink } from "lucide-react";
import type { ThermometerMencao } from "@/types/thermometer";

interface MentionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  keyword: string;
  count: number;
  mentions: ThermometerMencao[];
}

// lucide-react não exporta ícones de marca — usamos badges textuais coloridos
const PLATFORM_COLOR: Record<string, string> = {
  Instagram: "bg-pink-500/20 text-pink-300 border-pink-500/30",
  Facebook:  "bg-blue-600/20 text-blue-300 border-blue-600/30",
  X:         "bg-slate-500/20 text-slate-300 border-slate-500/30",
};

const SENTIMENT_COLOR: Record<string, string> = {
  "Crítico":  "text-red-400 bg-red-500/10 border-red-500/30",
  "Neutro":   "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
  "Positivo": "text-green-400 bg-green-500/10 border-green-500/30",
};

export function MentionsModal({ isOpen, onClose, keyword, count, mentions }: MentionsModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 bg-slate-900 rounded-t-2xl flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-white capitalize">{keyword}</h2>
            <p className="text-slate-400 text-sm mt-0.5">{count} menções encontradas</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="text-slate-400 hover:text-white" size={22} />
          </button>
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          {mentions.length === 0 ? (
            <p className="text-slate-500 text-center py-8">Nenhuma menção disponível.</p>
          ) : (
            mentions.map((m, idx) => {
              const platClass = PLATFORM_COLOR[m.plataforma] ?? "bg-slate-500/20 text-slate-300 border-slate-500/30";
              const sentClass = SENTIMENT_COLOR[m.sentimento] ?? SENTIMENT_COLOR["Neutro"];

              return (
                <div
                  key={idx}
                  className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 hover:border-slate-600 transition-colors"
                >
                  {/* Cabeçalho do post */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {m.autor.charAt(1)?.toUpperCase() || "?"}
                      </div>
                      <div>
                        <p className="font-semibold text-white text-sm">{m.autor}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Globe size={11} className="text-slate-500" />
                          <span className={`text-xs px-1.5 py-0.5 rounded border font-semibold ${platClass}`}>
                            {m.plataforma}
                          </span>
                          <span className="text-xs text-slate-500">• {m.data}</span>
                        </div>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold flex-shrink-0 ${sentClass}`}>
                      {m.sentimento}
                    </span>
                  </div>

                  {/* Texto do post */}
                  <p className="text-slate-300 text-sm leading-relaxed mb-3 italic">
                    "{m.texto}"
                  </p>

                  {/* Rodapé: likes + link */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <div className="flex items-center gap-1">
                        <Heart size={12} />
                        <span>{m.likes.toLocaleString()} curtidas</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageCircle size={12} />
                        <span>Comentários</span>
                      </div>
                    </div>

                    {/* Link para o post original */}
                    {m.url ? (
                      <a
                        href={m.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors group"
                        title={`Ver post original em ${m.plataforma}`}
                      >
                        <ExternalLink size={12} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        <span>Ver post</span>
                      </a>
                    ) : (
                      <span className="text-xs text-slate-600 italic">URL indisponível</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-700 flex items-center justify-between flex-shrink-0 bg-slate-900 rounded-b-2xl">
          <p className="text-xs text-slate-600">
            Fase 1 — URLs geradas por IA como referência. Fase 2 trará links reais via Apify.
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-sm"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
