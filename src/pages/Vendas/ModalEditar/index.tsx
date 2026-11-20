import { managementDialogStyles } from "../../../styles/managementStyles";
import React, { useState } from "react";
import { Grid, Modal } from '@mui/material';
import { Box } from "@mui/material";
import Titulo from "../../../components/Titulo";
import styled from "styled-components";
import CampoLeitura from "../../../components/CampoLeitura";
import autenticaStore from "../../../stores/autentica.store";
import http from "../../../http";
import { GridRowId } from "@mui/x-data-grid";
import IClifor from "../../../types/IClifor";
import IVenda from "../../../types/IVenda";
import IPagamento from "../../../types/IPagamento";
import IItem from "../../../types/IItem";
import { formataMoeda, transformDateBR } from "../../../customFunctions/mascarasFormatacao";
import { mostrarMensagem } from "../../../stores/mensagem.store";

const BoxCustomizado = styled(Box)`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 85vw; 
  max-height: 90vh;
  overflow-y: auto;
  background-color: #fffdfa;
  border: none;
  border-radius: 12px;
  padding: 1em 5em;
    ${managementDialogStyles}
`;

export default function ModalEdita({ editaOpen, editaHandleClose, editaVenda, id }: { editaOpen: boolean, editaHandleClose: () => void, editaVenda: IVenda[], id: GridRowId[] | string }) {
    const [idVenda, setIdVenda] = useState("");
    const [statusvenda, setStatusVenda] = useState("");
    const [datavenda, setDatavenda] = useState("");
    const [cliente, setCliente] = useState("");
    const [totalComprador, setTotalComprador] = useState(0);
    const [totalBase, setTotalBase] = useState(0);
    const [totalTaxas, setTotalTaxas] = useState(0);
    const [totalComissao, setTotalComissao] = useState(0);    
    const [meiopagamento, setMeiopagamento] = useState<IPagamento[]>([]);
    const [itens, setItens] = useState<IItem[]>([]);
    const {usuario} = autenticaStore;

    const axiosConfig = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${usuario.token}`,
        },
    };

    const capturaVenda = async () => {
        let idFinal = typeof id === 'number' ? id : id[0];

        const vendaEdita = editaVenda.find(item => item.id === idFinal);

        setIdVenda(vendaEdita?.id ? vendaEdita.id.toString() : "")
        setStatusVenda(vendaEdita?.statusvenda ? vendaEdita.statusvenda : "")
        setDatavenda(vendaEdita?.datavenda ? vendaEdita.datavenda : "")
        if(vendaEdita?.documentocliente){
            try {
                let nomeCliente = "";                
                const resposta = await http.get<IClifor[]>(`clifor/filter?attribute=cpfcnpj&value=${vendaEdita.documentocliente}`, axiosConfig);
                if(resposta.data.length > 0){
                    nomeCliente = vendaEdita.documentocliente + " - " + resposta.data[0].nomecomercial + " " + resposta.data[0].nomesocial;
                }else{
                    nomeCliente = vendaEdita.documentocliente + " - Cliente não encontrado";
                }
                
                setCliente(nomeCliente)

            } catch (erro) {
                mostrarMensagem("CLIFOR ERRO: " + erro, "error");
            }
        }
        setMeiopagamento(vendaEdita?.pagamento ? vendaEdita.pagamento : [])
        if(vendaEdita?.itens && vendaEdita.itens.length > 0){
            setItens(vendaEdita.itens)
        }else if(vendaEdita?.idproduto){
            setItens([{
                idproduct: vendaEdita.idproduto,
                product: vendaEdita.produto,
                pricing: 0,
                quantity: 1,
                itemOrder: 1,
                unitPrice: 0,
                discountType: "VALUE",
                discountValue: 0,
                finalPrice: 0
            }])
        }else{
            setItens([])
        }
    }

    function calculaTotais(){
        let totalComprador = 0;
        let totalBase = 0;
        let totalTaxas = 0;
        let totalComissao = 0;
        for (let i = 0; i < meiopagamento.length; i++) {
            totalBase += meiopagamento[i].valorbase;
            totalComprador += meiopagamento[i].valorcomprador;
            totalTaxas += meiopagamento[i].taxas;
            totalComissao += meiopagamento[i].comissao;
        }
        setTotalComprador(totalComprador)
        setTotalBase(totalBase)
        setTotalTaxas(totalTaxas)
        setTotalComissao(totalComissao)
    }

    React.useEffect(() => {
        //console.log("MODAL VENDA EDITA")
        capturaVenda();
        calculaTotais();
    }, [editaOpen, editaVenda, id]); 

    return (
        <>
            {<Modal
                open={editaOpen}
                onClose={editaHandleClose}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
            >
                <BoxCustomizado>
                    <form>
                        <Titulo>Dados Venda:</Titulo>
                        <Grid container spacing={2}>
                            <Grid item xs={2} md={1}>
                            <CampoLeitura tipo="text" label="ID" valor={idVenda} />
                            </Grid>                            
                            <Grid item xs={12} md={2}>
                            <CampoLeitura tipo="text" label="Status Venda" valor={statusvenda} />
                            </Grid>                        
                            <Grid item xs={12} md={6}>
                            <CampoLeitura  tipo="text" label="Cliente" valor={cliente}/>
                            </Grid>
                            <Grid item xs={12} md={3}>
                            <CampoLeitura  tipo="text" label="Data da Venda" valor={transformDateBR(datavenda)}/>
                            </Grid>
                            <Grid container spacing={1} 
                            style={{border: "1px solid rgba(85, 8, 29, 0.12)",
                                    borderRadius: "5px",
                                    marginTop: "1em",
                                    marginBottom: "2em",
                                    paddingRight: "1em",
                                    paddingLeft: "1em",
                                    marginLeft: "1em",
                            }}>
                                <Grid item xs={12}>
                                    <h2 style={{textAlign: "center", color: "#35252b"}}>Itens</h2>
                                </Grid>
                                {itens.map((item: IItem, index: number) => (
                                    <React.Fragment key={index}>
                                        <Grid container spacing={1}>
                                            <Grid item xs={12} md={4}>
                                                <CampoLeitura tipo="text" label={`Produto`} valor={item.product} />
                                            </Grid>
                                            <Grid item xs={6} md={2}>
                                                <CampoLeitura tipo="text" label={`Quantidade`} valor={item.quantity} />
                                            </Grid>
                                            <Grid item xs={6} md={2}>
                                                <CampoLeitura tipo="text" label={`Preço Unitário`} valor={formataMoeda(item.unitPrice, meiopagamento[0]?.moeda)} />
                                            </Grid>
                                            <Grid item xs={6} md={2}>
                                                <CampoLeitura tipo="text" label={`Desconto`} valor={item.discountType === 'PERCENTAGE' ? `${item.discountValue}%` : formataMoeda(item.discountValue, meiopagamento[0]?.moeda)} />
                                            </Grid>
                                            <Grid item xs={6} md={2}>
                                                <CampoLeitura tipo="text" label={`Preço Final`} valor={formataMoeda(item.finalPrice, meiopagamento[0]?.moeda)} />
                                            </Grid>
                                        </Grid>
                                    </React.Fragment>
                                ))}
                            </Grid>
                            <Grid container spacing={1} 
                            style={{border: "1px solid rgba(85, 8, 29, 0.12)",
                                    borderRadius: "5px",
                                    marginTop: "1em",
                                    marginBottom: "2em",
                                    paddingRight: "1em",
                                    paddingLeft: "1em",
                                    marginLeft: "1em",
                            }}>
                                <Grid item xs={12}>
                                    <h2 style={{textAlign: "center", color: "#35252b"}}>Pagamento</h2>
                                </Grid>
                                {meiopagamento.map((item: any, index: any) => (
                                    <React.Fragment key={index}>
                                        <Grid container spacing={1}>                                     
                                            <Grid item xs={6} md={1}>
                                                <CampoLeitura tipo="text" label={`Meio`} valor={item.meiopagamento} />
                                            </Grid>
                                            <Grid item xs={6} md={2}>
                                                <CampoLeitura tipo="text" label={`Tipo`} valor={item.tipopagamento} />
                                            </Grid>
                                            <Grid item xs={3} md={1}>
                                                <CampoLeitura tipo="text" label={`Parcelas`} valor={item.parcelas} />
                                            </Grid>
                                            <Grid item xs={6} md={2}>
                                                <CampoLeitura tipo="text" label={`Valor Comprador`} valor={formataMoeda(item.valorcomprador, item.moeda)} />  
                                            </Grid>
                                            <Grid item xs={6} md={2}>
                                                <CampoLeitura tipo="text" label={`Valor Base`} valor={formataMoeda(item.valorbase, item.moeda)} />    
                                            </Grid>
                                            <Grid item xs={6} md={1}>
                                                <CampoLeitura tipo="text" label={`Taxas`} valor={formataMoeda(item.taxas, item.moeda)} /> 
                                            </Grid>
                                            <Grid item xs={6} md={2}>
                                                <CampoLeitura tipo="text" label={`Comissão`} valor={formataMoeda(item.comissao, item.moeda)} />   
                                            </Grid>
                                            <Grid item xs={6} md={1}>
                                                <CampoLeitura tipo="text" label={`Data Pagamento`} valor={transformDateBR(item.datapagamento)} />
                                            </Grid>
                                        </Grid>
                                    </React.Fragment>                                        
                                ))}
                            </Grid> 
                            {meiopagamento.length > 1 && (
                                <Grid item xs={12} md={12} >
                                    <Grid container spacing={2}>
                                        <Grid item xs={3}>
                                            <CampoLeitura tipo="text" label={`Total Comprador`} valor={formataMoeda(totalComprador, meiopagamento[0].moeda)} />
                                        </Grid>
                                        <Grid item xs={3}>
                                            <CampoLeitura tipo="text" label={`Total Base`} valor={formataMoeda(totalBase, meiopagamento[0].moeda)} />
                                        </Grid>
                                        <Grid item xs={3}>
                                            <CampoLeitura tipo="text" label={`Total Taxas`} valor={formataMoeda(totalTaxas, meiopagamento[0].moeda)} />
                                        </Grid>
                                        <Grid item xs={3}>
                                            <CampoLeitura tipo="text" label={`Total Comissão`} valor={formataMoeda(totalComissao, meiopagamento[0].moeda)} />
                                        </Grid>
                                    </Grid>
                                </Grid> 
                            )}
                               
                        </Grid>                        
                    </form>
                </BoxCustomizado>
            </Modal >}
        </>
    );
}