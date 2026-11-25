import styled from "styled-components";
import { Button } from "@mui/material";
import autenticaStore from "../../stores/autentica.store";
import IClifor from "../../types/IClifor";
import http from "../../http";
import * as React from 'react';
import { useState } from "react";
import Comentarios from "../../components/Comentarios";
import ICard from "../../types/ICard";
import MinhasAtividades from "../../components/MinhasAtividades";
import PastasCliente from "../../components/PastasCliente";
import AgendarSessao from "../../components/AgendarSessao";
import AtalhosAreaCliente from "../../components/AtalhosAreaCliente";
import useMediaQuery from "@mui/material/useMediaQuery";
import IUser from "../../types/IUser";
import fotoPadrao from "../MeuPerfil/perfil.png";
import ModalPerfilAreaCliente from "../../components/ModalPerfilAreaCliente";
import Rodape from "../../components/Rodape";
import LogoProxiUs from "../../components/LogoProxiUs";
import { mostrarMensagem } from "../../stores/mensagem.store";
import { usePublicPhotoBaseUrl } from "../../PublicPhotoConfig";

const Container = styled.section`
  width: 100%;
  min-height: 100dvh;
  background: linear-gradient(180deg, #f6f6f6 0%, #e8e8e8 100%);
  margin: 0;
  padding: 0 1em calc(1em + 25px);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
`

const CabecalhoPagina = styled.header`
  background-color: #f6f6f6;
  border-bottom: 1px solid rgba(20, 20, 20, 0.12);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  position: relative;
  padding: 8px 16px;
  min-height: 48px;
  box-sizing: border-box;
  margin-left: -16px;
  margin-right: -16px;
  margin-bottom: 14px;
`;

const MenuVisual = styled.div`
  display: flex;
  align-items: center;
  color: #141414;
  opacity: 0.9;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
`;

const BotaoSair = styled.button`
  background-color: transparent;
  border: 1px solid rgba(20, 20, 20, 0.22);
  color: #141414;
  border-radius: 8px;
  padding: 5px 16px;
  font-weight: 700;
  cursor: pointer;
  min-height: 36px;

  &:focus-visible {
    outline: 3px solid #858585;
    outline-offset: 3px;
  }

  &:hover {
    border-color: #383838;
    color: #383838;
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

const LinhaPerfil = styled.div`
  position: relative;
  margin-bottom: 20px;
`;

const CabecalhoPerfil = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 12px;

  img {
    width: clamp(70px, 12.5vw, 84px);
    height: clamp(70px, 12.5vw, 84px);
    border-radius: 10px;
    border: 2px solid #141414;
    object-fit: cover;
  }
`;

const MensagemAguardo = styled.div`
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: min(90%, 480px);
  text-align: center;
  min-height: 160px;
  margin-bottom: 20px;
  padding: 24px;
  color: #141414;
  font-weight: 700;
  font-size: 18px;
  line-height: 1.5;

  @media (max-width: 768px) {
    position: static;
    transform: none;
    width: 90%;
    margin-top: 12px;
  }
`;

