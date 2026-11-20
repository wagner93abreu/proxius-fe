import { managementFieldStyles } from "../../styles/managementStyles";
import createCrmSelectStyles from "../../styles/crmSelectStyles";
import { PaymentsOutlined, AddOutlined, DeleteOutline, AccountBalanceWalletOutlined } from "@mui/icons-material";
import * as React from 'react';
import { DataGrid, GridColDef, GridRowId } from '@mui/x-data-grid';
import { Grid } from '@mui/material';
import autenticaStore from '../../stores/autentica.store';
import http from '../../http';
import { useState } from "react";
import Botao from '../../components/Botao';
import Container from "../../components/Container";
import Titulo from "../../components/Titulo";
import ModalComissao from './Modal';
import IClifor from '../../types/IClifor';
import styled from "styled-components";
import Select from 'react-select';
import IComissao from '../../types/IComissao';
import { formataMoeda, transformDateBR } from '../../customFunctions/mascarasFormatacao';
import IComissaoTable from '../../types/IComissaoTable';
import IVenda from '../../types/IVenda';
import IFinanceiro from '../../types/IFinanceiro';
import { mostrarMensagem } from "../../stores/mensagem.store";

const SelectCustomizado = styled(Select)`
    background: #F0F0F0;
    margin-top: 3px;
    margin-bottom: 25px;
    box-sizing: border-box;
    box-shadow: none;
    border-radius: 12px;
    border: none;
`

const Rotulo = styled.label`
    display: block;
    font-weight: 700;
    font-size: 16px;
    line-height: 19px;
    color: #35252b
`

const Campo = styled.input`
    font-size: 15px;
    background: #f0f0f0;
    margin-top: 3px;
    margin-bottom: 25px;
    box-sizing: border-box;
    box-shadow: none;
    border-radius: 12px;
    border: none;
    width: 100%;
    padding: 10px;
    ${managementFieldStyles}
`

