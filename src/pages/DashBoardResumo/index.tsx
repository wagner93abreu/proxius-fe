import styled from "styled-components";
import Container from "../../components/Container";
import ConsolidadoFinanceiro from "../ConsolidadoFinanceiro";
import ConsolidadoVendas from "../ConsolidadoVendas";
import autenticaStore from "../../stores/autentica.store";
import IClifor from "../../types/IClifor";
import http from "../../http";
import * as React from 'react';
import { useState } from "react";
import { set } from "mobx";
import { DashboardOutlined } from "@mui/icons-material";
import { mostrarMensagem } from "../../stores/mensagem.store";


const Titulo = styled.h2`
  font-weight: 700;
  font-size: 24px;
  line-height: 28px;
  color: #55081d;
  display: flex;
  align-items: center;
  gap: 12px;
`;

export default function DashBoardResumo() {
  const {usuario} = autenticaStore;
  const [nome, setNome] = useState<string | null>('')
  const [papel, setPapel] = useState<string | null>('')
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
    setNome(resposta.data[0].nomecomercial)
    })
    .catch(erro => {
        mostrarMensagem(erro, "error")
    });

    http.get(`usuarios/${localStorage.getItem('userID')}`, axiosConfig).then(resposta => {
      //console.log(resposta)
      setPapel(resposta.data.papel)
    })
    .catch(erro => {
        mostrarMensagem(erro, "error")
    });
  }
  }, [])

  return (
    <Container>
        <Titulo style={{marginBottom: '40px'}}><DashboardOutlined aria-hidden="true" />Olá, {nome}</Titulo>
        
        {papel === 'ADMIN' && <ConsolidadoVendas />}
        {papel === 'ADMIN' && <ConsolidadoFinanceiro />}


    </Container>
  )
}
