import createCrmSelectStyles from "../../styles/crmSelectStyles";
import { ReceiptLongOutlined } from "@mui/icons-material";
import * as React from 'react';
import { DataGrid, GridColDef, GridRowId } from '@mui/x-data-grid';
import { Grid } from '@mui/material';
import autenticaStore from '../../stores/autentica.store';
import http from '../../http';
import { useState } from "react";
import Container from "../../components/Container";
import Titulo from "../../components/Titulo";
import styled from "styled-components";
import Select from 'react-select';
import IPagamentoNF from '../../types/IPagamentoNF';
import { formataMoeda } from '../../customFunctions/mascarasFormatacao';
import { set } from 'mobx';
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

const Rotulo2 = styled.label`
display: block;
font-weight: 700;
font-size: 20px;

color: #35252b;

@media (max-width: 600px) {
    line-height: 1.4;
  }
`

const GridCustomizado = styled(Grid)`
  text-align: center;
`
const H2cstm = styled.h2`
  border: 1px solid rgba(85, 8, 29, 0.12);
  border-radius: 10px;
  font-size: 30px;
  margin-top: 2px;
  padding-top: 10px;
  padding-bottom: 10px;
  color: #35252b;
  background-color: #fffdfa;
  box-shadow: 0 4px 20px rgba(85, 8, 29, 0.04);

  @media (max-width: 600px) {
    font-size: 25px;
  }
`

