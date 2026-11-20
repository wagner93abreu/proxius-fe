import { ShoppingCartOutlined, AddOutlined, VisibilityOutlined, DeleteOutline, SchoolOutlined } from "@mui/icons-material";
import Container from "../../components/Container";
import Titulo from "../../components/Titulo";
import * as React from 'react';
import { DataGrid, GridColDef, GridPaginationModel, GridRowId } from '@mui/x-data-grid';
import autenticaStore from '../../stores/autentica.store';
import IBodyRequest from '../../types/IBodyRequest';
import http from '../../http';
import { useState, useEffect } from "react";
import Botao from '../../components/Botao';
import IVenda from '../../types/IVenda';
import ModalVenda from "./ModalVenda";
import IVendaTable from "../../types/IVendaTable";
import IVendaResumo from "../../types/IVendaResumo";
import { formataMoeda } from "../../customFunctions/mascarasFormatacao";
import ModalEdita from "./ModalEditar";
import ModalMentoriaGratuita from "./ModalMentoriaGratuita";
import { mostrarMensagem } from "../../stores/mensagem.store";

const columns: GridColDef[] = [
  { field: 'id', headerName: 'ID', width: 50 },
  { field: 'produto', headerName: 'Produto', width: 400 },
  { field: 'cliente', headerName: 'Cliente', width: 400 },
  { field: 'totalcomprador', headerName: 'Valor Comprador', width: 200 },
  { field: 'totalcomissao', headerName: 'Comissão', width: 150 },
  { field: 'datavenda', headerName: 'Data Venda', width: 150 },
  { field: 'statusvenda', headerName: 'Status', width: 130 },
];

export default function Vendas() {
  const [vendas, setVendas] = useState<IVenda[]>([]);
  const [selectedRows, setSelectedRows] = useState<GridRowId[]>([]);
  const [atulizarTabela, setAtulizarTabela] = useState(false);
  const [open, setOpen] = useState(false);
  const [editaOpen, setEditaOpen] = useState(false);
  const [mentoriaGratuitaOpen, setMentoriaGratuitaOpen] = useState(false);
  const [tipo, setTipo] = useState("");
  const { usuario } = autenticaStore;
  const [newVendasTable, setVendasTable] = useState<IVendaTable[]>([]);
  const [rowCount, setRowCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 20,
  });

  const axiosConfig = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${usuario.token}`,
    },
  };

  useEffect(() => {
    http.get<IBodyRequest<IVenda>>('venda?size=500', axiosConfig)
      .then(resposta => {
        setVendas(resposta.data.content);
      })
      .catch(erro => {
        mostrarMensagem(erro, "error");
      });
  }, [atulizarTabela, open, editaOpen, mentoriaGratuitaOpen]);

  useEffect(() => {
    setLoading(true);
    http.get<IBodyRequest<IVendaResumo>>(
      `venda/resumo?page=${paginationModel.page}&size=${paginationModel.pageSize}&sort=id,desc`,
      axiosConfig
    )
      .then(resposta => {
        const vendasResumo: IVendaTable[] = resposta.data.content.map(venda => ({
          id: venda.id,
          produto: venda.produtoPrincipal,
          cliente: venda.nomeCliente,
          totalcomprador: formataMoeda(venda.valorComprador, "BRL"),
          totalcomissao: formataMoeda(venda.comissao, "BRL"),
          datavenda: venda.dataVenda,
          statusvenda: venda.status,
        }));
        setVendasTable(vendasResumo);
        setRowCount(resposta.data.totalElements);
      })
      .catch(erro => {
        mostrarMensagem(erro, "error");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [paginationModel, atulizarTabela, open, editaOpen, mentoriaGratuitaOpen]);

  const handleOpen = (tipo: string) => {
    if (tipo === "cadastra") {
      setTipo("cadastra");
      setOpen(true);
    } else if (tipo === "edita") {
      if (selectedRows.length == 0) {
        mostrarMensagem("nenhum registro selecionado!", "warning");
      } else if (selectedRows.length > 1) {
        mostrarMensagem("Favor selecionar um unico registro!", "warning");
      } else {
        setTipo("edita");
        setOpen(true);
      }
    }
  };

  const editaHandleOpen = () => {
    if(selectedRows.length == 0){
      mostrarMensagem("nenhum usuário selecionado!", "warning")
    }else if(selectedRows.length > 1){
      mostrarMensagem("Favor selecionar um unico usuário!", "warning")
    }else{
      setEditaOpen(true)
    }
  }

  const handleClose = () => {
    setOpen(false);
  };

  const editaHandleClose =() => {
    setEditaOpen(false)    
  }

  const mentoriaGratuitaHandleClose = () => {
    setMentoriaGratuitaOpen(false);
  };

  const excluir = () => {
    if (selectedRows.length == 0) {
      mostrarMensagem("nenhum registro selecionado!", "warning");
    } else if (selectedRows.length > 1) {
      mostrarMensagem("Favor selecionar um unico registro!", "warning");
    } else {
      let id = selectedRows[0];
      http.delete(`venda/${id}`, axiosConfig)
        .then(resposta => {
          mostrarMensagem("VENDA EXCLUIDA COM SUCESSO!", "success");
          setAtulizarTabela(!atulizarTabela);
        })
        .catch(erro => {
          mostrarMensagem(erro, "error");
        });
    }
  };

  return (
    <Container>
      <Titulo icone={<ShoppingCartOutlined />}>Vendas</Titulo>
      <div style={{ height: '100%', width: '100%' }}>
        <Botao onClick={() => handleOpen("cadastra")}><AddOutlined aria-hidden="true" />Cadastrar</Botao>
        <Botao onClick={() => editaHandleOpen()}><VisibilityOutlined aria-hidden="true" />Visualizar</Botao>
        <Botao onClick={() => excluir()} style={{ backgroundColor: "#c50000", borderColor: "#c50000" }}><DeleteOutline aria-hidden="true" />Excluir</Botao>
        <Botao
          onClick={() => setMentoriaGratuitaOpen(true)}
          style={{ backgroundColor: "#ffffff", borderColor: "#ffffff", color: "#6d213c" }}
        ><SchoolOutlined aria-hidden="true" />
          Mentoria Gratuita
        </Botao>
        <ModalVenda open={open} handleClose={handleClose} venda={vendas} id={selectedRows} tipo={tipo} />
        <ModalEdita editaOpen={editaOpen} editaHandleClose={editaHandleClose} editaVenda={vendas} id={selectedRows}/>
        <ModalMentoriaGratuita open={mentoriaGratuitaOpen} handleClose={mentoriaGratuitaHandleClose} />
        <DataGrid style={{
          backgroundColor: "#fffdfa",
          borderBottomColor: "rgba(85, 8, 29, 0.12)",
          borderTopColor: "rgba(85, 8, 29, 0.12)",
          color: "#35252b",
          borderColor: "rgba(85, 8, 29, 0.12)",
        }}
          rows={newVendasTable}
          columns={columns}
          loading={loading}
          paginationMode="server"
          rowCount={rowCount}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[10, 20, 50, 100]}
          checkboxSelection
          disableRowSelectionOnClick
          onRowSelectionModelChange={(ids) => { setSelectedRows(ids);}}
        />
      </div>
    </Container>
  );
}