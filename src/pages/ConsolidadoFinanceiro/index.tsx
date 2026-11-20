import styled from "styled-components";
import { Grid } from "@mui/material";
import { useEffect, useState } from "react";
import autenticaStore from "../../stores/autentica.store";
import http from "../../http";
import IResumoFin from "../../types/IResumoFin";
import { formataMoeda } from "../../customFunctions/mascarasFormatacao";
import { mostrarMensagem } from "../../stores/mensagem.store";


const Titulo = styled.h2`
  font-weight: 700;
  font-size: 24px;
  line-height: 28px;
  color: #55081d
`;

const Rotulo = styled.label`
display: block;
font-weight: 700;
font-size: 20px;
line-height: 19px;
color: #35252b;
margin-top: 17px;
@media (max-width: 600px) {
    line-height: 1.4;
  }
`

const GridCustomizado = styled(Grid)`
  border: 1px solid rgba(85, 8, 29, 0.12);
  border-radius: 12px;
  width: 100%;
  padding: 10px;
  text-align: center;
  margin: 10px!important;
`
const H2cstm = styled.h2`
  font-size: clamp(24px, 2.5vw, 36px);
  color: #35252b;

  @media (max-width: 600px) {
    font-size: 30px;
  }
`

export default function ConsolidadoFinanceiro() {
  const {usuario} = autenticaStore;
  const [consolidadoFin, setConsolidadoFin] = useState<IResumoFin | null>(null)
  const [total, setTotal] = useState("")
  const axiosConfig = {
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${usuario.token}`,
    },
  };

  const consolidado = async () => {
    try {
        const resposta = await http.get<IResumoFin>(`financeiro/resumo-financeiro`, axiosConfig);
        //console.log(JSON.stringify(resposta.data))
        setConsolidadoFin(resposta.data)
        setTotal(formataMoeda(resposta.data.totalEntradas - resposta.data.totalSaidas, 'BRL'))
    } catch (erro) {
        mostrarMensagem("CLIFOR ERRO: " + erro, "error");
    }
  }

  
  

  useEffect(() => {
    consolidado()
  }, []); 

  

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
        <Grid item xs={12}><Titulo>CONSOLIDADO FINANCEIRO</Titulo></Grid>
        
        <GridCustomizado item xs={12} md={3} style={{backgroundColor: '#e7f3e8'}}>
        <Rotulo>Total Entradas</Rotulo>
          <H2cstm>{formataMoeda(consolidadoFin?.totalEntradas, 'BRL')}</H2cstm>
        </GridCustomizado>

        <GridCustomizado item xs={12} md={3} style={{backgroundColor: '#fce9e7'}}>
        <Rotulo>Total Saídas</Rotulo>
          <H2cstm>{formataMoeda(consolidadoFin?.totalSaidas, 'BRL')}</H2cstm>
        </GridCustomizado>

        <GridCustomizado item xs={12} md={3} style={{backgroundColor: '#e6eff8'}}>
        <Rotulo>Total</Rotulo>
          <H2cstm>{total}</H2cstm>
        </GridCustomizado>


    </Grid>
  )
}