export default function PainelNF(){
  const columns: GridColDef[] = [
  { field: 'pagamentoId', headerName: 'Pagamento', width: 100 },
  { field: 'vendaId', headerName: 'Venda', width: 80 },
  { field: 'produto', headerName: 'Produto', width: 300 },
  { field: 'meiopagamento', headerName: 'Meio de Pagamento', width: 150 },
  { field: 'tipopagamento', headerName: 'Tipo de Pagamento', width: 200 },
  { field: 'moeda', headerName: 'Moeda', width: 100 },
  { field: 'valorcomprador', headerName: 'Valor Comprador', width: 160 },
  { field: 'parcelas', headerName: 'Parcelas', width: 80 },
  { field: 'valorbase', headerName: 'Valor Base', width: 150 },
  { field: 'taxas', headerName: 'Taxas', width: 150 },
  { field: 'comissao', headerName: 'Comissão', width: 150 },
  { field: 'datapagamento', headerName: 'Data de Pagamento', width: 150 },
  { field: 'nome', headerName: 'Nome', width: 300 },
  { field: 'datavenda', headerName: 'Data da Venda', width: 150 },
  { field: 'documentocliente', headerName: 'Documento do Cliente', width: 200 },
  { field: 'cpfcnpj', headerName: 'CPF', width: 150 },
  { field: 'email', headerName: 'Email', width: 350 },
  { field: 'telefone', headerName: 'Telefone', width: 150 },
  { field: 'pais', headerName: 'País', width: 150 },
  { field: 'cep', headerName: 'CEP', width: 150 },
  { field: 'uf', headerName: 'UF', width: 100 },
  { field: 'cidade', headerName: 'Cidade', width: 200 },
  { field: 'bairro', headerName: 'Bairro', width: 200 },
  { field: 'logradouro', headerName: 'Logradouro', width: 400 },
  { field: 'complemento', headerName: 'Complemento', width: 150 },
  { field: 'numero', headerName: 'Número', width: 100 },
  { field: 'cupom', headerName: 'Cupom', width: 150 },
  { field: 'statusvenda', headerName: 'Status da Venda', width: 150 }
  
  ];
  
  const [selectedRows, setSelectedRows] = useState<GridRowId[]>([]);
  const {usuario} = autenticaStore;
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [pagamentos, setPagamentos] = useState<IPagamentoNF[]>([])
  const [totalComprador, setTotalComprador] = useState("");
  const [totalBase, setTotalBase] = useState("");
  const [totalTaxas, setTotalTaxas] = useState("");
  const [totalComissao, setTotalComissao] = useState("");
  
  const axiosConfig = {
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${usuario.token}`,
    },
  };

  React.useEffect(() => {
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);

    const formattedFirstDay = firstDay.toISOString().split('T')[0];
    const formattedLastDay = lastDay.toISOString().split('T')[0];

    http.get<IPagamentoNF[]>(`venda/filtrarPorData?startDate=${formattedFirstDay}&endDate=${formattedLastDay}`, axiosConfig)
      .then(resposta => {
        const dadosAgrupados = agruparPagamentos(resposta.data);
        setPagamentos(dadosAgrupados);
      })
      .catch(erro => {
        mostrarMensagem(erro, "error");
      });    
    
  }, [year, month]);

  const agruparPagamentos = (pagamentos: IPagamentoNF[]) => {
    //console.log("ENTROU AGRUPAR PAGAMENTOS")
    const agrupados: { [key: string]: IPagamentoNF } = {};
    let ttlComprador = 0;
    let ttlBase = 0;
    let ttlTaxas = 0;
    let ttlComissao = 0;
    pagamentos.forEach(pagamento => {
      ttlComprador += pagamento.valorcomprador;
      ttlBase += pagamento.valorbase;
      ttlTaxas += pagamento.taxas;
      ttlComissao += pagamento.comissao;
      const key = `${pagamento.vendaId}-${pagamento.meiopagamento}-${pagamento.tipopagamento}`;
      if (!agrupados[key]) {
        agrupados[key] = { ...pagamento };
      } else {
        if(agrupados[key].meiopagamento != "STONE"){
          agrupados[key].parcelas += pagamento.parcelas;
        }        
        agrupados[key].valorcomprador += pagamento.valorcomprador;
        agrupados[key].valorbase += pagamento.valorbase;
        agrupados[key].taxas += pagamento.taxas;
        agrupados[key].comissao += pagamento.comissao;

        
      }
    });
    setTotalComprador(formataMoeda(ttlComprador));
    setTotalBase(formataMoeda(ttlBase));
    setTotalTaxas(formataMoeda(ttlTaxas));
    setTotalComissao(formataMoeda(ttlComissao));


    return Object.values(agrupados).map(dado => ({
      ...dado,
      id: dado.pagamentoId,
      nome: `${dado.nomecomercial} ${dado.nomesocial}`, // Concatena nomecomercial e nomesocial
      valorcomprador: formataMoeda(dado.valorcomprador), // Formata valorcomprador
      valorbase: formataMoeda(dado.valorbase), // Formata valorbase
      taxas: formataMoeda(dado.taxas), // Formata taxas
      comissao: formataMoeda(dado.comissao), // Formata comissao
      datapagamento: new Date(dado.datapagamento).toLocaleDateString('pt-BR'),
      datavenda: new Date(dado.datavenda).toLocaleDateString('pt-BR')
    }));
  };

  function formataMoeda(valor: number): string {
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  }


  const handleYearChange = (option: any) => {
    setYear(option.value);     

  };

  const handleMonthChange = (option: any) => {
    setMonth(option.value);  

  };   
  
   

  return (
    <Container>
      
          <Grid container style={{ marginBottom: "10px"
          }}>
          <Titulo icone={<ReceiptLongOutlined />}>Painel de NF</Titulo>
            <Grid container spacing={1} >
          
              <Grid item xs={6} md={2}>
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
              <Grid item xs={6} md={2}>
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
              <GridCustomizado item xs={6} md={2}>              
                <H2cstm>
                <Rotulo2>Total Comprador</Rotulo2>
                  {totalComprador}
                </H2cstm>
              </GridCustomizado>
              <GridCustomizado item xs={6} md={2}>
                <H2cstm>
                <Rotulo2>Total Base</Rotulo2>
                  {totalBase}
                </H2cstm>
              </GridCustomizado>
              <GridCustomizado item xs={6} md={2}>
                <H2cstm>
                <Rotulo2>Total Taxas</Rotulo2>
                  {totalTaxas}
                </H2cstm>
              </GridCustomizado>
              <GridCustomizado item xs={6} md={2}>
                <H2cstm>
                <Rotulo2>Total Comissao</Rotulo2>
                  {totalComissao}
                </H2cstm>
              </GridCustomizado> 
            </Grid> 
          </Grid>

          
                      
              

            
          
          
          
          <div style={{ height: '100%', width: '100%'}}>
         

            <DataGrid style={{ backgroundColor: "#fffdfa",
                              borderBottomColor: "rgba(85, 8, 29, 0.12)",
                              borderTopColor: "rgba(85, 8, 29, 0.12)",
                              color: "#35252b",
                              borderColor:"rgba(85, 8, 29, 0.12)",

                            }}
              rows={pagamentos}
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
              
          
    </Container>
  );
}
