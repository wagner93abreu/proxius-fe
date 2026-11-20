import { managementDialogStyles, managementFieldStyles } from "../../../styles/managementStyles";
import createCrmSelectStyles from "../../../styles/crmSelectStyles";
import React, { useState,useEffect } from "react";
import { Grid, Modal, Box } from '@mui/material';
import Titulo from "../../../components/Titulo";
import styled from "styled-components";
import Botao from "../../../components/Botao";
import autenticaStore from "../../../stores/autentica.store";
import { Controller, useForm } from "react-hook-form";
import http from "../../../http";
import { GridRowId } from "@mui/x-data-grid";
import { formataMoeda, transformDateBR } from "../../../customFunctions/mascarasFormatacao";
import IComissao from "../../../types/IComissao";
import Select from 'react-select';
import IVenda from "../../../types/IVenda";
import IClifor from "../../../types/IClifor";
import ITaxa from "../../../types/ITaxa";
import CampoLeitura from "../../../components/CampoLeitura";
import IPagamento from "../../../types/IPagamento";
import DatePickerValue from "../../../components/Calendario";
import { set } from "mobx";
import { mostrarMensagem } from "../../../stores/mensagem.store";


const BoxCustomizado = styled(Box)`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90vw;
  max-height: 90vh;
  min-height: 40vh;
  overflow-y: auto;
  background-color: #fffdfa;
  border: none;
  border-radius: 12px;
  padding: 1em 5em;
    ${managementDialogStyles}
`;

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
const Container = styled.div`
text-align: left;
`
const BotaoCustomizado = styled(Botao)`
    width: 50%;
    display: block;
    margin: 0 auto;
`

const Rotulo = styled.label`
    display: block;
    font-weight: 700;
    font-size: 16px;
    line-height: 19px;
    color: #35252b
`

const SelectCustomizado = styled(Select)`
    background: #F0F0F0;
    margin-top: 3px;
    margin-bottom: 25px;
    box-sizing: border-box;
    box-shadow: none;
    border-radius: 12px;
    border: none;
`

const SpanErro = styled.span`
    float: left;
    color: #b3261e;
    font-size: 14px;
    margin-top: -25px;
`