const InfoCliente = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: -20px;
`;

export default function AreaCliente() {
  const bucketName = usePublicPhotoBaseUrl();
  const {usuario} = autenticaStore;
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [nome, setNome] = useState<string | null>('')
  const [papel, setPapel] = useState<string | null>('')
  const [cliforID, setCliforID] = useState<string | null>('')
  const [cardId, setCardId] = useState<string | null>(null)
  const [usuarioNome, setUsuarioNome] = useState<string>('')
  const [linkDrive, setLinkDrive] = useState<string | null>(null)
  const [sharePointEmbeddedEnabled, setSharePointEmbeddedEnabled] = useState(false)
  const [atendenteId, setAtendenteId] = useState<number | null>(null)
  const [atendente, setAtendente] = useState<string | null>(null)
  const [fotoAtendente, setFotoAtendente] = useState<string | null>(null)
  const [fotoCliente, setFotoCliente] = useState<string>("")
  const [imageKey, setImageKey] = useState(Date.now())
  const [openPerfilModal, setOpenPerfilModal] = useState(false)
  const [aguardandoAmbiente, setAguardandoAmbiente] = useState(false)
  const handleLogout = () => {
    autenticaStore.logout()
  }
  //const [usuarioID, setUsuarioID] = useState<string | null>('')
  const axiosConfig = {
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${usuario.token}`,
    },
  };

 

  //setUsuarioID(localStorage.getItem('userID'))

  React.useEffect(() => {
    if (localStorage.getItem('userID') != null ) {
    http.get<IClifor[]>(`clifor/filter?attribute=idusuario&value=${localStorage.getItem('userID')}`, axiosConfig).then(resposta => {
    /* //console.log(JSON.stringify(resposta.data[0].nomecomercial))  */     
    if (resposta.data[0]) {
      setNome(resposta.data[0].nomecomercial)
      setLinkDrive(resposta.data[0].linkDrive || null)
      setSharePointEmbeddedEnabled(resposta.data[0].sharePointEmbeddedEnabled === true)
      const foundId = resposta.data[0].id == null ? null : resposta.data[0].id.toString()
      
      setCliforID(foundId)
      if (foundId) {
        http.get<ICard[]>(`card/get-card-cliente-statusid?cliente=${foundId}&statusId=8&statusId=9&statusId=10&statusId=11&statusId=12&statusId=19&statusId=21&statusId=22&statusId=23&statusId=25&statusId=26`, axiosConfig)
          .then(res => {
            const primeiro = res.data?.[0];
            setCardId(primeiro?.id ?? null)
            setAtendenteId(primeiro?.atendenteId ?? null)
            setAtendente(primeiro?.atendente || null)
            setFotoAtendente(primeiro?.fotoAtendente || null)
            setAguardandoAmbiente(!res.data || res.data.length === 0)
          })
          .catch(erro => mostrarMensagem(erro, "error"))
      }
    }
    })
    .catch(erro => {
        mostrarMensagem(erro, "error")
    });

    http.get<IUser>(`/usuarios/${localStorage.getItem('userID')}`, axiosConfig).then(resposta => {
      //console.log(resposta)
      setPapel(resposta.data.papel)
      setUsuarioNome(resposta.data.nome)
      setFotoCliente(resposta.data.foto || "")
      setImageKey(Date.now())
    })
    .catch(erro => {
        mostrarMensagem(erro, "error")
    });
  }
  }, [])

  return (
    <Container>
        <CabecalhoPagina>
          <MenuVisual aria-hidden="true">
           <LogoProxiUs />
          </MenuVisual>
          <BotaoSair type="button" onClick={handleLogout}>Sair</BotaoSair>
        </CabecalhoPagina>
        <LinhaPerfil>
          <CabecalhoPerfil>
            {fotoCliente && bucketName ? (
              <img src={`${bucketName}${fotoCliente.replaceAll(" ", "+")}?${imageKey}`} alt="Foto do cliente" />
            ) : (
              <img src={fotoPadrao} alt="Foto do cliente" />
            )}
            <InfoCliente>
              <Titulo style={{marginBottom: '0'}}>Olá, {usuarioNome || nome}!</Titulo>
              <Button
                variant="outlined"
                onClick={() => setOpenPerfilModal(true)}
                sx={{ borderColor: "#141414", color: "#141414", fontWeight: 700, fontSize: 9, width: "fit-content", "&:hover": { borderColor: "#383838", color: "#383838" } }}
              >
                Editar meu perfil
              </Button>
            </InfoCliente>
          </CabecalhoPerfil>
          {aguardandoAmbiente && (
            <MensagemAguardo>
              Aguarde! Sua mentora está preparando o ambiente para melhor atendê-lo!
            </MensagemAguardo>
          )}
        </LinhaPerfil>
        {papel === 'CLIENTE' && (
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
                <MinhasAtividades />
              </>
            ) : (
              <>
                <MinhasAtividades />
                <ColunaDireita>
                  <AgendarSessao atendenteId={atendenteId} atendente={atendente || ''} fotoAtendente={fotoAtendente || ''} />
                  <PastasCliente linkCliente={linkDrive} cliforId={cliforID} sharePointEmbeddedEnabled={sharePointEmbeddedEnabled} />
                  {cardId && (
                    <Comentarios cardId={cardId} usuarioNome={usuarioNome || nome || ''} usuarioId={localStorage.getItem('userID') || ''} $light />
                  )}
                </ColunaDireita>
              </>
            )}
          </PainelFlex>
        )}
        <ModalPerfilAreaCliente
          open={openPerfilModal}
          onClose={() => setOpenPerfilModal(false)}
          onUpdated={({ nome: nomeAtualizado, foto }) => {
            setUsuarioNome(nomeAtualizado)
            setFotoCliente(foto || "")
            setImageKey(Date.now())
          }}
        />
        <Rodape light />
    </Container>
  )
}
