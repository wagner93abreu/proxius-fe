import styled from "styled-components";
import CampoDigitacao from "../../components/CampoDigitacao";
import { useEffect, useState } from "react";
import Botao from "../../components/Botao";
import { useNavigate } from "react-router-dom";
import autenticaStore from "../../stores/autentica.store";
import http from "../../http";
// import ReCAPTCHA from "react-google-recaptcha";
import AlertPortal from "../../components/AlertPortal";
import axios from "axios";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from "@mui/material";
import LogoProxiUs from "../../components/LogoProxiUs";
import { centralPreviewEnabled, isLocalTenant } from "../../centralIdentity";
import { publicLoginPreviewTenant } from "../../publicLoginPreview";

const Card = styled.div`
  width: 100%;
  max-width: 400px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(20, 20, 20, 0.14);
  border-radius: 24px;
  box-shadow: 0 24px 60px rgba(20, 20, 20, 0.12);
  padding: 40px 32px;
`;

const Imagem = styled(LogoProxiUs)`
  font-size: 64px;
  margin-bottom: 0.5em;
`;

const Titulo = styled.h2`
  font-weight: 700;
  font-size: 24px;
  line-height: 28px;
  color: #141414;
  margin: 0;
`;

const Subtitulo = styled.p`
  font-size: 14px;
  color: rgba(20, 20, 20, 0.68);
  margin: 0.4em 0 1.5em;
  text-align: center;
`;

const Formulario = styled.form`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;

  label {
    color: #141414;
  }
`;

const BotaoCustomizado = styled(Botao)`
  width: 100%;
  margin-right: 0;
  background-color: #141414;

  &:hover {
    background-color: #383838;
  }

  &:active {
    border-color: #141414;
  }
`;

const LinkEsqueciSenha = styled.button`
  align-self: flex-end;
  margin: -0.6em 0 0.8em;
  background: none;
  border: none;
  padding: 0;
  font-size: 13px;
  font-weight: 700;
  color: #141414;
  text-decoration: underline;
  cursor: pointer;
`;

const RotuloDialog = styled.label`
  display: block;
  font-weight: 700;
  font-size: 14px;
  line-height: 18px;
  color: #141414;
`;

const CampoDialog = styled.input`
  color: #141414;
  font-size: 15px;
  background: rgba(255, 255, 255, 0.78);
  margin-top: 6px;
  box-sizing: border-box;
  box-shadow: 2px 2px 6px rgba(20, 20, 20, 0.1);
  border-radius: 3px;
  border: 1px solid rgba(20, 20, 20, 0.16);
  width: 100%;
  padding: 10px;
`;

interface ILogin {
  login: string,
  senha: string
}

