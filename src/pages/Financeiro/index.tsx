import { AccountBalanceWalletOutlined, AddOutlined, EditOutlined, DeleteOutline } from "@mui/icons-material";
import Container from "../../components/Container";
import Titulo from "../../components/Titulo";
import * as React from 'react';
import { DataGrid, GridColDef, GridRowId } from '@mui/x-data-grid';
import autenticaStore from '../../stores/autentica.store';
import IBodyRequest from '../../types/IBodyRequest';
import http from '../../http';
import { useState } from "react";
import Botao from '../../components/Botao';
import IFinanceiro from '../../types/IFinanceiro';
import ModalFinanceiro from "./Modal";
import ICategoriasFinanceiro from "../../types/ICategoriasFinanceiro";
import { formataMoeda, transformDateBR } from "../../customFunctions/mascarasFormatacao";
import ConsolidadoFinanceiro from "../ConsolidadoFinanceiro";
import { Grid } from '@mui/material';
import ConsolidadoFin from "../ConsolidadoFin";
import { mostrarMensagem } from "../../stores/mensagem.store";


const columns: GridColDef[] = [
  { field: 'id', headerName: 'ID', width: 100 },
  { field: 'tipo', headerName: 'Entrada/Saída', width: 150 },
  { field: 'denominacao', headerName: 'Denominação', width: 200 },
  { field: 'categoria', headerName: 'Categoria', width: 200 },
  { field: 'descricao', headerName: 'Descrição', width: 800 },
  { field: 'dataprevista', headerName: 'Data Prevista', width: 200 },
  { field: 'dataexecutada', headerName: 'Data Executada', width: 200 },
  { field: 'valor', headerName: 'Valor', width: 200 }
];

export default function Financeiro(){
  const [financeiro, setFinanceiro] = useState<IFinanceiro[]>([]);
  const [selectedRows, setSelectedRows] = useState<GridRowId[]>([]);
  const [atulizarTabela, setAtulizarTabela] = useState(false);
  const [open, setOpen ] = useState(false);
  const [editaOpen, setEditaOpen ] = useState(false);
  const [tipo, setTipo] = useState("");
  const {usuario} = autenticaStore;
  const[categoriasFinanceiro, setCategoriasFinanceiro] = useState<ICategoriasFinanceiro[]>([]);
  
  const axiosConfig = {
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${usuario.token}`,
    },
  };
  
  React.useEffect(() => {
      http.get<IBodyRequest<IFinanceiro>>('financeiro?size=500', axiosConfig)
      .then(resposta => {
          setFinanceiro(resposta.data.content)
      })
      .catch(erro => {
          mostrarMensagem(erro, "error")
      })

      http.get<IBodyRequest<ICategoriasFinanceiro>>('categoriafinanceiro?size=200', axiosConfig)
      .then(resposta => {
          setCategoriasFinanceiro(resposta.data.content.filter(categoriasFinanceiro => categoriasFinanceiro.active))  
          //console.log("TODAS CATEGORIAS FINANCEIRO")    
          //console.log(resposta.data.content)      
      })
      .catch(erro => {
          mostrarMensagem(erro, "error")
      }) 

  }, [atulizarTabela, open, editaOpen]);
  //console.log("FINANCEIRO FINANCEIRO FINANCEIRO FINANCEIRO")
  //console.log(financeiro)

  const newFinanceiroTable = financeiro.map((fin) => {
    //console.log('ENTREI')
    //console.log(fin)
    let catFin = categoriasFinanceiro.filter((catFin) => {
      //console.log("idcategoria: " + fin.idcategoria)
      //console.log("idcatfin: " + catFin.id)
      if(catFin.id === fin.idcategoria){
        //console.log("denominacao: " + catFin.denominacao) 
        //console.log(catFin.denominacao)
        return catFin
      } 
    })
    //console.log("VEJA AQUI")
    //console.log(catFin)
    return {
      id: fin.id,
      tipo: fin.tipo,
      denominacao: catFin[0].denominacao,
      categoria: catFin[0].categoria,
      descricao: fin.descricao,
      dataprevista: fin.dataprevista !== null ? fin.dataprevista : "",
      dataexecutada: fin.dataexecutada !== null ? fin.dataexecutada : "",
      valor: formataMoeda(fin.valor, fin.moeda)
    };
    
  });

  //console.log(newFinanceiroTable)

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

  const excluir = () => {
    
    if(selectedRows.length == 0){
      mostrarMensagem("nenhum registro selecionado!", "warning")
    }else if(selectedRows.length > 1){
      mostrarMensagem("Favor selecionar um unico registro!", "warning")
    }else{
      let id = selectedRows[0]

      http.delete(`financeiro/${id}`, axiosConfig)
      .then(resposta => {
          mostrarMensagem("registro excluido!", "success")
          //console.log(resposta)
          setAtulizarTabela(!atulizarTabela)
      })
      .catch(erro => {
        mostrarMensagem(erro, "error")
      })   
    }
  }

    return(
        <Container>
          
          <Grid container spacing={2} > 
          <Grid item xs={12} md={4}>
          <Titulo icone={<AccountBalanceWalletOutlined />}>Cadastro Financeiro</Titulo>
          <Botao onClick={() =>  handleOpen("cadastra")}><AddOutlined aria-hidden="true" />Cadastrar</Botao>
          <Botao onClick={() =>  handleOpen("edita")}><EditOutlined aria-hidden="true" />Editar</Botao>
          <Botao onClick={() =>  excluir()} style={{backgroundColor: "#303030", borderColor: "#303030"}}><DeleteOutline aria-hidden="true" />Excluir</Botao>
            </Grid>           
            <Grid item xs={12} md={8}>
            <ConsolidadoFin/>
            </Grid>                 
          </Grid>
          
          <div style={{ height: '100%', width: '100%'}}>
          
          <ModalFinanceiro open={open} handleClose={handleClose} financeiro={financeiro} id={selectedRows} tipo={tipo}/>
          <DataGrid style={{ backgroundColor: "#ffffff",
                            borderBottomColor: "rgba(20, 20, 20, 0.12)",
                            borderTopColor: "rgba(20, 20, 20, 0.12)",
                            color: "#242424",
                            borderColor:"rgba(20, 20, 20, 0.12)",

                          }}
            rows={newFinanceiroTable}
            columns={columns}
            initialState={{
              pagination: {
                paginationModel: { page: 0, pageSize: 15 },
              },
            }}
            pageSizeOptions={[10, 20, 50, 100]}
            checkboxSelection
            disableRowSelectionOnClick
            onRowSelectionModelChange={(ids) => {setSelectedRows(ids)}}
          />
        </div>
        </Container>
    )
}
