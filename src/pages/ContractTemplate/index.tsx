import { DescriptionOutlined, AddOutlined, EditOutlined, DeleteOutline } from "@mui/icons-material";
import * as React from 'react';
import { DataGrid, GridColDef, GridRowId } from '@mui/x-data-grid';
import { useState } from "react";
import Botao from '../../components/Botao';
import Container from "../../components/Container";
import Titulo from "../../components/Titulo";
import autenticaStore from '../../stores/autentica.store';
import http from '../../http';
import IBodyRequest from '../../types/IBodyRequest';
import IContractTemplate from '../../types/IContractTemplate';
import ModalContractTemplate from './Modal';
import { transformDateBR } from '../../customFunctions/mascarasFormatacao';
import { mostrarMensagem } from "../../stores/mensagem.store";

export default function ContractTemplate() {
  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'name', headerName: 'Nome', width: 300 },
    { field: 'description', headerName: 'Descrição', width: 500 },
    { field: 'createdAt', headerName: 'Criado em', width: 160 },
  ];

  const [templates, setTemplates] = useState<IContractTemplate[]>([]);
  const [selectedRows, setSelectedRows] = useState<GridRowId[]>([]);
  const [atualizarTabela, setAtualizarTabela] = useState(false);
  const [open, setOpen] = useState(false);
  const [tipo, setTipo] = useState("");
  const { usuario } = autenticaStore;

  const axiosConfig = React.useMemo(() => ({
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${usuario.token}`,
    },
  }), [usuario.token]);

  React.useEffect(() => {
    http.get<IBodyRequest<IContractTemplate>>('contract-template?size=500', axiosConfig)
      .then(resposta => {
        setTemplates(resposta.data.content);
      })
      .catch(erro => {
        mostrarMensagem(erro, "error");
      });
  }, [atualizarTabela, open, axiosConfig]);

  const handleOpen = (nextTipo: string) => {
    if (nextTipo === "cadastra") {
      setTipo("cadastra");
      setOpen(true);
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
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const excluir = () => {
    if (selectedRows.length === 0) {
      mostrarMensagem("nenhum registro selecionado!", "warning");
      return;
    }

    if (selectedRows.length > 1) {
      mostrarMensagem("Favor selecionar um unico registro!", "warning");
      return;
    }

    const id = selectedRows[0];

    http.delete(`contract-template/${id}`, axiosConfig)
      .then(() => {
        mostrarMensagem("template excluido!", "success");
        setAtualizarTabela(!atualizarTabela);
      })
      .catch(erro => {
        mostrarMensagem(erro, "error");
      });
  };

  return (
    <Container>
      <Titulo icone={<DescriptionOutlined />}>Templates de Contratos</Titulo>
      <div style={{ height: '100%', width: '100%' }}>
        <Botao onClick={() => handleOpen("cadastra")}><AddOutlined aria-hidden="true" />Cadastrar</Botao>
        <Botao onClick={() => handleOpen("edita")}><EditOutlined aria-hidden="true" />Editar</Botao>
        <Botao onClick={() => excluir()} style={{ backgroundColor: "#303030", borderColor: "#303030" }}><DeleteOutline aria-hidden="true" />Excluir</Botao>

        <ModalContractTemplate
          open={open}
          handleClose={handleClose}
          templates={templates}
          id={selectedRows}
          tipo={tipo}
        />

        <DataGrid
          style={{
            backgroundColor: "#ffffff",
            borderBottomColor: "rgba(20, 20, 20, 0.12)",
            borderTopColor: "rgba(20, 20, 20, 0.12)",
            color: "#242424",
            borderColor: "rgba(20, 20, 20, 0.12)",
          }}
          rows={templates.map(item => ({
            ...item,
            createdAt: item.createdAt ? transformDateBR(item.createdAt) : "",
          }))}
          columns={columns}
          initialState={{
            pagination: {
              paginationModel: { page: 0, pageSize: 20 },
            },
          }}
          pageSizeOptions={[20, 30, 40]}
          checkboxSelection
          disableRowSelectionOnClick
          onRowSelectionModelChange={(ids) => { setSelectedRows(ids); }}
        />
      </div>
    </Container>
  );
}
