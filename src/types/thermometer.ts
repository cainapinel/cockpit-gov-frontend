// Tipos TypeScript do Termômetro de Redes Sociais
// Espelham exatamente o payload gerado pelo ThermometerEngine no backend.

export interface ThermometerMencao {
  autor: string;
  plataforma: "Instagram" | "Facebook" | "X";
  texto: string;
  data: string;
  likes: number;
  sentimento: "Crítico" | "Neutro" | "Positivo";
  /** URL do post original. Fase 1: URL verossímil gerada pelo Gemini. Fase 2: URL real via Apify. */
  url?: string;
}

export interface ThermometerPalavraChave {
  palavra: string;
  mencoes: number;
  tendencia: string;
  sentimento: "Crítico" | "Neutro" | "Positivo";
  exemplos_mencoes: ThermometerMencao[];
}

export interface ThermometerDor {
  ranking: number;
  titulo: string;
  descricao: string;
  crescimento: string;
  contexto: string;
}

export interface ThermometerData {
  municipio: string;
  periodo: string;
  data_analise: string;
  termometro: {
    temperatura_geral: number;
    sentimento_critico: number;
    sentimento_neutro: number;
    sentimento_positivo: number;
    nivel_tensao: "BAIXO" | "MÉDIO" | "ALTO" | "CRÍTICO";
  };
  metricas: {
    mencoes_totais: number;
    crescimento_mencoes: string;
    engajamento_total: number;
    influenciadores: number;
  };
  dores_principais: ThermometerDor[];
  palavras_chave: ThermometerPalavraChave[];
  recomendacoes: {
    evitar: string[];
    priorizar: string[];
  };
  alerta_crise: {
    nivel: string;
    descricao: string;
    recomendacoes: string;
  };
  // Campos internos adicionados pelo backend
  _cached?: boolean;
  _id?: number;
  _data_geracao?: string;
  /** "real" = dados coletados via Apify | "analytical" = análise gerada pelo Gemini */
  _data_source?: "real" | "analytical";
  /** Total de posts reais coletados pelo Apify (somente quando _data_source = "real") */
  _posts_collected?: number;
}

/** Resumo condensado para incluir no Briefing de Rua */
export interface ThermometerSummary {
  temperatura_geral: number;
  nivel_tensao: "BAIXO" | "MÉDIO" | "ALTO" | "CRÍTICO";
  sentimento_critico: number;
  sentimento_positivo: number;
  mencoes_totais: number;
  dores_principais: Pick<ThermometerDor, "ranking" | "titulo" | "descricao" | "crescimento">[];
  recomendacoes: { evitar: string[]; priorizar: string[] };
  alerta_crise: { nivel: string; descricao: string };
  periodo: string;
}
