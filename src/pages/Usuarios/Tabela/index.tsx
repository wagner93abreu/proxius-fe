import * as React from 'react';
import { DataGrid, GridColDef, GridRowId, GridRowModel } from '@mui/x-data-grid';
import IUser from '../../../types/IUser';
import autenticaStore from '../../../stores/autentica.store';
import IBodyRequest from '../../../types/IBodyRequest';
import http from '../../../http';
import styled from 'styled-components';
import { useEffect, useState } from "react";
import { Button } from '@mui/material';
import Botao from '../../../components/Botao';
import ModalCadastro from "../ModalCadastro";
import ModalEdita from "../ModalEditar";
import axios from 'axios';
import { AddOutlined, EditOutlined, ToggleOnOutlined, DeleteOutline } from "@mui/icons-material";
import { mostrarMensagem } from "../../../stores/mensagem.store";


const columns: GridColDef[] = [
  { field: 'id', headerName: 'ID', width: 70 },
  { field: 'login', headerName: 'Login', width: 150 },
  { field: 'email', headerName: 'Email', width: 400 },
  { field: 'nome', headerName: 'Nome', width: 200 },
  { field: 'papel', headerName: 'Papel', width: 150 },
  { field: 'datacriacao', headerName: 'Data Criação', width: 170 },
  { field: 'active', headerName: 'Ativo', width: 130 },
];


export default function DataTable() {
  const [usuarios, setUsuarios] = useState<IUser[]>([]);
  const [selectedRows, setSelectedRows] = useState<GridRowId[]>([]);
  const [atulizarTabela, setAtulizarTabela] = useState(false);
  const [open, setOpen ] = useState(false);
  const [editaOpen, setEditaOpen ] = useState(false);
  const {usuario} = autenticaStore;

  
  const axiosConfig = {
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${usuario.token}`,
    },
  };
  
  React.useEffect(() => {
      http.get<IBodyRequest<IUser>>('usuarios?size=200', axiosConfig)
      .then(resposta => {
          setUsuarios(resposta.data.content)
          //console.log("Ta atualizando")
          //console.log(resposta.data.content)
      })
      .catch(erro => {
          mostrarMensagem(erro, "error")
      })

  }, [atulizarTabela, open, editaOpen]);

  const handleOpen = () => {
    setOpen(true)
  }

  const handleClose =() => {
    setOpen(false)    
  }
  const editaHandleOpen = () => {
    if(selectedRows.length == 0){
      mostrarMensagem("nenhum usuário selecionado!", "warning")
    }else if(selectedRows.length > 1){
      mostrarMensagem("Favor selecionar um unico usuário!", "warning")
    }else{
      setEditaOpen(true)
    }
  }

  const editaHandleClose =() => {
    setEditaOpen(false)    
  }

  const ativaDesativa = () => {
    
    if(selectedRows.length == 0){
      mostrarMensagem("nenhum usuário selecionado!", "warning")
    }else if(selectedRows.length > 1){
      mostrarMensagem("Favor selecionar um unico usuário!", "warning")
    }else{
      let id = selectedRows[0]
      const usuario = usuarios.find(item => item.id === id);

      if(usuario?.active){
        http.put(`usuarios/desativar/${id}`, null, axiosConfig)
        .then(resposta => {
            mostrarMensagem("usuario desativado!", "success")
            //console.log(resposta)
            setAtulizarTabela(!atulizarTabela)
        })
        .catch(erro => {
          mostrarMensagem(erro, "error")
        })
      }else{
        http.put(`usuarios/ativar/${id}`,null ,axiosConfig)
        .then(resposta => {
            mostrarMensagem("usuario ativado!", "success")
            //console.log(resposta)
            setAtulizarTabela(!atulizarTabela)
        })
        .catch(erro => {
          //console.log("deu ruim")
          mostrarMensagem(erro, "error")
        })
      }
    }
  }
  const excluir = () => {
    
    if(selectedRows.length == 0){
      mostrarMensagem("nenhum usuário selecionado!", "warning")
    }else if(selectedRows.length > 1){
      mostrarMensagem("Favor selecionar um unico usuário!", "warning")
    }else{
      let id = selectedRows[0]

      http.delete(`usuarios/${id}`, axiosConfig)
      .then(resposta => {
          mostrarMensagem("usuario excluido!", "success")
          //console.log(resposta)
          setAtulizarTabela(!atulizarTabela)
      })
      .catch(erro => {
        mostrarMensagem(erro, "error")
      })   
    }
  }
  


  return (
    <div style={{ height: '100%', width: '100%'}}>
      <Botao onClick={() =>  handleOpen()}><AddOutlined aria-hidden="true" />Cadastrar usuario</Botao>
      <Botao onClick={() =>  editaHandleOpen()}><EditOutlined aria-hidden="true" />Editar usuario</Botao>
      <Botao onClick={() =>  ativaDesativa()}><ToggleOnOutlined aria-hidden="true" />Ativar/Desativar</Botao>
      <Botao onClick={() =>  excluir()} style={{backgroundColor: "#c50000", borderColor: "#c50000"}}><DeleteOutline aria-hidden="true" />Excluir</Botao>
      <ModalCadastro open={open} handleClose={handleClose} />
      <ModalEdita editaOpen={editaOpen} editaHandleClose={editaHandleClose} user={usuarios} id={selectedRows}/>
      <DataGrid style={{ backgroundColor: "#fffdfa",
                        borderBottomColor: "rgba(85, 8, 29, 0.12)",
                        borderTopColor: "rgba(85, 8, 29, 0.12)",
                        color: "#35252b",
                        borderColor:'rgba(85, 8, 29, 0.12)',

                      }}
        rows={usuarios}
        columns={columns}
        initialState={{
          pagination: {
            paginationModel: { page: 0, pageSize: 10 },
          },
        }}
        pageSizeOptions={[10, 20, 50]}
        checkboxSelection
        disableRowSelectionOnClick
        onRowSelectionModelChange={(ids) => {setSelectedRows(ids)}}
      />
    </div>
  );
}