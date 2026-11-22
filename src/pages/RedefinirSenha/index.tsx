import styled from "styled-components";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import CampoDigitacao from "../../components/CampoDigitacao";
import Botao from "../../components/Botao";
import AlertPortal from "../../components/AlertPortal";
import http from "../../http";
import axios from "axios";

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

const LinkVoltar = styled.a`
  margin-top: 0.8em;
  font-size: 13px;
  font-weight: 700;
  color: #141414;
  text-decoration: underline;
  cursor: pointer;
`;

export default function RedefinirSenha() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") || "";
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showError, setShowError] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const axiosConfig = {
    headers: {
      "Content-Type": "application/json",
    },
  };

  useEffect(() => {
    if (!token) {
      setErrorMessage("Link de redefinição inválido. Solicite um novo link na tela de login.");
      setShowError(true);
    }
  }, [token]);

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

      return error.message || "Token inválido ou expirado.";
    }

    return "Erro inesperado ao redefinir a senha.";
  };

  const handleRedefinir = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token) {
      setErrorMessage("Link de redefinição inválido. Solicite um novo link na tela de login.");
      setShowError(true);
      return;
    }

    if (novaSenha.length < 6) {
      setErrorMessage("A nova senha deve ter pelo menos 6 caracteres.");
      setShowError(true);
      return;
    }

    if (novaSenha !== confirmarSenha) {
      setErrorMessage("As senhas informadas não coincidem.");
      setShowError(true);
      return;
    }

    setEnviando(true);
    http.post("password-reset/redefinir", { token, novaSenha }, axiosConfig)
      .then(() => {
        setSuccessMessage("Senha redefinida com sucesso! Ao fechar esta mensagem, você voltará para o login.");
        setShowSuccess(true);
      })
      .catch((erro) => {
        setErrorMessage(getBackendErrorMessage(erro));
        setShowError(true);
      })
      .finally(() => setEnviando(false));
  };

  return (
    <>
      <AlertPortal show={showError} message={errorMessage} severity="error" onClose={() => setShowError(false)} />
      <AlertPortal
        show={showSuccess}
        message={successMessage}
        severity="success"
        onClose={() => {
          setShowSuccess(false);
          navigate("/login");
        }}
      />
      <Card>
        <Titulo>Redefinir senha</Titulo>
        <Subtitulo>Escolha uma nova senha para acessar sua conta</Subtitulo>
        <Formulario onSubmit={handleRedefinir}>
          <CampoDigitacao required tipo="password" label="Nova senha" valor={novaSenha} placeholder="*******" onChange={setNovaSenha} />
          <CampoDigitacao required tipo="password" label="Confirmar nova senha" valor={confirmarSenha} placeholder="*******" onChange={setConfirmarSenha} />
          <BotaoCustomizado type="submit" disabled={enviando}>{enviando ? "Enviando..." : "Redefinir senha"}</BotaoCustomizado>
        </Formulario>
        <LinkVoltar onClick={() => navigate("/login")}>Voltar para o login</LinkVoltar>
      </Card>
    </>
  );
}
