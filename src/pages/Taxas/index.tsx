import * as React from 'react';
import { DataGrid, GridColDef, GridRowId } from '@mui/x-data-grid';
import autenticaStore from '../../stores/autentica.store';
import IBodyRequest from '../../types/IBodyRequest';
import http from '../../http';
import { useState } from "react";
import Botao from '../../components/Botao';
import ITaxa from '../../types/ITaxa';
import Container from "../../components/Container";
import Titulo from "../../components/Titulo";
import ModalCadastro from './Modal';
import { PercentOutlined, AddOutlined, EditOutlined, DeleteOutline } from "@mui/icons-material";
import { mostrarMensagem } from "../../stores/mensagem.store";

/* id bigint not null auto_increment,
fornecedor varchar(100) not null,
tipo varchar(100) not null,
bandeira varchar(100) not null,
parcela int not null,
valormaximo decimal(10, 2),
porcentagem bool not null,
valortaxa decimal(10, 2) not null,
 */


export default function Taxas(){
  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'fornecedor', headerName: 'Fornecedor', width: 150 },
    { field: 'tipo', headerName: 'Tipo', width: 200 },
    { field: 'bandeira', headerName: 'Bandeira', width: 200 },
    { field: 'parcela', headerName: 'Parcela', width: 200 },
    { field: 'valormaximo', headerName: 'Valo Maximo', width: 130 },
    { field: 'porcentagem', headerName: 'Porcentagem', width: 130 },
    { field: 'valortaxa', headerName: 'Valor Taxa', width: 130 },
  ];
  
  
  
    const [taxas, setTaxas] = useState<ITaxa[]>([]);
    const [selectedRows, setSelectedRows] = useState<GridRowId[]>([]);
    const [atulizarTabela, setAtulizarTabela] = useState(false);
    const [open, setOpen ] = useState(false);
    const [editaOpen, setEditaOpen ] = useState(false);
    const [tipo, setTipo] = useState("");
    const {usuario} = autenticaStore;
  
    
    const axiosConfig = {
      headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${usuario.token}`,
      },
    };
    
    React.useEffect(() => {
        http.get<IBodyRequest<ITaxa>>('taxa?size=100&page=0&sort=fornecedor', axiosConfig)
        .then(resposta => {
          setTaxas(resposta.data.content)
            //console.log("Ta atualizando")
            //console.log(resposta.data.content)
        })
        .catch(erro => {
            mostrarMensagem(erro, "error")
        })
  
    }, [atulizarTabela, open, editaOpen]);
  
    const handleOpen = (tipo: string) => {
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

    const handleClose =() => {
      setOpen(false)    
    }

    /* const ativaDesativa = () => {
      
      if(selectedRows.length == 0){
        alert("nenhum registro selecionado!")
      }else if(selectedRows.length > 1){
        alert("Favor selecionar um unico registro!")
      }else{
        let id = selectedRows[0]
        const categoria = taxas.find(item => item.id === id);
  
        if(categoria?.active){
          http.put(`categoriafinanceiro/desativar/${id}`, null, axiosConfig)
          .then(resposta => {
              alert("categoria desativada!")
              //console.log(resposta)
              setAtulizarTabela(!atulizarTabela)
          })
          .catch(erro => {
            alert(erro)
          })
        }else{
          http.put(`categoriafinanceiro/ativar/${id}`,null ,axiosConfig)
          .then(resposta => {
              alert("categoria ativada!")
              //console.log(resposta)
              setAtulizarTabela(!atulizarTabela)
          })
          .catch(erro => {
            //console.log("deu ruim")
            alert(erro)
          })
        }
      }
    } */
    const excluir = () => {
      
      if(selectedRows.length == 0){
        mostrarMensagem("nenhum registro selecionado!", "warning")
      }else if(selectedRows.length > 1){
        mostrarMensagem("Favor selecionar um unico registro!", "warning")
      }else{
        let id = selectedRows[0]
  
        http.delete(`taxa/${id}`, axiosConfig)
        .then(resposta => {
            mostrarMensagem("taxa excluida!", "success")
            //console.log(resposta)
            setAtulizarTabela(!atulizarTabela)
        })
        .catch(erro => {
          mostrarMensagem(erro, "error")
        })   
      }
    }


  return (
    <Container>
          <Titulo icone={<PercentOutlined />}>Taxas</Titulo>
          <div style={{ height: '100%', width: '100%'}}>
            <Botao onClick={() =>  handleOpen("cadastra")}><AddOutlined aria-hidden="true" />Cadastrar</Botao>
            <Botao onClick={() =>  handleOpen("edita")}><EditOutlined aria-hidden="true" />Editar</Botao>
            {/* <Botao onClick={() =>  ativaDesativa()}>Ativar/Desativar</Botao> */}
            <Botao onClick={() =>  excluir()} style={{backgroundColor: "#303030", borderColor: "#303030"}}><DeleteOutline aria-hidden="true" />Excluir</Botao>
            <ModalCadastro open={open} handleClose={handleClose} taxas={taxas} id={selectedRows} tipo={tipo}/>

            <DataGrid style={{ backgroundColor: "#ffffff",
                              borderBottomColor: "rgba(20, 20, 20, 0.12)",
                              borderTopColor: "rgba(20, 20, 20, 0.12)",
                              color: "#242424",
                              borderColor:'rgba(20, 20, 20, 0.12)',

                            }}
              rows={taxas}
              columns={columns}
              initialState={{
                pagination: {
                  paginationModel: { page: 0, pageSize: 10 },
                },
              }}
              pageSizeOptions={[10, 20, 50, 100]}
              checkboxSelection
              disableRowSelectionOnClick
              onRowSelectionModelChange={(ids) => {setSelectedRows(ids)}}
            />
          </div>
    </Container>
  );
}