export default function Login() {
  const central = centralPreviewEnabled() && isLocalTenant(window.location.hostname);
  const publicLoginPreview = publicLoginPreviewTenant() !== null;
    // const tenantPoc = /^[a-z0-9](?:[a-z0-9-]{0,48}[a-z0-9])?\.localhost$/.test(window.location.hostname);
  const [login, setLogin] = useState("");
  const [senha, setSenha] = useState("");
    const navigate = useNavigate();
    // const [verified, setVerified] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showError, setShowError] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [esqueciSenhaAberto, setEsqueciSenhaAberto] = useState(false);
  const [emailRecuperacao, setEmailRecuperacao] = useState("");
  const [enviandoRecuperacao, setEnviandoRecuperacao] = useState(false);
    const axiosConfig = {
      headers: {
          'Content-Type': 'application/json',
      },
    };

    useEffect(() => {

      if (!publicLoginPreview && localStorage.getItem('authToken') != null && !autenticaStore.isTokenExpired()) {
          navigate('/home');
      }
    }, [navigate, publicLoginPreview]);

    // function onChange(value: string | null) {
    //   setVerified(Boolean(value));
    // }

    const getBackendErrorMessage = (error: unknown) => {
      if (axios.isAxiosError(error)) {
        const data = error.response?.data;

        if (typeof data === "string") {
          return data;
        }

        if (data && typeof data === "object") {
          const dataRecord = data as Record<string, unknown>;
          const message = dataRecord.message;
          const errorMessage = dataRecord.error || dataRecord.erro;

          if (typeof message === "string" && message.trim().length > 0) {
            return message;
          }

          if (typeof errorMessage === "string" && errorMessage.trim().length > 0) {
            return errorMessage;
          }
        }

        return error.message || "Erro ao efetuar login.";
      }

      return "Erro inesperado ao efetuar login.";
    };

    const showErrorAlert = (message: string) => {
      setErrorMessage(message);
      setShowError(true);
    };

    const handleAbrirEsqueciSenha = () => {
      setEmailRecuperacao("");
      setEsqueciSenhaAberto(true);
    };

    const handleFecharEsqueciSenha = () => {
      setEsqueciSenhaAberto(false);
    };

    const handleSolicitarRecuperacao = (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const email = emailRecuperacao.trim();
      if (!email) {
        return;
      }

      setEnviandoRecuperacao(true);
      http.post('password-reset/solicitar', { email }, axiosConfig)
        .then(() => {
          setSuccessMessage("Se o e-mail informado existir em nossa base, você receberá um link para redefinir sua senha.");
          setShowSuccess(true);
          handleFecharEsqueciSenha();
        })
        .catch(erro => {
          showErrorAlert(getBackendErrorMessage(erro));
        })
        .finally(() => setEnviandoRecuperacao(false));
    };

    const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      // Temporariamente desativado até configurar o reCAPTCHA para o novo domínio.
      // if (!verified && !tenantPoc) {
      //   showErrorAlert("reCAPTCHA não verificado");
      //   return;
      // }
      const usuario: ILogin = {
        login: login,
        senha: senha
      }
      if (central) {
        try {
          const resposta = await http.post<{ token: string }>("central-login", { email: login, password: senha }, axiosConfig);
          await autenticaStore.loginCentral(resposta.data.token);
          setSenha("");
          window.location.assign("/home");
        } catch (erro) {
          showErrorAlert(getBackendErrorMessage(erro));
        }
        return;
      }
  
      http.post('login', usuario, axiosConfig)
        .then(async resposta => {
          if (publicLoginPreview) {
            if (typeof resposta.data?.token !== "string" || !resposta.data.token) {
              throw new Error("Resposta de login inválida.");
            }
            setSenha("");
            setSuccessMessage("Login confirmado. Esta é uma prévia: o painel e as demais funções ainda não estão disponíveis.");
            setShowSuccess(true);
            return;
          }
          await autenticaStore.login({login: login, token: resposta.data.token})
          resposta && navigate('/home')
        })
        .catch(erro => {
          showErrorAlert(getBackendErrorMessage(erro));
        })
      


    }

    return (
        <>
      <AlertPortal show={showError} message={errorMessage} severity="error" onClose={() => setShowError(false)} />
      <AlertPortal show={showSuccess} message={successMessage} severity="success" onClose={() => setShowSuccess(false)} />
      <Card>
        <Imagem />
        <Titulo>ProxiUs</Titulo>
        <Subtitulo>Acesse sua conta para continuar</Subtitulo>
        {publicLoginPreview && <Subtitulo>Prévia limitada ao teste de login. O painel ainda não está disponível.</Subtitulo>}
        <Formulario onSubmit={handleLogin}>
            <CampoDigitacao required={true} tipo={central ? "email" : "login"} label={central ? "E-mail" : "Login"} valor={login} placeholder={central ? "seuemail@exemplo.com" : "login"} onChange={setLogin} maxLength={central ? 254 : 50} />
            <CampoDigitacao required={true} tipo="password" label="Senha" valor={senha} placeholder="*******" onChange={setSenha} maxLength={central ? 1024 : 50} />
            {!central && !publicLoginPreview && <LinkEsqueciSenha type="button" onClick={handleAbrirEsqueciSenha}>Esqueceu sua senha?</LinkEsqueciSenha>}
            {/* {!tenantPoc &&
              <ReCAPTCHA sitekey="6Lf10zsqAAAAAFLQBmVCZKH81pE1LpzUOSBny_dl" onChange={onChange} />} */}
            <BotaoCustomizado type="submit" >Entrar</BotaoCustomizado>
        </Formulario>
      </Card>
      <Dialog
        open={esqueciSenhaAberto}
        onClose={handleFecharEsqueciSenha}
        fullWidth
        maxWidth="xs"
        PaperProps={{ sx: { backgroundColor: "#f5f5f5", color: "#141414", borderRadius: "8px" } }}
      >
        <DialogTitle sx={{ color: "#141414", fontWeight: 700 }}>Recuperar senha</DialogTitle>
        <form onSubmit={handleSolicitarRecuperacao}>
          <DialogContent>
            <Typography variant="body2" sx={{ color: "rgba(20, 20, 20, 0.75)", mb: 2 }}>
              Informe o e-mail cadastrado. Se ele existir em nossa base, enviaremos um link para redefinição de senha.
            </Typography>
            <RotuloDialog>Email</RotuloDialog>
            <CampoDialog
              type="email"
              required
              value={emailRecuperacao}
              placeholder="seuemail@exemplo.com"
              onChange={(e) => setEmailRecuperacao(e.target.value)}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={handleFecharEsqueciSenha} sx={{ color: "#141414" }}>Cancelar</Button>
            <Button
              type="submit"
              variant="outlined"
              disabled={enviandoRecuperacao}
              sx={{ borderColor: "#141414", color: "#141414", fontWeight: 700, "&:hover": { borderColor: "#383838", color: "#383838" } }}
            >
              {enviandoRecuperacao ? "Enviando..." : "Enviar link"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
        </>  
    )
}
/* <ParagrafoCadastro>Ainda não tem conta? <LinkCustomizado to="/cadastro">Faça seu cadastro!</LinkCustomizado></ParagrafoCadastro> */