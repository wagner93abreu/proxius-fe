import createCrmSelectStyles from "../../styles/crmSelectStyles";
import styled from "styled-components";
import { Grid } from "@mui/material";
import { useEffect, useState } from "react";
import autenticaStore from "../../stores/autentica.store";
import http from "../../http";
import IResumoFin from "../../types/IResumoFin";
import { formataMoeda } from "../../customFunctions/mascarasFormatacao";
import IVenda from "../../types/IVenda";
import IMeta from "../../types/IMeta";
import Select from 'react-select';

const Titulo = styled.h2`
  font-weight: 700;
  font-size: 24px;
  line-height: 28px;
  color: #55081d;

  @media (max-width: 600px) {
    font-size: 20px;
    line-height: 1.4;
  }
`;

const Rotulo = styled.label`
display: block;
font-weight: 700;
font-size: 20px;
line-height: 19px;
color: #35252b;
margin-top: 17px;

@media (max-width: 600px) {
    font-size: 20px;
    line-height: 1.4;
  }
`

const GridCustomizado = styled(Grid)`
  border: 1px solid rgba(85, 8, 29, 0.12);
  border-radius: 12px;
  width: 90%;
  padding: 2px;
  text-align: center;
  margin: 10px!important;
`
const H2cstm = styled.h2`
  font-size: 30px;
  color: #35252b;

  @media (max-width: 600px) {
    font-size: 20px;
  }
`
const SelectCustomizado = styled(Select)`
font-weight: 700;
  font-size: 18px;
  background: #FFF;
  margin-top: 3px;
  margin-bottom: 25px;
  box-sizing: border-box;
  box-shadow: none;
  border-radius: 12px;
  border: none;
  color: black;
  display: inline-block;
  width: auto;
  margin-left: 5px;
`;

