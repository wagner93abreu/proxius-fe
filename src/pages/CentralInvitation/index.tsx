import { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import styled from "styled-components";

const api = axios.create({ baseURL: "http://localhost:8080/", timeout: 15000 });
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

export default function CentralInvitation({ mode }: { mode: "verify" | "accept" | "setup" }) {
    const [token, setToken] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmation, setConfirmation] = useState("");
    const [busy, setBusy] = useState(false);
    const [done, setDone] = useState(false);
    const [error, setError] = useState("");
    const verify = mode === "verify";
    const setup = mode === "setup";

    const submit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (busy) return;
        const code = token.trim();
        if (!/^[A-Za-z0-9_-]{43}$/.test(code)) {
            setError("Informe um código válido de 43 caracteres.");
            return;
        }
        if (setup && (password !== confirmation || Array.from(password).length < 6
            || new TextEncoder().encode(password).length > 72)) {
            setError("As senhas devem coincidir e ter pelo menos 6 caracteres e no máximo 72 bytes.");
            return;
        }
        setBusy(true);
        setError("");
        try {
            await api.post(verify ? "central-discovery/verify-email"
                : setup ? "central-discovery/setup-password" : "central-discovery/accept-invitation",
                verify ? { token: code } : setup ? { token: code, password } : { token: code, email: email.trim(), password });
            setToken("");
            setPassword("");
            setConfirmation("");
            setDone(true);
        } catch (failure) {
            if (axios.isAxiosError(failure) && failure.response?.status === 429) {
                setError("Muitas tentativas. Aguarde e tente novamente.");
            } else if (axios.isAxiosError(failure) && failure.response?.status === 400) {
                setError(setup ? "Código ou senha inválidos." : verify ? "Código inválido ou expirado." :
                    "Convite inválido ou expirado, ou e-mail ainda não verificado.");
            } else if (axios.isAxiosError(failure) && failure.response?.status === 401) {
                setError("Não foi possível autenticar. Verifique seu e-mail e sua senha.");
            } else {
                setError("Não foi possível concluir. Verifique a conexão e tente novamente.");
            }
        } finally {
            setBusy(false);
        }
    };

    return <Card>
        <h1>{verify ? "Verificar e-mail" : setup ? "Definir senha inicial" : "Aceitar convite"}</h1>
        {done ? <p role="status">{setup
            ? "Senha definida e e-mail verificado. Agora aceite o convite usando sua nova senha."
            : verify
            ? "E-mail verificado. Se recebeu um convite, agora você pode aceitá-lo."
            : "Convite aceito. A empresa estará disponível no login, se o acesso estiver ativo."}</p> :
            <form onSubmit={submit}>
                <p>Prévia local: informe o código recebido. O envio automático ainda não está disponível.</p>
                <label htmlFor="identity-code">{verify ? "Código de verificação" : setup ? "Código de ativação" : "Código do convite"}</label>
                <input id="identity-code" value={token} onChange={e => setToken(e.target.value)}
                    required maxLength={43} autoComplete="off" spellCheck={false} />
                {mode === "accept" && <>
                    <label htmlFor="invitation-email">E-mail da conta</label>
                    <input id="invitation-email" type="email" required maxLength={254}
                        value={email} onChange={e => setEmail(e.target.value)} autoComplete="username" />
                    <label htmlFor="invitation-password">Senha da conta</label>
                    <input id="invitation-password" type="password" required maxLength={1024}
                        value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" />
                </>}
                {setup && <>
                    <label htmlFor="setup-password">Nova senha</label>
                    <input id="setup-password" type="password" required maxLength={72} autoComplete="new-password"
                        value={password} onChange={e => setPassword(e.target.value)} />
                    <label htmlFor="setup-confirmation">Confirme a senha</label>
                    <input id="setup-confirmation" type="password" required maxLength={72} autoComplete="new-password"
                        value={confirmation} onChange={e => setConfirmation(e.target.value)} />
                </>}
                {error && <p role="alert">{error}</p>}
                <button type="submit" disabled={busy}>{busy ? "Aguarde..." : verify ? "Verificar" : setup ? "Definir senha" : "Aceitar convite"}</button>
            </form>}
        {(verify || setup) && <p><Link to="/aceitar-convite">Ir para aceite de convite</Link></p>}
        <p><Link to="/login">Voltar ao login</Link></p>
    </Card>;
}
