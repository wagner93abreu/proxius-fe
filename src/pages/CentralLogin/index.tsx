import { useEffect, useRef, useState } from "react";
import axios from "axios";
import styled from "styled-components";
import { invitationPreviewEnabled, tenantOrigin } from "../../centralIdentity";
import { Link } from "react-router-dom";

type Company = { id: string; slug: string; name: string };
const Card = styled.main`
  max-width: 430px;
  margin: 8vh auto;
  padding: 32px;
  border: 1px solid #ddd;
  border-radius: 16px;
  background: white;
  color: #141414;
  form { display: grid; gap: 12px; }
  input, button { padding: 10px; font-size: 16px; }
  button { cursor: pointer; }
`;

const api = axios.create({ baseURL: "http://localhost:8080/", timeout: 15000 });

export default function CentralLogin() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [companies, setCompanies] = useState<Company[] | null>(null);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [busy, setBusy] = useState(false);
    const cancelRef = useRef<(() => void) | null>(null);
    useEffect(() => () => cancelRef.current?.(), []);

    const discover = async (event: React.FormEvent) => {
        event.preventDefault();
        setBusy(true);
        setError("");
        setSuccess("");
        try {
            const response = await api.post<Company[]>("central-discovery", { email, password });
            setCompanies(response.data);
            setPassword("");
        } catch {
            setError("Não foi possível acessar. Verifique suas credenciais e tente novamente.");
        } finally {
            setBusy(false);
        }
    };

    const select = async (company: Company) => {
        setError("");
        let origin: string;
        try {
            origin = tenantOrigin(company.slug);
        } catch {
            setError("Empresa indisponível.");
            return;
        }
        const popup = window.open(`${origin}/central-transfer`, "_blank");
        if (!popup) {
            setError("Permita janelas pop-up para acessar a empresa.");
            return;
        }
        setBusy(true);
        let completed = false;
        let ready = false;
        let sent = false;
        let code: string | null = null;
        let finish: (error?: Error) => void = () => {};
        const handshake = new Promise<void>((resolve, reject) => {
            const timer = window.setTimeout(() => finish(new Error("Tempo de transferência esgotado.")), 30000);
            const closed = window.setInterval(() => {
                if (popup.closed) finish(new Error("A janela da empresa foi fechada."));
            }, 500);
            const cleanup = () => {
                window.clearTimeout(timer);
                window.clearInterval(closed);
                window.removeEventListener("message", receive);
                cancelRef.current = null;
            };
            finish = (failure?: Error) => {
                if (completed) return;
                completed = true;
                cleanup();
                if (failure) { popup.close(); reject(failure); } else resolve();
            };
            const send = () => {
                if (ready && code && !sent) {
                    sent = true;
                    popup.postMessage({ type: "central-transfer-code", code }, origin);
                    code = null;
                }
            };
            const receive = (event: MessageEvent) => {
                if (event.origin !== origin || event.source !== popup || !event.data) return;
                if (event.data.type === "central-transfer-ready") { ready = true; send(); }
                if (sent && event.data.type === "central-transfer-complete") finish();
                if (sent && event.data.type === "central-transfer-error") finish(new Error("Não foi possível entrar na empresa."));
            };
            window.addEventListener("message", receive);
            cancelRef.current = () => finish(new Error("Transferência cancelada."));
            api.post<{ code: string }>("central-discovery/handoff", { email, password, tenantId: company.id })
                .then(response => {
                    if (completed) return;
                    if (!/^[A-Za-z0-9_-]{43}$/.test(response.data.code)) {
                        finish(new Error("Transferência inválida."));
                        return;
                    }
                    code = response.data.code;
                    send();
                })
                .catch(() => finish(new Error("Não foi possível iniciar a transferência.")));
        });
        try {
            await handshake;
            setPassword("");
            setCompanies(null);
            setSuccess("A empresa foi aberta em outra janela.");
        } catch (failure) {
            setError(failure instanceof Error ? failure.message : "Não foi possível entrar na empresa.");
        } finally {
            setBusy(false);
        }
    };

    return <Card>
        <h1>Acessar ProxiUs</h1>
        {error && <p role="alert">{error}</p>}
        {success && <p role="status">{success}</p>}
        {!companies ? <form onSubmit={discover}>
            <label htmlFor="central-email">E-mail</label>
            <input id="central-email" type="email" required maxLength={254} value={email} onChange={e => setEmail(e.target.value)} />
            <label htmlFor="central-password">Senha</label>
            <input id="central-password" type="password" required maxLength={1024} value={password} onChange={e => setPassword(e.target.value)} />
            <button type="submit" disabled={busy}>Consultar empresas</button>
        </form> : <div>
            <h2>Escolha uma empresa</h2>
            {companies.length === 0 && <p>Nenhuma empresa disponível para esta conta.</p>}
            {companies.length > 0 && <>
                <p>Confirme sua senha para entrar na empresa escolhida.</p>
                <label htmlFor="central-confirm-password">Senha</label>
                <input id="central-confirm-password" type="password" maxLength={1024} value={password}
                    onChange={e => setPassword(e.target.value)} />
                {companies.map(company => <p key={company.id}>
                    <button type="button" disabled={busy || !password} onClick={() => void select(company)}>{company.name}</button>
                </p>)}
            </>}
            <button type="button" disabled={busy} onClick={() => { setCompanies(null); setPassword(""); }}>Voltar</button>
        </div>}
        {invitationPreviewEnabled() && <p>
            <Link to="/verificar-email">Verificar e-mail</Link>{" · "}
            <Link to="/aceitar-convite">Aceitar convite</Link>{" · "}
            <Link to="/definir-senha-inicial">Definir senha inicial</Link>
        </p>}
    </Card>;
}
