import styled from "styled-components";
import * as React from "react";
import { useState } from "react";
import { Button, Dialog, DialogActions, DialogContent } from "@mui/material";
import { useParams } from "react-router-dom";
import useMediaQuery from "@mui/material/useMediaQuery";
import autenticaStore from "../../stores/autentica.store";
import http from "../../http";
import IClifor from "../../types/IClifor";
import ICard from "../../types/ICard";
import Comentarios from "../../components/Comentarios";
import MinhasAtividadesAtendente from "../../components/MinhasAtividadesAtendente";
import PastasCliente from "../../components/PastasCliente";
import AgendarSessao from "../../components/AgendarSessao";
import AtalhosAreaCliente from "../../components/AtalhosAreaCliente";
import IUser from "../../types/IUser";
import fotoPadrao from "../MeuPerfil/perfil.png";
import ModalPerfilAreaCliente from "../../components/ModalPerfilAreaCliente";
import { mostrarMensagem } from "../../stores/mensagem.store";

const Container = styled.section`
  width: 100%;
  min-height: calc(100dvh - 48px);
  background: linear-gradient(180deg, #f6f6f6 0%, #e8e8e8 100%);
  margin: 0;
  padding: 1em 1em calc(1em + 25px);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;

  @media (max-width: 768px) {
    margin-bottom: 30px;
  }

`;

const Titulo = styled.h2`
  font-weight: 700;
  font-size: 24px;
  line-height: 28px;
  color: #141414;
`;

const PainelFlex = styled.div`
  display: flex;
  gap: 16px;
  align-items: flex-start;
  flex-wrap: wrap;
`;

const ColunaDireita = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
  min-width: 360px;
  max-width: 42%;
`;

const CabecalhoCliente = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 20px;
  padding-bottom: 12px;

  img {
    width: clamp(70px, 12.5vw, 84px);
    height: clamp(70px, 12.5vw, 84px);
    border-radius: 10px;
    border: 2px solid #141414;
    object-fit: cover;
  }
`;

const NomeWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const InfoCliente = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

