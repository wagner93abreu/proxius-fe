import * as React from 'react';
import { DataGrid, GridColDef, GridRowId } from '@mui/x-data-grid';
import autenticaStore from '../../stores/autentica.store';
import IBodyRequest from '../../types/IBodyRequest';
import http from '../../http';
import { useState } from "react";
import Botao from '../../components/Botao';
import ICategoriasFinanceiro from '../../types/ICategoriasFinanceiro';
import Container from "../../components/Container";
import Titulo from "../../components/Titulo";
import ModalCadastro from './Modal';
import { CategoryOutlined, AddOutlined, EditOutlined, ToggleOnOutlined, DeleteOutline } from "@mui/icons-material";
import { mostrarMensagem } from "../../stores/mensagem.store";





export default function CategoriasFinanceiro(){
  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'tipo', headerName: 'Entrada/Saída', width: 150 },
    { field: 'denominacao', headerName: 'Denominação', width: 200 },
    { field: 'categoria', headerName: 'Categoria', width: 200 },
    { field: 'exemplo', headerName: 'Exemplo', width: 400 },
    { field: 'active', headerName: 'Ativo', width: 130 },
  ];
  
  
  
    const [categorias, setCategorias] = useState<ICategoriasFinanceiro[]>([]);
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
        http.get<IBodyRequest<ICategoriasFinanceiro>>('categoriafinanceiro?size=500', axiosConfig)
        .then(resposta => {
            setCategorias(resposta.data.content)
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

    const ativaDesativa = () => {
      
      if(selectedRows.length == 0){
        mostrarMensagem("nenhum registro selecionado!", "warning")
      }else if(selectedRows.length > 1){
        mostrarMensagem("Favor selecionar um unico registro!", "warning")
      }else{
        let id = selectedRows[0]
        const categoria = categorias.find(item => item.id === id);
  
        if(categoria?.active){
          http.put(`categoriafinanceiro/desativar/${id}`, null, axiosConfig)
          .then(resposta => {
              mostrarMensagem("categoria desativada!", "success")
              //console.log(resposta)
              setAtulizarTabela(!atulizarTabela)
          })
          .catch(erro => {
            mostrarMensagem(erro, "error")
          })
        }else{
          http.put(`categoriafinanceiro/ativar/${id}`,null ,axiosConfig)
          .then(resposta => {
              mostrarMensagem("categoria ativada!", "success")
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
        mostrarMensagem("nenhum registro selecionado!", "warning")
      }else if(selectedRows.length > 1){
        mostrarMensagem("Favor selecionar um unico registro!", "warning")
      }else{
        let id = selectedRows[0]
  
        http.delete(`categoriafinanceiro/${id}`, axiosConfig)
        .then(resposta => {
            mostrarMensagem("categoria excluida!", "success")
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
          <Titulo icone={<CategoryOutlined />}>Categorias Financeiro</Titulo>
          <div style={{ height: '100%', width: '100%'}}>
            <Botao onClick={() =>  handleOpen("cadastra")}><AddOutlined aria-hidden="true" />Cadastrar categoria</Botao>
            <Botao onClick={() =>  handleOpen("edita")}><EditOutlined aria-hidden="true" />Editar categoria</Botao>
            <Botao onClick={() =>  ativaDesativa()}><ToggleOnOutlined aria-hidden="true" />Ativar/Desativar</Botao>
            <Botao onClick={() =>  excluir()} style={{backgroundColor: "#c50000", borderColor: "#c50000"}}><DeleteOutline aria-hidden="true" />Excluir</Botao>
            <ModalCadastro open={open} handleClose={handleClose} categorias={categorias} id={selectedRows} tipo={tipo}/>

            <DataGrid style={{ backgroundColor: "#fffdfa",
                              borderBottomColor: "rgba(85, 8, 29, 0.12)",
                              borderTopColor: "rgba(85, 8, 29, 0.12)",
                              color: "#35252b",
                              borderColor:'rgba(85, 8, 29, 0.12)',

                            }}
              rows={categorias}
              columns={columns}
              initialState={{
                pagination: {
                  paginationModel: { page: 0, pageSize: 50 },
                },
              }}
              pageSizeOptions={[30, 50, 100]}
              checkboxSelection
              disableRowSelectionOnClick
              onRowSelectionModelChange={(ids) => {setSelectedRows(ids)}}
            />
          </div>
    </Container>
  );
}