export default function Comissao(){
  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 50 },
    { field: 'colaborador', headerName: 'Colaborador', width: 150 },
    { field: 'venda', headerName: 'Venda', width: 400 },
    { field: 'cliente', headerName: 'Cliente', width: 300 },
    { field: 'valor', headerName: 'Valor', width: 200 },
    { field: 'tipo', headerName: 'Tipo', width: 300 },
    { field: 'data', headerName: 'data', width: 200 }

  ];
  
  const [comissoes, setComissoes] = useState<IComissao[]>([]);
  const [selectedRows, setSelectedRows] = useState<GridRowId[]>([]);
  const [atulizarTabela, setAtulizarTabela] = useState(false);
  const [open, setOpen ] = useState(false);
  const [tipo, setTipo] = useState("");
  const {usuario} = autenticaStore;
  const [colaboradores, setColaboradores] = useState<IClifor[]>([]); 
  const [colaborador, setColaborador] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [totalComissao, setTotalComissao] = useState(0);
  const [financeiro, setFinanceiro] = useState("Financeiro não gerado");
  const [newComissoesTable, setComissoesTable] = useState<IComissaoTable[]>([]);
  const [papel, setPapel] = useState<string | null>('')
  const [colabNome, setColabNome] = useState("")
  
  const axiosConfig = {
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${usuario.token}`,
    },
  };

  React.useEffect(() => {
    if(!open){
      if(colaboradores.length === 0){
        Promise.all([
          http.get<IClifor[]>(`clifor/filter?attribute=clifor&value=FORNECEDOR`, axiosConfig),
          http.get<IClifor[]>(`clifor/filter?attribute=clifor&value=CLIFOR`, axiosConfig),
        ])
        .then(([respostaFornecedor, respostaClifor]) => {
            const colaboradores = [...respostaFornecedor.data, ...respostaClifor.data]
              .filter(clifor => clifor.active);
            setColaboradores(colaboradores)
        })
        .catch(erro => {
            mostrarMensagem(erro, "error")
        })  
      }
       
      if(colaborador === ""){
        
        http.get(`usuarios/${localStorage.getItem('userID')}`, axiosConfig).then(resposta => {
          setPapel(resposta.data.papel)  
          if(resposta.data.papel === 'COLABORADOR' || resposta.data.papel === 'ATENDIMENTO'){
            
          let colabDados = colaboradores.filter(c => c.idusuario == localStorage.getItem('userID'))
          if (colabDados.length > 0){ 
            if (colabDados[0].cpfcnpj) {
              setColaborador(colabDados[0].cpfcnpj);
              setColabNome(colabDados[0].cpfcnpj + " - " + colabDados[0].nomecomercial + " " + colabDados[0].nomesocial)
              
            }
          }
          }
        })
        .catch(erro => {
            mostrarMensagem(erro, "error")
        });
      }
      
    }
    if(colaborador !== "" && colaborador !== undefined){
      http.get<IFinanceiro>(`financeiro/findComissaoFinanceiro?data=${month}/${year}&descricao=${colaborador}`, axiosConfig)
    .then(resposta => {
        if(resposta.data.descricao == null){
          setFinanceiro("Pagamento pendente de validação pelo financeiro")
        }else{
          setFinanceiro(resposta.data.descricao)
        }      
      })
      .catch(erro => {
        setFinanceiro("Pagamento pendente de validação pelo financeiro")
      }) 
    }     

    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);

    const formattedFirstDay = firstDay.toISOString().split('T')[0];
    const formattedLastDay = lastDay.toISOString().split('T')[0];
    setStartDate(formattedFirstDay);
    setEndDate(formattedLastDay);
    
    if(startDate && endDate && colaborador && !open){
    carregarTabelaComissoes()
    }
    

  }, [year, month, colaborador, open, colaboradores]);

  React.useEffect(() => {
    //console.log("tamanho comissoes: " + comissoes.length) 
    if(comissoes.length == 0) return;
    //console.log("entrou useeffect")
    const processarVendas = async () => {
      const newComissoesTable = await Promise.all(comissoes.map(comissao => processComissoes(comissao)));
      setComissoesTable(newComissoesTable);
    };

    processarVendas();
  }, [comissoes]);

  const processComissoes = async (comissao: any): Promise<IComissaoTable> => {
    let nomeCliente = '';
    let vendaFormatada = '';
    
    try {
      if(comissao.venda == 0){
        vendaFormatada = "SEM VENDA"
        nomeCliente =  "SEM VENDA"
      }else{
      const resposta1 = await http.get<IVenda>(`venda/${comissao.venda}`, axiosConfig);
      vendaFormatada = resposta1.data.id + ' - ' +resposta1.data.produto;

      const resposta2 = await http.get<IClifor[]>(`clifor/filter?attribute=cpfcnpj&value=${resposta1.data.documentocliente}`, axiosConfig);
      nomeCliente = resposta2.data[0].nomecomercial + " " + resposta2.data[0].nomesocial;

     }
    } catch (erro) {
      mostrarMensagem("VENDA ERRO: " + erro, "error");
    }

    return {
        id: comissao.id,
        colaborador: colaboradores.filter(colaborador => colaborador.cpfcnpj === comissao.colaborador)[0].nomecomercial,
        venda: vendaFormatada,
        cliente: nomeCliente,
        valor: formataMoeda(comissao.valor, 'BRL'),
        tipo: comissao.tipo,
        data: transformDateBR(comissao.data)
    };
  };
  
  const colaboradoresFormatados = colaboradores.map(colaborador => ({
      value: colaborador.cpfcnpj,
      label: colaborador.cpfcnpj + " - " + colaborador.nomecomercial + " " + colaborador.nomesocial
  }));
    
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

  const getFifthBusinessDay = (year: number, month: number): string => {
    // Calcule o primeiro dia do mês subsequente
    const firstDayOfNextMonth = new Date(year, month, 1);
  
    let businessDayCount = 0;
    let currentDate = firstDayOfNextMonth;
  
    // Itere até encontrar o 5º dia útil
    while (businessDayCount < 5) {
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // 0 = Domingo, 6 = Sábado
        businessDayCount++;
      }
      if (businessDayCount < 5) {
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }
  
    // Formate a data no formato YYYY-MM-DD
    const formattedDate = currentDate.toISOString().split('T')[0];
    return formattedDate;
  };

  const geraFinanceiro = () => {
    let nomeColaborador = colaboradores.filter(c => c.cpfcnpj === colaborador)?.[0]?.nomecomercial || ''
    let sobrenomeColaborador = colaboradores.filter(c => c.cpfcnpj === colaborador)?.[0]?.nomesocial || ''
    
    let mesAno = month + "/" + year

    const fin: IFinanceiro[] = [{
      id: null,
      tipo: 'S',
      descricao: 'COMISSAO: ' + colaborador + " - " + nomeColaborador + " " + sobrenomeColaborador + " -  Referente: " + mesAno,
      idcategoria: '11',
      dataprevista: getFifthBusinessDay(year, month),
      dataexecutada: '',
      moeda: "BRL",
      valor: parseFloat(totalComissao.toFixed(2)) 
    }]

    if(financeiro !== "Pagamento pendente de validação pelo financeiro"){
      return mostrarMensagem("Financeiro já cadastrado. Caso necessário exclua o registro e gere novamente.", "warning")
    } 
        
    const userConfirmed = window.confirm("Você tem certeza que deseja criar o registro FINANCEIRO?");
    if (!userConfirmed) {
      return;
    }
    http.post(`financeiro`,fin ,axiosConfig)
    .then(resposta => {
        mostrarMensagem("registro FINANCEIRO cadastrado com SUCESSO!", "success")

        setFinanceiro(resposta.data[0].descricao)

    })
    .catch(erro => {            
        mostrarMensagem("ERRO:" + erro, "error")
    })      

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

      http.delete(`comissao/${id}`, axiosConfig)
      .then(resposta => {
          mostrarMensagem("categoria excluida!", "success")
          setAtulizarTabela(!atulizarTabela)
      })
      .catch(erro => {
        mostrarMensagem(erro, "error")
      })   
    }
  }


  const handleYearChange = (option: any) => {
    setYear(option.value);     
    //carregarTabelaComissoes();
  };

  const handleMonthChange = (option: any) => {
    setMonth(option.value);  
    //carregarTabelaComissoes();
  };   

  const handleColaboradorChange = (event: any) => {     
    setComissoesTable([])
    setTotalComissao(0)
    setColaborador(event.value);  
    ////console.log("colaborador: " + event.value)    
    //carregarTabelaComissoes();
  };
  
  const carregarTabelaComissoes = () => {

    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);

    const formattedFirstDay = firstDay.toISOString().split('T')[0];
    const formattedLastDay = lastDay.toISOString().split('T')[0];
    setStartDate(formattedFirstDay);
    setEndDate(formattedLastDay);
      http.get<IComissao[]>(`comissao/colaboradorPeriodo?colaborador=${colaborador}&startDate=${formattedFirstDay}&endDate=${formattedLastDay}`, axiosConfig)
      .then(resposta => {
        if(resposta.data.length === 0){
          //console.log("LIMPA TABELA COMISSOES")
          setComissoesTable([])
          setComissoes([])
          setTotalComissao(0)
        }else{
          setComissoes(resposta.data)
          let total = 0;
          //console.log('deu bom')
          resposta.data.map(comissao => {
            total += comissao.valor
          })
          setTotalComissao(total)
        }
      })
      .catch(erro => {
          mostrarMensagem(erro, "error")
      })
  };

    

  return (
    <Container>
          <Titulo icone={<PaymentsOutlined />}>Comissões</Titulo>
          <Grid container spacing={2} >
            <Grid item xs={12} md={3}>
              <Rotulo>Colaborador:</Rotulo>
              {papel === 'ADMIN' &&(
                <SelectCustomizado styles={createCrmSelectStyles()} options={colaboradoresFormatados} onChange={handleColaboradorChange} isSearchable/>
              )}
              {papel === 'COLABORADOR' &&(
                <Campo type="text" placeholder="" readOnly value={colabNome}/>
              )}  
              {papel === 'ATENDIMENTO' &&(
                <Campo type="text" placeholder="" readOnly value={colabNome}/>
              )}  
            </Grid> 
            
            <Grid item xs={6} md={3}>
                <Rotulo>Ano:</Rotulo>
                <SelectCustomizado styles={createCrmSelectStyles()}
                value={{ value: year, label: year }}
                onChange={(option) => handleYearChange(option)}
                options={Array.from({ length: 10 }, (_, i) => ({
                    value: new Date().getFullYear() - i,
                    label: new Date().getFullYear() - i,
                }))}
                />      
            </Grid>
            <Grid item xs={6} md={3}>
                <Rotulo>Mês:</Rotulo>
                <SelectCustomizado styles={createCrmSelectStyles()}
                    value={{ value: month, label: month }}
                    onChange={(option) => handleMonthChange(option)}
                    options={Array.from({ length: 12 }, (_, i) => ({
                    value: i + 1,
                    label: i + 1,
                    }))}
                />
            </Grid>     

             <Grid item xs={12} md={3}>
                  <Rotulo>Comissão Total</Rotulo>
                  <Campo type="text" placeholder="" readOnly value={formataMoeda(totalComissao,'BRL') }/>                                               
              </Grid>      
              
            
          </Grid>
          
          <div style={{ height: '100%', width: '100%'}}>
            <Botao onClick={() =>  handleOpen("cadastra")}><AddOutlined aria-hidden="true" />Nova Comissão</Botao>
            <Botao onClick={() =>  excluir()} style={{backgroundColor: "#c50000", borderColor: "#c50000"}}><DeleteOutline aria-hidden="true" />Excluir</Botao>

            {startDate && endDate && colaborador && open &&(
              
              <React.Fragment>  
                <ModalComissao open={open} handleClose={handleClose} comissoes={comissoes} id={selectedRows} tipo={tipo} startDate={startDate} endDate={endDate} colaborador={colaborador} />
              </React.Fragment>
            )}
            

            <DataGrid style={{ backgroundColor: "#fffdfa",
                              borderBottomColor: "rgba(85, 8, 29, 0.12)",
                              borderTopColor: "rgba(85, 8, 29, 0.12)",
                              color: "#35252b",
                              borderColor:"rgba(85, 8, 29, 0.12)",

                            }}
              rows={newComissoesTable}
              columns={columns}
              initialState={{
                pagination: {
                  paginationModel: { page: 0, pageSize: 50 },
                },
              }}
              pageSizeOptions={[50, 100]}
              checkboxSelection
              disableRowSelectionOnClick
              onRowSelectionModelChange={(ids) => {setSelectedRows(ids)}}
            />
          </div>
              
          <Grid container spacing={2} style={{marginTop: '10px'}}>   
              <Grid item xs={12} md={5}>
                  <Rotulo>Financeiro</Rotulo>
                  <Campo type="text" placeholder="" readOnly value={financeiro}/>                                               
              </Grid> 
              {papel === 'ADMIN' &&(
                <React.Fragment> 
                  <Grid item xs={12} md={2} style={{paddingTop: '25px'}}>
                    <Botao style={{backgroundColor: "green"}} onClick={() =>  geraFinanceiro()}><AccountBalanceWalletOutlined aria-hidden="true" />Gerar Financeiro</Botao>
                  </Grid>
                </React.Fragment>
              )}
              
          </Grid>
    </Container>
  );
}
