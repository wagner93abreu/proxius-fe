import axios from "axios";

export type StorageState = "COMPLETE" | "PARTIAL" | "FAILED" | "NEVER";

export interface StorageSummary {
    tenantId: string;
    slug: string;
    name: string;
    tenantStatus: string;
    simulated: true;
    state: StorageState;
    usedBytes: number | null;
    knownBytes: number;
    expectedContainers: number;
    collectedContainers: number;
    collectedAt: string | null;
    lastCompleteAt: string | null;
    lastCompleteBytes: number | null;
    stale: boolean;
}

export interface StorageContainer {
    id: string;
    purposes: string;
    localResource: string;
    state: string;
    usedBytes: number | null;
    collectedAt: string | null;
    error: string | null;
}

export interface StorageDetail {
    summary: StorageSummary;
    containers: StorageContainer[];
}

export interface StorageHistoryPage {
    items: StorageSummary[];
    page: number;
    size: number;
    hasNext: boolean;
}

export const GIBIBYTE_BYTES = 1073741824;

export function formatBytes(bytes: number): string {
    const gibibytes = bytes / GIBIBYTE_BYTES;
    return `${bytes.toLocaleString("pt-BR")} bytes (${gibibytes.toLocaleString("pt-BR", {
        minimumFractionDigits: 6,
        maximumFractionDigits: 6,
    })} GiB)`;
}

export function formatTimestamp(value: string | null): string {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "Data indisponível" : date.toLocaleString("pt-BR");
}

export function stateLabel(state: StorageState | string): string {
    switch (state) {
        case "COMPLETE": return "Completa";
        case "PARTIAL": return "Parcial";
        case "FAILED": return "Falha";
        case "NEVER": return "Ainda não medida";
        default: return state;
    }
}

export function measuredUsage(summary: StorageSummary): string {
    if (summary.state === "NEVER") return "Ainda não medido";
    if (summary.state === "FAILED") return "Falha na coleta; consumo indisponível";
    if (summary.state === "PARTIAL") return `Subtotal conhecido: ${formatBytes(summary.knownBytes)} (não é o total)`;
    if (summary.usedBytes === null) return "Medição concluída; valor indisponível";
    return formatBytes(summary.usedBytes);
}

export function requestError(error: unknown, context: "empresa" | "plataforma"): string {
    if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        if (status === 401) return context === "empresa"
                ? "Sua sessão da empresa expirou. Entre novamente."
                : "Sessão da plataforma expirada. Entre novamente.";
        if (status === 403) return context === "empresa"
                ? "Apenas um ADMIN de uma empresa ativa pode consultar o armazenamento."
                : "A sessão não tem permissão para consultar o armazenamento.";
        if (status === 404) return "O endpoint de armazenamento não está disponível nesta versão da API.";
        if (status === 409) return "Uma coleta já está em andamento para esta empresa.";
        const data: unknown = error.response?.data;
        if (typeof data === "string" && data.trim().length > 0 && data.length <= 500) return data;
        if (data && typeof data === "object") {
            if ("error" in data && typeof data.error === "string" && data.error.length <= 500) return data.error;
            if ("message" in data && typeof data.message === "string" && data.message.length <= 500) return data.message;
        }
        if (!error.response) return "Não foi possível conectar à API local. Verifique se ela está ativa.";
    }
    return "Não foi possível carregar os dados de armazenamento.";
}
