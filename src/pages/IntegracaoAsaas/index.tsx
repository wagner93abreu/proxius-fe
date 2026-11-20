import { FormEvent, useCallback, useEffect, useState } from "react";
import axios from "axios";
import { Alert, Button, Container, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Paper, Stack, TextField, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import http from "../../http";
import autenticaStore from "../../stores/autentica.store";

interface Settings {
    environment: "SANDBOX" | "PRODUCTION";
    apiKeyConfigured: boolean;
    webhookTokenConfigured: boolean;
    externalCallsEnabled: boolean;
    updatedAt: string | null;
}

function errorMessage(error: unknown) {
    if (axios.isAxiosError(error)) {
        switch (error.response?.status) {
            case 400: return "Dados invalidos. Informe ambos os segredos no primeiro cadastro ou ao trocar de ambiente. Nao utilize espacos.";
            case 401: return "Sua sessao expirou. Entre novamente.";
            case 403: return "Apenas administradores da empresa podem configurar o Asaas, e a empresa precisa estar ativa.";
            case 404: return "Configuracao indisponivel neste ambiente.";
        }
    }
    return "Nao foi possivel acessar a configuracao. Verifique a API e as migrations locais.";
}

export default function IntegracaoAsaas() {
    const [settings, setSettings] = useState<Settings | null>(null);
    const [environment, setEnvironment] = useState<Settings["environment"]>("SANDBOX");
    const [apiKey, setApiKey] = useState("");
    const [webhookToken, setWebhookToken] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [confirmRemoval, setConfirmRemoval] = useState(false);
    const token = autenticaStore.usuario.token;
    const config = useCallback(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token]);
    const localTenant = /^[a-z0-9](?:[a-z0-9-]{0,48}[a-z0-9])?\.localhost$/.test(window.location.hostname);

    useEffect(() => {
        if (!localTenant) return;
        let active = true;
        http.get<Settings>("integracoes/asaas", config()).then(({ data }) => {
            if (active) { setSettings(data); setEnvironment(data.environment); }
        }).catch(e => { if (active) setError(errorMessage(e)); });
        return () => { active = false; };
    }, [config, localTenant]);

    const replaceBoth = !settings?.apiKeyConfigured || environment !== settings.environment;
    async function save(event: FormEvent) {
        event.preventDefault();
        setBusy(true); setError(""); setNotice("");
        try {
            const { data } = await http.put<Settings>("integracoes/asaas", {
                environment, apiKey: apiKey || undefined, webhookToken: webhookToken || undefined,
            }, config());
            setSettings(data); setEnvironment(data.environment);
            setApiKey(""); setWebhookToken("");
            setNotice("Configuracao salva com segredos criptografados. As chamadas externas continuam bloqueadas.");
        } catch (e) {
            setError(errorMessage(e));
        } finally { setBusy(false); }
    }
    async function remove() {
        setBusy(true); setError(""); setNotice("");
        try {
            await http.delete("integracoes/asaas", config());
            setSettings({ environment: "SANDBOX", apiKeyConfigured: false, webhookTokenConfigured: false, externalCallsEnabled: false, updatedAt: null });
            setEnvironment("SANDBOX"); setApiKey(""); setWebhookToken(""); setConfirmRemoval(false);
            setNotice("Credenciais removidas desta empresa.");
        } catch (e) {
            setError(errorMessage(e)); setConfirmRemoval(false);
        } finally { setBusy(false); }
    }

    return <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper sx={{ p: 3 }}><Stack spacing={3}>
            <Typography component="h1" variant="h4">Integracao Asaas</Typography>
            <Button component={Link} to="/painelDeControle">Voltar ao Painel de Controle</Button>
            <Alert severity="warning">Somente cadastro local. Salvar credenciais nao ativa cobrancas, consultas ou webhooks no Asaas. Utilize credenciais de teste.</Alert>
            {!localTenant && <Alert severity="error">Esta configuracao esta disponivel somente no subdominio local de uma empresa.</Alert>}
            {error && <Alert severity="error">{error}</Alert>}
            {notice && <Alert severity="success">{notice}</Alert>}
            {settings && <Stack component="form" spacing={3} onSubmit={save}>
                <TextField select label="Ambiente Asaas" value={environment} disabled={busy}
                    onChange={e => {
                        if (e.target.value === "SANDBOX" || e.target.value === "PRODUCTION") setEnvironment(e.target.value);
                    }}>
                    <MenuItem value="SANDBOX">Sandbox (testes)</MenuItem>
                    <MenuItem value="PRODUCTION">Producao (somente armazenamento; nao ativado)</MenuItem>
                </TextField>
                <Typography>Chave da API: {settings.apiKeyConfigured ? "Cadastrada" : "Nao cadastrada"}.
                    {" "}Token de webhook: {settings.webhookTokenConfigured ? "Cadastrado" : "Nao cadastrado"}.</Typography>
                <TextField label="Chave da API Asaas" type="password" autoComplete="new-password" value={apiKey}
                    disabled={busy} required={replaceBoth} onChange={e => setApiKey(e.target.value)}
                    inputProps={{ maxLength: 2048, pattern: "[!-~]+", spellCheck: false }}
                    helperText="Segredo nunca exibido apos salvar. Deixe vazio para manter a chave atual." />
                <TextField label="Token de autenticacao do webhook" type="password" autoComplete="new-password" value={webhookToken}
                    disabled={busy} required={replaceBoth} onChange={e => setWebhookToken(e.target.value)}
                    inputProps={{ maxLength: 256, pattern: "[!-~]+", spellCheck: false }}
                    helperText="Token definido na configuracao do webhook no Asaas. Deixe vazio para manter o atual." />
                {replaceBoth && <Alert severity="info">No primeiro cadastro ou ao trocar de ambiente, informe os dois segredos correspondentes ao ambiente escolhido.</Alert>}
                <Typography variant="body2">Os segredos sao criptografados no banco desta empresa e nao podem ser recuperados pela tela. Nao e necessario informar uma URL da API.</Typography>
                {settings.updatedAt && <Typography variant="caption">Ultima alteracao: {new Date(settings.updatedAt).toLocaleString()}</Typography>}
                <Button type="submit" variant="contained" disabled={busy}>{busy ? "Processando..." : "Salvar configuracao"}</Button>
                <Button color="error" disabled={busy || !settings.apiKeyConfigured} onClick={() => setConfirmRemoval(true)}>Remover credenciais</Button>
            </Stack>}
        </Stack></Paper>
        <Dialog open={confirmRemoval} onClose={() => { if (!busy) setConfirmRemoval(false); }}>
            <DialogTitle>Remover credenciais do Asaas?</DialogTitle>
            <DialogContent>Somente as credenciais desta empresa serao removidas. Os registros financeiros e os dados no Asaas nao serao alterados.</DialogContent>
            <DialogActions><Button disabled={busy} onClick={() => setConfirmRemoval(false)}>Cancelar</Button>
                <Button color="error" disabled={busy} onClick={() => void remove()}>Confirmar remocao</Button></DialogActions>
        </Dialog>
    </Container>;
}
