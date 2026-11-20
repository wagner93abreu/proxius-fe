import axios from "axios";

export type TipoMensagem = "error" | "success" | "warning" | "info";

interface Mensagem {
    id: number;
    message: string;
    severity: TipoMensagem;
    resolve: () => void;
}

const fila: Mensagem[] = [];
const listeners = new Set<() => void>();
let proximoId = 0;

function isRecord(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === "object";
}

export function formatarMensagem(value: unknown): string {
    if (typeof value === "string" && value.trim()) return value;
    if (typeof value === "number" || typeof value === "boolean") return String(value);

    if (axios.isAxiosError(value)) {
        const data: unknown = value.response?.data;
        if (typeof data === "string" && data.trim()) return data;
        if (isRecord(data)) {
            for (const key of ["message", "error", "erro"] as const) {
                if (key in data) {
                    const message: unknown = data[key];
                    if (typeof message === "string" && message.trim()) return message;
                }
            }
        }
    }

    if (value instanceof Error && value.message.trim()) return value.message;
    if (value && typeof value === "object" && "message" in value && typeof value.message === "string" && value.message.trim()) {
        return value.message;
    }
    return "Não foi possível concluir a operação. Tente novamente.";
}

export function mostrarMensagem(value: unknown, severity: TipoMensagem = "error"): Promise<void> {
    return new Promise(resolve => {
        fila.push({ id: ++proximoId, message: formatarMensagem(value), severity, resolve });
        listeners.forEach(listener => listener());
    });
}

export function getMensagemAtual() {
    return fila[0] ?? null;
}

export function assinarMensagens(listener: () => void) {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
}

export function fecharMensagem() {
    const mensagem = fila.shift();
    listeners.forEach(listener => listener());
    mensagem?.resolve();
}
