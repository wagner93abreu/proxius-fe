import { AddOutlined, EditOutlined, ToggleOnOutlined } from "@mui/icons-material";
import * as React from 'react';
import { DataGrid, GridColDef, GridRowId } from '@mui/x-data-grid';
import { useState } from "react";
import Botao from '../../../components/Botao';
import Container from "../../../components/Container";
import Titulo from "../../../components/Titulo";
import autenticaStore from '../../../stores/autentica.store';
import http from '../../../http';
import IContractTemplateVersion from '../../../types/IContractTemplateVersion';
import ModalContractTemplateVersion from './Modal';
import { transformDateBR } from '../../../customFunctions/mascarasFormatacao';
import { mostrarMensagem } from "../../../stores/mensagem.store";

function calcularProximaVersao(versoes: IContractTemplateVersion[]): string {
  const maiorVersao = versoes.reduce((maior, item) => {
    const valor = parseFloat(item.version);
    return !isNaN(valor) && valor > maior ? valor : maior;
  }, 0);

  return (maiorVersao + 0.1).toFixed(1);
}

export default function VersoesContractTemplate({ idTemplate }: { idTemplate: string }) {
  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'version', headerName: 'Versão', width: 120 },
    { field: 'active', headerName: 'Ativo', width: 110 },
    { field: 'createdAt', headerName: 'Criado em', width: 160 },
    { field: 'updatedAt', headerName: 'Atualizado em', width: 160 },
    { field: 'description', headerName: 'Descrição', width: 320 },
  ];

  const [versoes, setVersoes] = useState<IContractTemplateVersion[]>([]);
  const [selectedRows, setSelectedRows] = useState<GridRowId[]>([]);
  const [atualizarTabela, setAtualizarTabela] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [tipo, setTipo] = useState("");
  const { usuario } = autenticaStore;

  const axiosConfig = React.useMemo(() => ({
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${usuario.token}`,
    },
  }), [usuario.token]);

  React.useEffect(() => {
    if (!idTemplate) {
      setVersoes([]);
      return;
    }

    http.get<IContractTemplateVersion[]>(`contract-template-version/template/${idTemplate}`, axiosConfig)
      .then(resposta => {
        setVersoes(resposta.data);
      })
      .catch(erro => {
        mostrarMensagem(erro, "error");
      });
  }, [atualizarTabela, openModal, idTemplate, axiosConfig]);

  const handleOpen = (nextTipo: string) => {
    if (nextTipo === "cadastra") {
      setTipo("cadastra");
      setOpenModal(true);
      return;
    }

    if (selectedRows.length === 0) {
      mostrarMensagem("nenhum registro selecionado!", "warning");
      return;
    }

    if (selectedRows.length > 1) {
      mostrarMensagem("Favor selecionar um unico registro!", "warning");
      return;
    }

    setTipo("edita");
    setOpenModal(true);
  };

  const handleClose = () => {
    setOpenModal(false);
  };

  const ativaDesativa = () => {
    if (selectedRows.length === 0) {
      mostrarMensagem("nenhum registro selecionado!", "warning");
      return;
    }

    if (selectedRows.length > 1) {
      mostrarMensagem("Favor selecionar um unico registro!", "warning");
      return;
    }

    const id = selectedRows[0];
    const versao = versoes.find(item => item.id === id);

    if (!versao) {
      return;
    }

    if (versao.active) {
      http.put(`contract-template-version/desativar/${id}`, null, axiosConfig)
        .then(() => {
          mostrarMensagem("versão desativada!", "success");
          setAtualizarTabela(!atualizarTabela);
        })
        .catch(erro => {
          mostrarMensagem(erro, "error");
        });
      return;
    }

    // Reativar uma versão antiga cria uma nova versão (cópia) já ativa,
    // preservando o histórico, e desativa as demais versões ativas.
    const novaVersao = calcularProximaVersao(versoes);
    const payload: IContractTemplateVersion = {
      id: null,
      templateId: idTemplate,
      version: novaVersao,
      active: true,
      htmlTemplate: versao.htmlTemplate,
      description: `Restauração da versão ${versao.version}`,
      createdAt: new Date().toISOString(),
      updatedAt: null,
      createdBy: localStorage.getItem('userID'),
    };

    http.post('contract-template-version', payload, axiosConfig)
      .then(() => {
        const ativas = versoes.filter(item => item.active);
        return Promise.all(ativas.map(item => http.put(`contract-template-version/desativar/${item.id}`, null, axiosConfig)));
      })
      .then(() => {
        mostrarMensagem(`versão restaurada como nova versão ${novaVersao}!`, "success");
        setAtualizarTabela(!atualizarTabela);
      })
      .catch(erro => {
        mostrarMensagem(erro, "error");
      });
  };

  return (
    <Container style={{ marginTop: "-20px", padding: "0px" }}>
      <Titulo>Versões do Template</Titulo>
      <div style={{ height: '100%', width: '100%' }}>
        <Botao onClick={() => handleOpen("cadastra")}><AddOutlined aria-hidden="true" />Cadastrar</Botao>
        <Botao onClick={() => handleOpen("edita")}><EditOutlined aria-hidden="true" />Editar</Botao>
        <Botao onClick={() => ativaDesativa()}><ToggleOnOutlined aria-hidden="true" />Ativar/Desativar</Botao>

        <ModalContractTemplateVersion
          openVersao={openModal}
          handleCloseVersao={handleClose}
          versoes={versoes}
          id={selectedRows}
          tipo={tipo}
          idTemplate={idTemplate}
        />

        <DataGrid
          style={{
            backgroundColor: "#ffffff",
            borderBottomColor: "rgba(20, 20, 20, 0.12)",
            borderTopColor: "rgba(20, 20, 20, 0.12)",
            color: "#242424",
            borderColor: "rgba(20, 20, 20, 0.12)",
          }}
          rows={versoes.map(item => ({
            ...item,
            createdAt: item.createdAt ? transformDateBR(item.createdAt) : "",
            updatedAt: item.updatedAt ? transformDateBR(item.updatedAt) : "",
          }))}
          columns={columns}
          initialState={{
            pagination: {
              paginationModel: { page: 0, pageSize: 10 },
            },
          }}
          pageSizeOptions={[10, 20]}
          checkboxSelection
          disableRowSelectionOnClick
          onRowSelectionModelChange={(ids) => { setSelectedRows(ids); }}
        />
      </div>
    </Container>
  );
}