export default function ModalComissao({ open, handleClose, comissoes, id, tipo, startDate, endDate, colaborador }: { open: boolean, handleClose: () => void, comissoes: IComissao[], id: GridRowId[], tipo: string, startDate: string, endDate: string, colaborador: string}) {
    //const [idComissao, setIdComissao] = useState("");
    const {handleSubmit, reset, formState:{errors}, control} = useForm();
    const [output, setOutput] = useState("");
    const {usuario} = autenticaStore;
    const [vendas, setVendas] = useState<IVenda[]>([]);
    const [vendasFormatadas, setVendasFormatadas] = useState<{ value: string, label: string }[]>([]);

    const[venda, setVenda] = useState({value: 'SV',
        label: `SEM VENDA`});
    const [idVenda, setIdVenda] = useState("");
    const [statusvenda, setStatusVenda] = useState("");
    const [produto, setProduto] = useState("");
    const [datavenda, setDatavenda] = useState("");
    const [cliente, setCliente] = useState("");

    const [totalComprador, setTotalComprador] = useState(0);
    const [totalBase, setTotalBase] = useState(0);
    const [totalTaxas, setTotalTaxas] = useState(0);
    const [totalLiquido, setTotalLiquido] = useState(0);
    const [totalComissao, setTotalComissao] = useState(0);   
    
    const [dataComissao, setDataComissao] = useState<string>(new Date().toISOString().split('T')[0]);
    const [dataInicial, setDataInicial] = useState("");
    const [dataFinal, setDataFinal] = useState("");
    const [cpfCnpj,setCpfCnpj] = useState("");
    const [meiopagamento, setMeiopagamento] = useState<IPagamento[]>([]);
    const [taxas, setTaxas] = useState<ITaxa[]>([]);    
    const [idTaxa, setIdTaxa] = useState("");
    const [taxaValor, setTaxaValor] = useState(""); 
    const [taxaPorcentagem, setTaxaPorcentagem] = useState(false);
    const [allVendas, setAllVendas] = useState(false);

    const axiosConfig = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${usuario.token}`,
        },
    };

    useEffect(() => {
        setDataInicial(startDate)
        setDataFinal(endDate)
        setCpfCnpj(colaborador)
        if(open === true && dataInicial !== "" && dataFinal !== "") {
            if(allVendas){
                let novaDataInicial = subtrairMeses(dataInicial)
                
                http.get<IVenda[]>(`venda/filterByDate?dateAttribute=datavenda&startDate=${novaDataInicial}&endDate=${dataFinal}`, axiosConfig)
                .then(resposta => {
                    setVendas(resposta.data)
                    formataVendas(resposta.data)
                })
                .catch(erro => {
                    mostrarMensagem(erro, "error")
                })
            }else{
                http.get<IVenda[]>(`venda/filterByDate?dateAttribute=datavenda&startDate=${dataInicial}&endDate=${dataFinal}`, axiosConfig)
                .then(resposta => {
                    setVendas(resposta.data)
                    formataVendas(resposta.data)
                })
                .catch(erro => {
                    mostrarMensagem(erro, "error")
                })  
            }
        }
    }, [open,dataInicial,dataFinal,allVendas]);

    useEffect(() => {
        //console.log("TAXAS")
        if(open === true && cpfCnpj !== "") {
            //console.log('tem cpfCnpj')
            http.get<ITaxa[]>(`taxa/filter?attribute=fornecedor&value=${cpfCnpj}`, axiosConfig)
            .then(resposta => {
                //console.log('retornou')
                setTaxas(resposta.data)
            })
            .catch(erro => {
                mostrarMensagem(erro, "error")
            })  
        }
    }, [open,cpfCnpj]);

    function subtrairMeses(data: string): string {
        // Cria um objeto Date a partir da string fornecida
        const dataObj = new Date(data);
      
        // Subtrai doze meses
        dataObj.setMonth(dataObj.getMonth() - 12);
      
        // Formata a data de volta para o formato YYYY-MM-DD
        const ano = dataObj.getFullYear();
        const mes = String(dataObj.getMonth() + 1).padStart(2, '0'); // Adiciona 1 porque os meses são baseados em zero
        const dia = String(dataObj.getDate()).padStart(2, '0');
      
        return `${ano}-${mes}-${dia}`;
      }

    const taxasFormatadas = taxas.map(taxa => ({
        value: taxa.id,
        label: taxa.bandeira + " - " + (taxa.porcentagem ? `${taxa.valortaxa}%` : formataMoeda(taxa.valortaxa, 'BRL'))
    }));
    
    const formataVendas = (data: IVenda[]) => {
        let vendasFormatadasArray: any = [];
        vendasFormatadasArray.push({
          value: 'SV',
          label: `SEM VENDA`
        });
    
        const promises = data.map((venda, i) => {
          return http.get<IClifor[]>(`clifor/filter?attribute=cpfcnpj&value=${venda.documentocliente}`, axiosConfig)
            .then(resposta => {
              const nomeCliente = resposta.data[0].nomecomercial + " " + resposta.data[0].nomesocial;
              vendasFormatadasArray.push({
                value: venda.id,
                label: `${venda.id} - ${venda.produto} - ${nomeCliente}`
              });
            })
            .catch(erro => {
              mostrarMensagem("CLIFOR ERRO: " + erro, "error");
              vendasFormatadasArray.push({
                value: venda.id,
                label: `${venda.produto} - Cliente não encontrado`
              });
            });
        });
    
        Promise.all(promises).then(() => {
          // Ordena o array pelo id do menor para o maior
          vendasFormatadasArray.sort((a: any, b: any) => a.value - b.value);
          setVendasFormatadas(vendasFormatadasArray);
        });
      };

    function createComissao(data: any){
        const comissoes : IComissao[] = [];

        let taxaSelecionada = taxas.find(taxa => taxa.id === idTaxa)
        if(!taxaSelecionada){
            return;
        }

        if(!taxaSelecionada.porcentagem){

            comissoes.push({
                id: null,
                colaborador: colaborador,
                venda: venda.value == 'SV' ? 0 : parseInt(venda.value),
                valor: taxaSelecionada.valortaxa,
                tipo: data.tipocomissao.label.split(" - ")[0] ,
                data: dataComissao  
            });
        }else{
            if(venda.value == 'SV' || !venda.value){
                return;
            }
            for (let i = 0; i < meiopagamento.length; i++) {                
                comissoes.push({
                    id: null,
                    colaborador: colaborador,
                    venda: venda.value == 'SV' ? 0 : parseInt(venda.value),
                    valor: comissaoValor(meiopagamento[i].comissao),
                    tipo: data.tipocomissao.label.split(" - ")[0] ,
                    data:  meiopagamento[i].datapagamento 
                });
            }
        }    
        
        //setOutput(JSON.stringify(comissoes, null, 2));

        http.post(`comissao`,comissoes ,axiosConfig)
        .then(resposta => {
            mostrarMensagem("registro cadastrado com SUCESSO!", "success")
            reset()
            handleClose()
        })
        .catch(erro => {            
            mostrarMensagem("ERRO:" + erro, "error")
        })          
    } 

    const capturaVenda = async (id: string) => {
        const vendaEdita = await http.get<IVenda>(`venda/${id}`, axiosConfig);

        setIdVenda(vendaEdita.data?.id ? vendaEdita.data.id.toString() : "")
        setStatusVenda(vendaEdita.data?.statusvenda ? vendaEdita.data.statusvenda : "")
        setProduto(vendaEdita.data?.idproduto ? vendaEdita.data.produto : "")
        setDatavenda(vendaEdita.data?.datavenda ? vendaEdita.data.datavenda : "")
        if(vendaEdita.data?.documentocliente){
            try {
                let nomeCliente = "";                
                const resposta = await http.get<IClifor[]>(`clifor/filter?attribute=cpfcnpj&value=${vendaEdita.data.documentocliente}`, axiosConfig);
                if(resposta.data.length > 0){
                    nomeCliente = vendaEdita.data.documentocliente + " - " + resposta.data[0].nomecomercial + " " + resposta.data[0].nomesocial;
                }else{
                    nomeCliente = vendaEdita.data.documentocliente + " - Cliente não encontrado";
                }
                calculaTotais()
                setCliente(nomeCliente)

            } catch (erro) {
                mostrarMensagem("CLIFOR ERRO: " + erro, "error");
            }
        }
        
        //setMeiopagamento(vendaEdita.data?.pagamento ? vendaEdita.data.pagamento : [])  
        let pagamentoAgrupado = agruparPagamentos(vendaEdita.data?.pagamento ? vendaEdita.data.pagamento : [])
        
        setMeiopagamento(pagamentoAgrupado)
        
        
    }

    const agruparPagamentos = (pagamentos: IPagamento[]) => {
        //console.log("ENTROU AGRUPAR PAGAMENTOS")
        const agrupados: { [key: string]: IPagamento } = {};
        let ttlComprador = 0;
        let ttlBase = 0;
        let ttlTaxas = 0;
        let ttlComissao = 0;
        pagamentos.forEach(pagamento => {
          ttlComprador += pagamento.valorcomprador;
          ttlBase += pagamento.valorbase;
          ttlTaxas += pagamento.taxas;
          ttlComissao += pagamento.comissao;
          const key = `${pagamento.meiopagamento}-${pagamento.tipopagamento}`;
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
    
        return Object.values(agrupados).map(dado => ({
          ...dado,
          id: dado.id,
          valorcomprador: parseFloat(dado.valorcomprador.toString().replace(/[^\d.-]/g, '')),
          valorbase: parseFloat(dado.valorbase.toString().replace(/[^\d.-]/g, '')),
          taxas: parseFloat(dado.taxas.toString().replace(/[^\d.-]/g, '')),
          comissao: parseFloat(dado.comissao.toString().replace(/[^\d.-]/g, ''))
        }));
    };
   
    function calculaTotais(){
        let totalComprador = 0;
        let totalBase = 0;
        let totalTaxas = 0;
        let totalLiquido = 0;
        let totalComissao = 0;
        for (let i = 0; i < meiopagamento.length; i++) {
            totalBase += meiopagamento[i].valorbase;
            totalComprador += meiopagamento[i].valorcomprador;
            totalTaxas += meiopagamento[i].taxas;
            totalLiquido += meiopagamento[i].comissao;
            totalComissao += comissaoValor(meiopagamento[i].comissao);
        }
        setTotalComprador(totalComprador)
        setTotalBase(totalBase)
        setTotalTaxas(totalTaxas)
        setTotalLiquido(totalLiquido)
        setTotalComissao(totalComissao)
    }


    const Close =() => {
        reset()
        handleClose()   
    }

    function comissaoVenda(liquido: number, moeda: string){
         let taxa = taxas.find(taxa => taxa.id === idTaxa)?.valortaxa;
         if(!taxa){
             return formataMoeda(0, moeda);
         }
         let valor = liquido * taxa / 100;
         return formataMoeda(valor, moeda);
    }

    function comissaoValor(liquido: number): number{
        let taxa = taxas.find(taxa => taxa.id === idTaxa)?.valortaxa;
        if(!taxa){
            return 0
        }
        let valor = liquido * taxa / 100;
        return parseFloat(valor.toFixed(2));
   }

    function setarCampoTaxa(id: string){
        let taxa = taxas.find(taxa => taxa.id === id);
        setTaxaPorcentagem(taxa?.porcentagem ? true : false);
        if(taxa){
            taxa.porcentagem ? setTaxaValor(`${taxa.valortaxa}%`) : setTaxaValor(formataMoeda(taxa.valortaxa, 'BRL'));
        }

    }

    function hideDadosVenda(){
        setIdVenda("");
        setStatusVenda("");
        setProduto("");
        setDatavenda("");
        setCliente("");
        setMeiopagamento([]);
    }

    const handleDateChange = (date: string | null) => {
        if (date) {
            setDataComissao(date);
        }
    };


    return (
        <>            
            <Modal
                open={open}
                onClose={() => Close()}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
            >                
                <BoxCustomizado>                    
                    <Titulo>{`${tipo === 'cadastra' ? "Cadastrar" : "Editar"} Comissão`}</Titulo>
                    <form onSubmit={handleSubmit(createComissao)}>
                        <Container>
                        <Grid container spacing={2} >
                            <Grid item xs={12} md={2}>
                                <Rotulo>Tipo de Comissão *</Rotulo>
                                <Controller name="tipocomissao" control={control}
                                    render={({ field }) => (<SelectCustomizado styles={createCrmSelectStyles()} {...field} options={taxasFormatadas} isSearchable  onChange={(e: any) => {
                                        field.onChange(e);
                                        setIdTaxa(e.value);
                                        setarCampoTaxa(e.value);
                                        e.label.indexOf('COMISSAO FIXA') != -1 ? setVenda({value: 'SV', label: `SEM VENDA`}):setVenda({value: '', label: ``})
                                        e.label.indexOf('CV') != -1 || e.label.indexOf('SESSAO') != -1 || e.label.indexOf('TRADUCAO') != -1 ? setAllVendas(true):setAllVendas(false)
                                        }}/>)}
                                    
                                />
                                {errors.taxasFormatadas && typeof errors.taxasFormatadas.message === 'string' && <SpanErro>{errors.taxasFormatadas.message}</SpanErro>}
                            </Grid>

                            <Grid item xs={12} md={2}>
                            {/* <CampoLeitura  tipo="text" label="Taxa/Valor" valor={taxaValor}/> */}
                            <Rotulo>Taxa/Valor</Rotulo>
                                <Campo type="text" placeholder="" value={taxaValor} readOnly style={{backgroundColor: "#f7f1e9"}}/>
                            </Grid>
                            {!taxaPorcentagem && (
                                <React.Fragment>
                                    <Grid item xs={12} md={2} style={{paddingTop: '5px'}}>
                                        <DatePickerValue label="Data Comissão" onChange={handleDateChange} />
                                    </Grid>
                                </React.Fragment>                                    
                                )
                            }
                            

                            <Grid item xs={12} md={6} /* style={{marginLeft: "-164px"}} */>
                                <Rotulo>Selecione uma venda: *</Rotulo>
                                <Controller name="venda" control={control}
                                    render={({ field }) => (<SelectCustomizado styles={createCrmSelectStyles()}  {...field} value={venda} options={vendasFormatadas} isSearchable onChange={(e: any) => {
                                        field.onChange(e);
                                        setVenda(e);
                                        e.value != 'SV' ? capturaVenda(e.value) : hideDadosVenda();
                                        calculaTotais()
                                    }}/>)}
                                    
                                />
                                {errors.venda && typeof errors.venda.message === 'string' && <SpanErro>{errors.venda.message}</SpanErro>}
                            </Grid> 
                            <Grid item xs={12} md={12}>
                                {idVenda && taxaPorcentagem && venda.value &&(
                                    <React.Fragment>
                                        <Titulo>Dados Venda:</Titulo>
                                <Grid container spacing={2}>
                                    <Grid item xs={2} md={1}>
                                    <CampoLeitura tipo="text" label="ID" valor={idVenda} />
                                    </Grid>                            
                                    <Grid item xs={12} md={2}>
                                    <CampoLeitura tipo="text" label="Status Venda" valor={statusvenda} />
                                    </Grid>                        
                                    <Grid item xs={12} md={3}>
                                    <CampoLeitura  tipo="text" label="Produto" valor={produto}/>
                                    </Grid>
                                    <Grid item xs={12} md={4}>
                                    <CampoLeitura  tipo="text" label="Cliente" valor={cliente}/>
                                    </Grid>
                                    <Grid item xs={12} md={2}>
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
                                        <h2 style={{textAlign: "center", color: "#35252b"}}>Pagamento</h2>
                                    </Grid>
                                    {meiopagamento.map((item: any, index: any) => (
                                        <React.Fragment key={index}>
                                            <Grid container spacing={1}>                                     
                                                <Grid item xs={6} md={1}>
                                                    <CampoLeitura tipo="text" label={`Meio Pgto`} valor={item.meiopagamento} />
                                                </Grid>
                                                <Grid item xs={6} md={2}>
                                                    <CampoLeitura tipo="text" label={`Tipo Pgto`} valor={item.tipopagamento} />
                                                </Grid>
                                                <Grid item xs={6} md={1}>
                                                    <CampoLeitura tipo="text" label={`Parcelas`} valor={item.parcelas} />
                                                </Grid>
                                                <Grid item xs={6} md={1}>
                                                    <CampoLeitura tipo="text" label={`Comprador`} valor={formataMoeda(item.valorcomprador, item.moeda)} />  
                                                </Grid>
                                                <Grid item xs={6} md={1}>
                                                    <CampoLeitura tipo="text" label={`Valor Base`} valor={formataMoeda(item.valorbase, item.moeda)} />    
                                                </Grid>
                                                <Grid item xs={6} md={1}>
                                                    <CampoLeitura tipo="text" label={`Taxas`} valor={formataMoeda(item.taxas, item.moeda)} /> 
                                                </Grid>
                                                <Grid item xs={6} md={2}>
                                                    <CampoLeitura tipo="text" label={`Liquido`} valor={formataMoeda(item.comissao, item.moeda)} />   
                                                </Grid>
                                                <Grid item xs={6} md={2}>
                                                    <CampoLeitura background="rgba(57, 163, 41, 0.5)" tipo="text" label={`Comissão`} valor={comissaoVenda(item.comissao, item.moeda)} />   
                                                </Grid>
                                                <Grid item xs={6} md={1}>
                                                    <CampoLeitura tipo="text" label={`Data Pgto`} valor={transformDateBR(item.datapagamento)} />
                                                </Grid>
                                            </Grid>
                                        </React.Fragment>                                        
                                    ))}
                                </Grid> 
                                {meiopagamento.length > 1 && (
                                    <Grid item xs={12} md={12} >
                                        <Grid container spacing={2}>
                                            <Grid item xs={1}>
                                            </Grid>
                                            <Grid item xs={2}>
                                                <CampoLeitura tipo="text" label={`Total Comprador`} valor={formataMoeda(totalComprador, meiopagamento[0].moeda)} />
                                            </Grid>
                                            <Grid item xs={2}>
                                                <CampoLeitura tipo="text" label={`Total Base`} valor={formataMoeda(totalBase, meiopagamento[0].moeda)} />
                                            </Grid>
                                            <Grid item xs={2}>
                                                <CampoLeitura tipo="text" label={`Total Taxas`} valor={formataMoeda(totalTaxas, meiopagamento[0].moeda)} />
                                            </Grid>
                                            <Grid item xs={2}>
                                                <CampoLeitura tipo="text" label={`Total Liquido`} valor={formataMoeda(totalLiquido, meiopagamento[0].moeda)} />
                                            </Grid>
                                            <Grid item xs={2}>
                                                <CampoLeitura tipo="text" label={`Total Comissão`} valor={formataMoeda(totalComissao, meiopagamento[0].moeda)} />
                                            </Grid>
                                        </Grid>
                                    </Grid> 
                                )}                                
                                </Grid> 
                                    </React.Fragment>
                                )
                                }
                                
                            </Grid> 
                        
                        </Grid>

                        </Container>
                        
                        <BotaoCustomizado>{`${tipo === 'cadastra' ? "Cadastrar" : "Salvar"}`}</BotaoCustomizado>
                        <pre>{output}</pre>
                    </form>
                </BoxCustomizado>
            </Modal >
        </>
    );
}