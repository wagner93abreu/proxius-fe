import { useEffect, useState } from "react";
import http from "../../http";
import autenticaStore from "../../stores/autentica.store";

export default function CentralTransfer() {
    const [error, setError] = useState("");
    useEffect(() => {
        const opener = window.opener;
        if (!opener) {
            setError("Abra esta página pela seleção de empresas.");
            return;
        }
        const origin = `http://localhost${window.location.port ? `:${window.location.port}` : ""}`;
        let received = false;
        const ready = () => opener.postMessage({ type: "central-transfer-ready" }, origin);
        const interval = window.setInterval(ready, 500);
        const timeout = window.setTimeout(() => {
            window.clearInterval(interval);
            window.removeEventListener("message", receive);
            setError("Tempo de transferência esgotado. Tente novamente.");
        }, 30000);
        const receive = (event: MessageEvent) => {
            if (received || event.origin !== origin || event.source !== opener
                || event.data?.type !== "central-transfer-code"
                || typeof event.data.code !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(event.data.code)) return;
            received = true;
            window.clearInterval(interval);
            window.clearTimeout(timeout);
            window.removeEventListener("message", receive);
            void http.post<{ token: string }>("central-handoff", { code: event.data.code }, { timeout: 15000 })
                .then(async response => {
                    await autenticaStore.loginCentral(response.data.token);
                    opener.postMessage({ type: "central-transfer-complete" }, origin);
                    window.opener = null;
                    window.location.replace("/home");
                })
                .catch(() => {
                    opener.postMessage({ type: "central-transfer-error" }, origin);
                    setError("Não foi possível entrar. Volte à seleção de empresas e tente novamente.");
                });
        };
        window.addEventListener("message", receive);
        ready();
        return () => {
            window.clearInterval(interval);
            window.clearTimeout(timeout);
            window.removeEventListener("message", receive);
        };
    }, []);

    return <main>{error ? <p role="alert">{error}</p> : <p>Entrando na empresa...</p>}</main>;
}