export default function ConsolidadoFinanceiro() {
    const {usuario} = autenticaStore;

    const [totais, setTotais] = useState({ valorcomprador: 0, valorbase: 0, comissao: 0 });
    const [totaisMesAtual, setTotaisMesAtual] = useState({ valorcomprador: 0, valorbase: 0, comissao: 0 });
    const [meta, setMeta] = useState<IMeta | null>(null);
    const [year, setYear] = useState(new Date().getFullYear());
    const [month, setMonth] = useState(new Date().getMonth() + 1);


    const axiosConfig = {
      headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${usuario.token}`,
      },
    };

    const consolidado = async () => {
      const dataInicial = new Date(year, month - 1, 1).toISOString().split('T')[0];
      const dataFinal = new Date(year, month, 0).toISOString().split('T')[0];
  
      try {
        const resposta = await http.get<IVenda[]>(`venda/filterByDate?dateAttribute=datavenda&startDate=${dataInicial}&endDate=${dataFinal}`, axiosConfig);
        const totais = somarValoresTotais(resposta.data);
        const totaisMesAtual = somarValoresMesAtual(resposta.data, dataInicial, dataFinal);
        setTotais(totais);
        setTotaisMesAtual(totaisMesAtual);
        //console.log('totaisMesAtual');
        //console.log(totaisMesAtual);
      } catch (erro) {
        //alert("VENDA ERRO: " + erro);
      }
  
      try {
        const resposta = await http.get<IMeta[]>(`meta/filter?attribute=data&value=${dataInicial}`, axiosConfig);
        setMeta(resposta.data[0]);
      } catch (erro) {
        //alert("META ERRO: " + erro);
      }
    };
  
    useEffect(() => {
      consolidado();
    }, [year, month]);

    const somarValoresTotais = (vendas: IVenda[]) => {
      return vendas.reduce((acumulador:any, venda: any) => {
        venda.pagamento.forEach((pagamento: any) => {
          acumulador.valorcomprador += pagamento.valorcomprador;
          acumulador.valorbase += pagamento.valorbase;
          acumulador.comissao += pagamento.comissao;
        });
        return acumulador;
      }, { valorcomprador: 0, valorbase: 0, comissao: 0 });
    };

    const somarValoresMesAtual = (vendas: IVenda[], dataInicial: string, dataFinal: string) => {
      const dataInicialDate = new Date(dataInicial);
      const dataFinalDate = new Date(dataFinal);
    
      return vendas.reduce((acumulador, venda) => {
        venda.pagamento.forEach(pagamento => {
          const dataPagamento = new Date(pagamento.datapagamento);
    
          if (dataPagamento >= dataInicialDate && dataPagamento <= dataFinalDate) {
            acumulador.valorcomprador += pagamento.valorcomprador;
            acumulador.valorbase += pagamento.valorbase;
            acumulador.comissao += pagamento.comissao;
          }
        });
        return acumulador;
      }, { valorcomprador: 0, valorbase: 0, comissao: 0 });
    };

    const handleYearChange = (option: any) => {
      setYear(option.value);     
  
    };
  
    const handleMonthChange = (option: any) => {
      setMonth(option.value);  
  
    };

    const monthOptions = [
      { value: 1, label: 'Janeiro' },
      { value: 2, label: 'Fevereiro' },
      { value: 3, label: 'Março' },
      { value: 4, label: 'Abril' },
      { value: 5, label: 'Maio' },
      { value: 6, label: 'Junho' },
      { value: 7, label: 'Julho' },
      { value: 8, label: 'Agosto' },
      { value: 9, label: 'Setembro' },
      { value: 10, label: 'Outubro' },
      { value: 11, label: 'Novembro' },
      { value: 12, label: 'Dezembro' }
    ];

    return (
        <Grid container spacing={1} 
        style={{border: "1px solid rgba(85, 8, 29, 0.12)",
                borderRadius: "20px",
                backgroundColor: "#fffdfa",
                boxShadow: "0 4px 20px rgba(85, 8, 29, 0.04)",
                width: "100%",
                padding: "1em",
                marginBottom: "2em",
                textAlign: "center",
                display: 'flex', justifyContent: 'center', alignItems: 'center'

        }}>
          <Grid item xs={12}>
          <Titulo>
            VENDAS</Titulo>
            <SelectCustomizado styles={createCrmSelectStyles()}
              value={{ value: year, label: year }}
              onChange={(option) => handleYearChange(option)}
              options={Array.from({ length: 10 }, (_, i) => ({
                value: new Date().getFullYear() - i,
                label: new Date().getFullYear() - i,
              }))}
            />
            <SelectCustomizado styles={createCrmSelectStyles()}
              value={monthOptions.find(option => option.value === month)}
              onChange={(option) => handleMonthChange(option)}
              options={monthOptions}
            />
          
        </Grid>
              
            
          

          <GridCustomizado item xs={12} md={3} style={{backgroundColor: '#fce9e7'}}>
          <Rotulo>Meta Minima (80%)</Rotulo>
            <H2cstm>{formataMoeda(meta?.valorMinimo,"REAL")}</H2cstm>
          </GridCustomizado>

          <GridCustomizado item xs={12} md={3} style={{backgroundColor: '#fff3d6'}}>
          <Rotulo>Meta Média (100%)</Rotulo>
            <H2cstm>{formataMoeda(meta?.valorPadrao,"REAL")}</H2cstm>
          </GridCustomizado>

          <GridCustomizado item xs={12} md={3} style={{backgroundColor: '#e6eff8'}}>
          <Rotulo>Meta Máxima (120%)</Rotulo>
            <H2cstm>{formataMoeda(meta?.valorMaximo,"REAL")}</H2cstm>
          </GridCustomizado>

          <GridCustomizado item xs={12} md={3} style={{backgroundColor: '#f7f1e9'}}>
          <Rotulo>Valor Comprador</Rotulo>
            <H2cstm>{formataMoeda(totais.valorcomprador,"REAL")}</H2cstm>
          </GridCustomizado>

          <GridCustomizado item xs={12} md={3} style={{backgroundColor: '#f7f1e9'}}>
          <Rotulo>Valor Produto</Rotulo>
            <H2cstm>{formataMoeda(totais.valorbase,"REAL")}</H2cstm>
          </GridCustomizado>          

          <GridCustomizado item xs={12} md={3} style={{backgroundColor: '#f7f1e9'}}>
          <Rotulo>Comissão</Rotulo>
            <H2cstm>{formataMoeda(totais.comissao,"REAL")}</H2cstm>
          </GridCustomizado>

              
          <GridCustomizado item xs={12} md={3} >
          <Rotulo>Mês atual Comprador</Rotulo>
            <H2cstm>{formataMoeda(totaisMesAtual.valorcomprador,"REAL")}</H2cstm>
          </GridCustomizado>

          <GridCustomizado item xs={12} md={3} >
          <Rotulo>Mês atual valor Produto</Rotulo>
            <H2cstm>{formataMoeda(totaisMesAtual.valorbase,"REAL")}</H2cstm>
          </GridCustomizado>

          <GridCustomizado item xs={12} md={3} >
          <Rotulo>Mês atual Comissão</Rotulo>
            <H2cstm>{formataMoeda(totaisMesAtual.comissao,"REAL")}</H2cstm>
          </GridCustomizado>




      </Grid>
    )
}