export default function AreaClienteAtendente() {
  const { codCliente } = useParams<{ codCliente: string }>();
  const { usuario } = autenticaStore;
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [nome, setNome] = useState<string | null>("");
  const [papel, setPapel] = useState<string | null>(null);
  const [acessoVerificado, setAcessoVerificado] = useState(false);
  const [cliforID, setCliforID] = useState<string | null>("");
  const [cardId, setCardId] = useState<string | null>(null);
  const [usuarioNome, setUsuarioNome] = useState<string>("");
  const [linkDrive, setLinkDrive] = useState<string | null>(null);
  const [sharePointEmbeddedEnabled, setSharePointEmbeddedEnabled] = useState(false);
  const [atendenteId, setAtendenteId] = useState<number | null>(null);
  const [atendente, setAtendente] = useState<string | null>(null);
  const [fotoAtendente, setFotoAtendente] = useState<string | null>(null);
  const [fotoCliente, setFotoCliente] = useState<string>("");
  const [clienteUsuarioId, setClienteUsuarioId] = useState<string | null>(null);
  const [imageKey, setImageKey] = useState(Date.now());
  const [openPlanejamento, setOpenPlanejamento] = useState(false);
  const [openPerfilModal, setOpenPerfilModal] = useState(false);
  const bucketName = "https://rhsc-bucket-public.s3.us-east-1.amazonaws.com/";

  const axiosConfig = React.useMemo(
    () => ({
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${usuario.token}`,
      },
    }),
    [usuario.token]
  );

  React.useEffect(() => {
    let active = true;
    setCliforID(null);
    setLinkDrive(null);
    setSharePointEmbeddedEnabled(false);
    if (!codCliente) {
      return;
    }

    http
      .get<IClifor>(`clifor/${codCliente}`, axiosConfig)
      .then((resposta) => {
        if (!active) return;
        setNome(resposta.data.nomecomercial);
        setLinkDrive(resposta.data.linkDrive || null);
        setSharePointEmbeddedEnabled(resposta.data.sharePointEmbeddedEnabled === true);
        const foundId = resposta.data.id == null ? codCliente : resposta.data.id.toString();
        setCliforID(foundId);
        const targetUserId = resposta.data.idusuario;
        setClienteUsuarioId(targetUserId);
        if (targetUserId) {
          http
            .get<IUser>(`usuarios/${targetUserId}`, axiosConfig)
            .then((userResp) => {
              if (!active) return;
              setUsuarioNome(userResp.data.nome || "");
              setFotoCliente(userResp.data.foto || "");
              setImageKey(Date.now());
            })
            .catch((erro) => {
              if (active) mostrarMensagem(erro, "error");
            });
        }
      })
      .catch((erro) => {
        if (active) mostrarMensagem(erro, "error");
      });

    http
      .get<ICard[]>(
        `card/get-card-cliente-statusid?cliente=${codCliente}&statusId=1&statusId=8&statusId=9&statusId=10&statusId=11&statusId=12&statusId=19&statusId=21&statusId=22&statusId=23&statusId=25&statusId=26`,
        axiosConfig
      )
      .then((res) => {
        const primeiro = res.data?.[0];
        setCardId(primeiro?.id ?? null);
        setAtendenteId(primeiro?.atendenteId ?? null);
        setAtendente(primeiro?.atendente || null);
        setFotoAtendente(primeiro?.fotoAtendente || null);
      })
      .catch((erro) => mostrarMensagem(erro, "error"));

    const usuarioId = localStorage.getItem("userID");
    if (usuarioId != null) {
      http
        .get<IUser>(`/usuarios/login/${localStorage.getItem("user")}`, axiosConfig)
        .then((resposta) => {
          setPapel(resposta.data.papel);
        })
        .catch((erro) => {
          mostrarMensagem(erro, "error");
        })
        .finally(() => {
          setAcessoVerificado(true);
        });
    } else {
      setAcessoVerificado(true);
    }
    return () => { active = false; };
  }, [codCliente, axiosConfig]);

  if (!codCliente) {
    return (
      <Container>
        <Titulo>Cliente nao informado</Titulo>
      </Container>
    );
  }

  if (acessoVerificado && papel !== "ADMIN" && papel !== "ATENDIMENTO" && papel !== "COLABORADOR") {
    return (
      <Container>
        <Titulo style={{ textAlign: "center", marginTop: "20vh" }}>ACESSO NEGADO</Titulo>
      </Container>
    );
  }

  return (
    <Container>
      <CabecalhoCliente>
        <NomeWrapper>
          {fotoCliente ? (
            <img src={`${bucketName}${fotoCliente.replaceAll(" ", "+")}?${imageKey}`} alt="Foto do cliente" />
          ) : (
            <img src={fotoPadrao} alt="Foto do cliente" />
          )}
          <InfoCliente>
            <Titulo style={{ marginBottom: "0" }}>Olá, {usuarioNome || nome}</Titulo>
            <Button
              variant="outlined"
              onClick={() => setOpenPerfilModal(true)}
              sx={{ borderColor: "#141414", color: "#141414", fontWeight: 700, width: "fit-content", "&:hover": { borderColor: "#383838", color: "#383838" } }}
            >
              Editar meu perfil
            </Button>
          </InfoCliente>
        </NomeWrapper>
        <Button
          onClick={() => setOpenPlanejamento(true)}
          disabled={!cardId}
          sx={{
            backgroundColor: "transparent",
            border: "2px solid #141414",
            color: "#141414",
            boxShadow: "none",
            padding: "5px 16px",
            fontWeight: 700,
            textTransform: "none",
            "&:hover": { backgroundColor: "rgba(20, 20, 20, 0.08)" },
          }}
        >
          Planejamento Estratégico
        </Button>
      </CabecalhoCliente>
      <PainelFlex>
        {isMobile ? (
          <>
            <AtalhosAreaCliente
              atendenteId={atendenteId}
              atendente={atendente || ""}
              fotoAtendente={fotoAtendente || ""}
              linkCliente={linkDrive}
              sharePointEmbeddedEnabled={sharePointEmbeddedEnabled}
              cliforId={cliforID}
              cardId={cardId}
              usuarioNome={usuarioNome || nome || ""}
              usuarioId={localStorage.getItem("userID") || ""}
            />
            <MinhasAtividadesAtendente clienteId={codCliente} />
          </>
        ) : (
          <>
            <MinhasAtividadesAtendente clienteId={codCliente} />
            <ColunaDireita>
              <AgendarSessao
                atendenteId={atendenteId}
                atendente={atendente || ""}
                fotoAtendente={fotoAtendente || ""}
              />
              <PastasCliente linkCliente={linkDrive} cliforId={cliforID} sharePointEmbeddedEnabled={sharePointEmbeddedEnabled} />
              {cardId && (
                <Comentarios
                  cardId={cardId}
                  usuarioNome={usuarioNome || nome || ""}
                  usuarioId={localStorage.getItem("userID") || ""}
                  $light
                />
              )}
            </ColunaDireita>
          </>
        )}
      </PainelFlex>
      <Dialog
        open={openPlanejamento}
        onClose={() => {
          setOpenPlanejamento(false);
          window.location.reload();
        }}
        fullWidth
        maxWidth="md"
      >
        <DialogContent style={{ backgroundColor: "#f5f5f5" }}>
          <Comentarios
            cardId={cardId}
            usuarioNome={usuarioNome || nome || ""}
            usuarioId={localStorage.getItem("userID") || ""}
            origemTipo="PLANEJAMENTO"
            $light
          />
        </DialogContent>
        <DialogActions style={{ backgroundColor: "#f5f5f5" }}>
          <Button
            onClick={() => {
              setOpenPlanejamento(false);
              window.location.reload();
            }}
            sx={{ backgroundColor: "#141414", color: "#fff", fontWeight: 700, "&:hover": { backgroundColor: "#383838" } }}
          >
            Fechar
          </Button>
        </DialogActions>
      </Dialog>
      <ModalPerfilAreaCliente
        open={openPerfilModal}
        onClose={() => setOpenPerfilModal(false)}
        userId={clienteUsuarioId}
        onUpdated={({ nome: nomeAtualizado, foto }) => {
          setUsuarioNome(nomeAtualizado);
          setFotoCliente(foto || "");
          setImageKey(Date.now());
        }}
      />
    </Container>
  );
}
