import { AddOutlined, EditOutlined, ToggleOnOutlined, DeleteOutline } from "@mui/icons-material";
import * as React from 'react';
import { DataGrid, GridColDef, GridRowId } from '@mui/x-data-grid';
import autenticaStore from '../../stores/autentica.store';
import http from '../../http';
import { useState } from "react";
import Botao from '../../components/Botao';
import Container from "../../components/Container";
import Titulo from "../../components/Titulo";
import ModalPrecificacao from './Modal';
import IPrecificacao from '../../types/IPrecificacao';
import { transformDateBR, formataMoeda } from '../../customFunctions/mascarasFormatacao';
import { mostrarMensagem } from "../../stores/mensagem.store";

export default function Precificacao({ idProd } : {idProd: string}){
  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'cupom', headerName: 'Cupom', width: 100 },
    { field: 'moeda', headerName: 'Moeda', width: 200 },
    { field: 'valor', headerName: 'Valor', width: 150, align: 'right' },
    { field: 'data', headerName: 'Data Cadastro', width: 200, align : 'center' },    
    { field: 'active', headerName: 'Ativo', width: 130 },
    { field: 'linkpgto', headerName: 'Link de pagamento', width: 600 },
  ]; 
  
  
  const [precificacao, setPrecificacao] = useState<IPrecificacao[]>([]);
  const [selectedRows, setSelectedRows] = useState<GridRowId[]>([]);
  const [atulizarTabelaP, setAtulizarTabelaP] = useState(false);
  const [openP, setOpen ] = useState(false);
  const [editaOpenP, setEditaOpenP ] = useState(false);
  const [tipo, setTipo] = useState("");
  const {usuario} = autenticaStore;

  
  const axiosConfig = {
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${usuario.token}`,
    },
  };
  
  React.useEffect(() => {
      setPrecificacao([]);
      setSelectedRows([]);
  }, [idProd]);

  React.useEffect(() => {
      if (!idProd.trim()) return;
      let active = true;
      http.get<IPrecificacao[]>(`precificacao/produto/${idProd}`, axiosConfig)
      .then(resposta => {
          if (active) setPrecificacao(resposta.data);
      })
      .catch(erro => {
          if (active) mostrarMensagem(erro, "error");
      });
      return () => { active = false; };
  }, [idProd, atulizarTabelaP, openP, editaOpenP]);
  
  const handleOpenP = (tipo: string) => {
    if(tipo === "cadastra"){
      setTipo("cadastra")
      setOpen(true)
    }else if(tipo === "edita"){       
      if(selectedRows.length == 0){
        mostrarMensagem("nenhum registro selecionado!", "warning")
      }else if(selectedRows.length > 1){
        mostrarMensagem("Favor selecionar um unico registro!", "warning")
      }else{
        setTipo("edita")
        setOpen(true)
      }
    }
  }

  const handleCloseP =() => {
    setOpen(false)    
  }

  const ativaDesativaP = () => {
    
    if(selectedRows.length == 0){
      mostrarMensagem("nenhum registro selecionado!", "warning")
    }else if(selectedRows.length > 1){
      mostrarMensagem("Favor selecionar um unico registro!", "warning")
    }else{
      let id = selectedRows[0]
      const precifica = precificacao.find(item => item.id === id);

      if(precifica?.active){
        http.put(`precificacao/desativar/${id}`, null, axiosConfig)
        .then(resposta => {
            mostrarMensagem("precificação desativada!", "success")
            //console.log(resposta)
            setAtulizarTabelaP(!atulizarTabelaP)
        })
        .catch(erro => {
          mostrarMensagem(erro, "error")
        })
      }else{
        http.put(`precificacao/ativar/${id}`,null ,axiosConfig)
        .then(resposta => {
            mostrarMensagem("precificação ativada!", "success")
            //console.log(resposta)
            setAtulizarTabelaP(!atulizarTabelaP)
        })
        .catch(erro => {
          //console.log("ERRO")
          mostrarMensagem(erro, "error")
        })
      }
    }
  }
  const excluirP = () => {
    
    if(selectedRows.length == 0){
      mostrarMensagem("nenhum registro selecionado!", "warning")
    }else if(selectedRows.length > 1){
      mostrarMensagem("Favor selecionar um unico registro!", "warning")
    }else{
      let id = selectedRows[0]

      http.delete(`precificacao/${id}`, axiosConfig)
      .then(resposta => {
          mostrarMensagem("precificação excluida!", "success")
          //console.log(resposta)
          setAtulizarTabelaP(!atulizarTabelaP)
      })
      .catch(erro => {
        mostrarMensagem(erro, "error")
      })   
    }
  }

  

  return (
    <Container style={{marginTop: "-20px",padding: "0px"}}>
          <Titulo>Precificação</Titulo>
          <div style={{ height: '100%', width: '100%'}}>
            <Botao onClick={() =>  handleOpenP("cadastra")}><AddOutlined aria-hidden="true" />Cadastrar</Botao>
            <Botao onClick={() =>  handleOpenP("edita")}><EditOutlined aria-hidden="true" />Editar</Botao>
            <Botao onClick={() =>  ativaDesativaP()}><ToggleOnOutlined aria-hidden="true" />Ativar/Desativar</Botao>
            <Botao onClick={() =>  excluirP()} style={{backgroundColor: "#c50000", borderColor: "#c50000"}}><DeleteOutline aria-hidden="true" />Excluir</Botao>
            <ModalPrecificacao openP={openP} handleCloseP={handleCloseP} precificacao={precificacao} id={selectedRows} tipo={tipo} idProduto={idProd}/>

            <DataGrid style={{ backgroundColor: "#fffdfa",
                              borderBottomColor: "rgba(85, 8, 29, 0.12)",
                              borderTopColor: "rgba(85, 8, 29, 0.12)",
                              color: "#35252b",
                              borderColor:"rgba(85, 8, 29, 0.12)",

                            }}
              
              rows={precificacao.map(item => {

                if(item.data){
                  if(item.data.indexOf("/") == -1){
                    item.data = transformDateBR(item.data)
                  }           
                }
                
                item.valor = formataMoeda(item.valor, item.moeda)
                        
  
                return { ...item};
              })}
              columns={columns}
              initialState={{
                pagination: {
                  paginationModel: { page: 0, pageSize: 10 },
                },
              }}
              pageSizeOptions={[10, 20]}
              checkboxSelection
              disableRowSelectionOnClick
              rowSelectionModel={selectedRows}
              onRowSelectionModelChange={(ids) => {setSelectedRows(ids)}}
            />
          </div>
    </Container>
  );
}