import { api } from "@/lib/api";
import type { ThermometerData } from "@/types/thermometer";

// ── Tipos de Contas Chave ────────────────────────────────────────────────────
export interface ThermometerKeyAccounts {
  id?: number;
  municipio: string;
  twitter_handles: string[];
  instagram_usernames: string[];
  facebook_pages: string[];     // URLs ou nomes de páginas do Facebook
  descricao: string;
  exists?: boolean;
  updated_at?: string;
  created?: boolean;
}

export interface ThermometerJobStatus {
  _id: number;
  status: "processing" | "done" | "error";
  municipio?: string;
  message?: string;
  error?: string;
  [key: string]: unknown;
}

/**
 * Service para o Termômetro de Redes Sociais.
 * Todas as chamadas passam pelo backend Django — nunca direto ao Gemini.
 */
export const thermometerService = {
  /**
   * Dispara a geração do termômetro (retorno imediato 202 com _id).
   * Use generateAndPoll() para aguardar o resultado final.
   */
  generate: async (
    municipio: string,
    forceRefresh = false
  ): Promise<ThermometerJobStatus | ThermometerData> => {
    const response = await api.post<ThermometerJobStatus | ThermometerData>(
      "/personas/thermometer/generate/",
      { municipio, force_refresh: forceRefresh }
    );
    return response.data;
  },

  /**
   * Faz polling do status de um job de geração.
   * Retorna os dados completos quando status=done.
   */
  pollStatus: async (id: number): Promise<ThermometerJobStatus | ThermometerData> => {
    const response = await api.get<ThermometerJobStatus | ThermometerData>(
      `/personas/thermometer/status/${id}/`
    );
    return response.data;
  },

  /**
   * Gera e aguarda o resultado com polling.
   * onProgress: callback chamado enquanto aguarda (a cada tick).
   * intervalMs: intervalo de polling em ms (padrão 4s).
   * maxWaitMs: tempo máximo de espera (padrão 12 min).
   */
  generateAndPoll: async (
    municipio: string,
    forceRefresh = false,
    onProgress?: (elapsed: number) => void,
    intervalMs = 4000,
    maxWaitMs = 720_000
  ): Promise<ThermometerData> => {
    const initial = await thermometerService.generate(municipio, forceRefresh);

    // Cache hit — já retornou os dados completos (status 200)
    if (!("status" in initial) || (initial as ThermometerJobStatus).status === "done") {
      return initial as ThermometerData;
    }

    const job = initial as ThermometerJobStatus;
    if (!job._id) throw new Error("Backend não retornou _id do job");

    // Polling
    const start = Date.now();
    while (Date.now() - start < maxWaitMs) {
      await new Promise((r) => setTimeout(r, intervalMs));
      const elapsed = Date.now() - start;
      onProgress?.(elapsed);

      const poll = await thermometerService.pollStatus(job._id);
      const s = (poll as ThermometerJobStatus).status;

      if (!s || s === "done") return poll as ThermometerData;
      if (s === "error") {
        const err = (poll as ThermometerJobStatus).error || "Erro na análise";
        throw new Error(err);
      }
      // s === "processing" → continua aguardando
    }
    throw new Error("Tempo limite de espera excedido. Tente novamente em alguns minutos.");
  },

  /**
   * Retorna o relatório mais recente de um município sem regerar.
   * Útil para o Briefing de Rua consultar um termômetro já existente.
   */
  getLatest: async (municipio: string): Promise<ThermometerData> => {
    const response = await api.get<ThermometerData>(
      `/personas/thermometer/latest/${encodeURIComponent(municipio)}/`
    );
    return response.data;
  },

  // ── Contas Chave ──────────────────────────────────────────────────────────

  /**
   * Busca as contas chave configuradas para um município.
   * Retorna { exists: false } se não houver configuração.
   */
  getKeyAccounts: async (municipio: string): Promise<ThermometerKeyAccounts> => {
    const response = await api.get<ThermometerKeyAccounts>(
      `/personas/thermometer/key-accounts/?municipio=${encodeURIComponent(municipio)}`
    );
    return response.data;
  },

  /**
   * Salva (cria ou atualiza) as contas chave de um município.
   */
  saveKeyAccounts: async (
    payload: Pick<ThermometerKeyAccounts, "municipio" | "twitter_handles" | "instagram_usernames" | "facebook_pages" | "descricao">
  ): Promise<ThermometerKeyAccounts> => {
    const response = await api.post<ThermometerKeyAccounts>(
      "/personas/thermometer/key-accounts/",
      payload
    );
    return response.data;
  },

  /**
   * Atualiza (PATCH) as contas chave pelo id do registro.
   */
  updateKeyAccounts: async (
    id: number,
    payload: Partial<Pick<ThermometerKeyAccounts, "twitter_handles" | "instagram_usernames" | "descricao">>
  ): Promise<ThermometerKeyAccounts> => {
    const response = await api.patch<ThermometerKeyAccounts>(
      `/personas/thermometer/key-accounts/${id}/`,
      payload
    );
    return response.data;
  },

  /**
   * Remove o registro de contas chave de um município.
   */
  deleteKeyAccounts: async (id: number): Promise<void> => {
    await api.delete(`/personas/thermometer/key-accounts/${id}/`);
  },
};
