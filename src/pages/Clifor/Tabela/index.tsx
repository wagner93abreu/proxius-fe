import { AddOutlined, EditOutlined, ToggleOnOutlined, DeleteOutline } from "@mui/icons-material";
import * as React from 'react';
import { DataGrid, GridColDef, GridRowId, GridRowModel } from '@mui/x-data-grid';
import IClifor from '../../../types/IClifor';
import autenticaStore from '../../../stores/autentica.store';
import IBodyRequest from '../../../types/IBodyRequest';
import http from '../../../http';
import styled from 'styled-components';
import { useEffect, useState } from "react";
import { Button } from '@mui/material';
import Botao from '../../../components/Botao';
import ModalCadastro from "../ModalCadastro";
import ModalEdita from "../ModalEditar";
import { applyCPForCNPJMask, transformDateBR } from "../../../customFunctions/mascarasFormatacao";
import axios from 'axios';
import { mostrarMensagem } from "../../../stores/mensagem.store";


const columns: GridColDef[] = [
  { field: 'id', headerName: 'ID', width: 100 },
  { field: 'sharePointEmbeddedEnabled', headerName: 'SharePoint Embedded', width: 190,
    valueFormatter: ({ value }) => value === true ? 'Sim' : 'Não' },
  { field: 'nomecomercial', headerName: 'Nome Comercial', width: 200 },
  { field: 'nomesocial', headerName: 'Nome Social', width: 300 },
  { field: 'cpfcnpj', headerName: 'CPF/CNPJ', width: 200 },
  { field: 'inscricaoestadual', headerName: 'Inscrição Estadual', width: 200 },
  { field: 'inscricaomunicipal', headerName: 'Inscrição Municipal', width: 200 },
  { field: 'email', headerName: 'Email', width: 300 },
  { field: 'ddd', headerName: 'DDD', width: 70 },
  { field: 'telefone', headerName: 'Telefone', width: 150 },
  { field: 'datanascimento', headerName: 'Data Nascimento', width: 150 },
  { field: 'genero', headerName: 'Gênero', width: 100 },
  { field: 'escolaridade', headerName: 'Escolaridade', width: 300 },
  { field: 'formacaoacademica', headerName: 'Formação Academica', width: 300 },
  { field: 'estadocivil', headerName: 'Estado Civil', width: 100 },
  { field: 'ocupacao', headerName: 'Ocupação', width: 300},
  { field: 'clifor', headerName: 'CliFor', width: 120 },
  { field: 'idusuario', headerName: 'ID Usuário', width: 100 },
  { field: 'pais', headerName: 'País', width: 200 },
  { field: 'cep', headerName: 'CEP', width: 120 },
  { field: 'uf', headerName: 'Estado', width: 70 },
  { field: 'cidade', headerName: 'Cidade', width: 200 },
  { field: 'bairro', headerName: 'bairro', width: 200 },
  { field: 'logradouro', headerName: 'Logradouro', width: 250 },
  { field: 'complemento', headerName: 'Complemento', width: 100 },
  { field: 'numero', headerName: 'Numero', width: 100 },
  { field: 'active', headerName: 'Ativo', width: 70 }
];


export default function DataTable() {
  const [clifor, setClifor] = useState<IClifor[]>([]);
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
      http.get<IBodyRequest<IClifor>>('clifor?size=500', axiosConfig)
      .then(resposta => {
          
          setClifor(resposta.data.content)
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
      const usuario = clifor.find(item => item.id === id);

      if(usuario?.active){
        http.put(`clifor/desativar/${id}`, null, axiosConfig)
        .then(resposta => {
            mostrarMensagem("usuario desativado!", "success")
            //console.log(resposta)
            setAtulizarTabela(!atulizarTabela)
        })
        .catch(erro => {
          mostrarMensagem(erro, "error")
        })
      }else{
        http.put(`clifor/ativar/${id}`,null ,axiosConfig)
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

      http.delete(`clifor/${id}`, axiosConfig)
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
      <Botao onClick={() =>  handleOpen()}><AddOutlined aria-hidden="true" />Cadastrar</Botao>
      <Botao onClick={() =>  editaHandleOpen()}><EditOutlined aria-hidden="true" />Editar</Botao>
      <Botao onClick={() =>  ativaDesativa()}><ToggleOnOutlined aria-hidden="true" />Ativar/Desativar</Botao>
      <Botao onClick={() =>  excluir()} style={{backgroundColor: "#c50000", borderColor: "#c50000"}}><DeleteOutline aria-hidden="true" />Excluir</Botao>
      <ModalCadastro open={open} handleClose={handleClose} />
      <ModalEdita editaOpen={editaOpen} editaHandleClose={editaHandleClose} clientefornecedor={clifor} id={selectedRows}/>
      <DataGrid style={{ backgroundColor: "#fffdfa",
                        borderBottomColor: "rgba(85, 8, 29, 0.12)",
                        borderTopColor: "rgba(85, 8, 29, 0.12)",
                        color: "#35252b",
                        borderColor:"rgba(85, 8, 29, 0.12)",

                      }}
        rows={clifor.map(item => {
          if(item.cpfcnpj){
            item.cpfcnpj = applyCPForCNPJMask(item.cpfcnpj)
          }
          if(item.datanascimento){
            if(item.datanascimento.indexOf("/") == -1){
              item.datanascimento = transformDateBR(item.datanascimento)
            }           
          }          
          const endereco = item.endereco;    
          return { ...item, ...endereco };
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
        onRowSelectionModelChange={(ids) => {setSelectedRows(ids)}}
      />
    </div>
  );
}