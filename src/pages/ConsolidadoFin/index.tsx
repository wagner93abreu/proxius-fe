import styled from "styled-components";
import { Grid } from "@mui/material";
import { useEffect, useState } from "react";
import autenticaStore from "../../stores/autentica.store";
import http from "../../http";
import IResumoFin from "../../types/IResumoFin";
import { formataMoeda } from "../../customFunctions/mascarasFormatacao";
import { mostrarMensagem } from "../../stores/mensagem.store";



const Rotulo = styled.label`
display: block;
font-weight: 700;
font-size: 20px;

color: #35252b;

@media (max-width: 600px) {
    line-height: 1.4;
  }
`

const GridCustomizado = styled(Grid)`
  border: 1px solid rgba(85, 8, 29, 0.12);
  border-radius: 12px;
  width: 100%;
  padding: 1px;
  text-align: center;
  margin-left: 10px!important;
  margin-right: 10px!important;

  @media (max-width: 600px) {
    margin-top: 10px!important;
    margin-bottom: 10px!important;
  }
`
const H2cstm = styled.h2`
  font-size: clamp(22px, 2vw, 30px);
  color: #35252b;

  @media (max-width: 600px) {
    font-size: 25px;
  }
`

export default function ConsolidadoFin() {
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
      style={{
              
              width: "100%",
              padding: "1em",
             
              textAlign: "center",
              display: 'flex', justifyContent: 'center', alignItems: 'center'

      }}>
                
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