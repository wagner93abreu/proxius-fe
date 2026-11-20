import { managementDialogStyles, managementFieldStyles } from "../../../styles/managementStyles";
import createCrmSelectStyles from "../../../styles/crmSelectStyles";
import React, { useRef, useState } from "react";
import { Grid, Modal } from '@mui/material';
import { Box } from "@mui/material";
import Titulo from "../../../components/Titulo";
import styled from "styled-components";
import Botao from "../../../components/Botao";
import autenticaStore from "../../../stores/autentica.store";
import { Controller, useForm } from "react-hook-form";
import http from "../../../http";
import { GridRowId } from "@mui/x-data-grid";
import IVenda from "../../../types/IVenda";
import Select from 'react-select';
import IProduto from "../../../types/IProduto";
import IBodyRequest from "../../../types/IBodyRequest";
import IPrecificacao from "../../../types/IPrecificacao";
import { NumericFormat } from 'react-number-format';
import ReactInputMask from "react-input-mask";
import { set } from "mobx";
import { getValue } from "@testing-library/user-event/dist/utils";
import IClifor from "../../../types/IClifor";
import ITaxa from "../../../types/ITaxa";
import { get } from "http";
import { convertDouble, transformDate } from "../../../customFunctions/mascarasFormatacao";
import IPagamento from "../../../types/IPagamento";
import IItem from "../../../types/IItem";
import { mostrarMensagem } from "../../../stores/mensagem.store";

const BoxCustomizado = styled(Box)`
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 80vw;
    max-height: 90vh;
    overflow-y: auto;
    background-color: #fffdfa;
    border: none;
    border-radius: 12px;
    padding: 1em 5em;
    ${managementDialogStyles}
`
const InputMaskCustomizado = styled(ReactInputMask)`
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
const SelectCustomizado = styled(Select)`
    background: #F0F0F0;
    margin-top: 3px;
    margin-bottom: 25px;
    box-sizing: border-box;
    box-shadow: none;
    border-radius: 12px;
    border: none;
    width: 100%;
`
const Container = styled.div`
text-align: left;
`
const BotaoCustomizado = styled(Botao)`
    width: 50%;
    display: block;
    margin: 0 auto;
`
const BotaoAcao = styled(Botao)`
    width: auto;
    display: inline-block;
    padding: 10px 20px;
    margin: 0;
    white-space: nowrap;
`
const BotaoRemoverLinha = styled(Botao)`
    width: auto;
    display: inline-block;
    padding: 8px 16px;
    margin: 0;
    white-space: nowrap;
    background-color: rgb(197, 0, 0);
`
const LinhaItem = styled(Grid)`
    background: #fffdfa;
    border-radius: 12px;
    margin: 0 0 25px 0;
    padding: 15px 15px 5px 15px;
    box-sizing: border-box;
    width: 100%;
`
const AcoesLinha = styled.div`
    display: flex;
    justify-content: flex-end;
    align-items: center;
    width: 100%;
    padding-top: 10px;
    padding-bottom: 10px;
`

const Rotulo = styled.label`
    display: block;
    font-weight: 700;
    font-size: 16px;
    line-height: 19px;
    color: #35252b
`

const CampoSelect = styled.select`
    background: #F0F0F0;
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
const ContainerInput = styled.div`
    width: 100%
`
const SpanErro = styled.span`
    float: left;
    color: #b3261e;
    font-size: 14px;
    margin-top: -25px;
`

export default function ModalVenda({ open, handleClose, venda, id, tipo }: { open: boolean, handleClose: () => void, venda: IVenda[], id: GridRowId[], tipo: string}) {
    const [idProduto, setIdProduto] = useState("");
    const [meiosPagamento, setMeiosPagamento] = React.useState([{ meiopagamento: '', tipopagamento: '' }]);
    const [itensVenda, setItensVenda] = React.useState([{ idproduct: '', quantidade: 1 }]);
    const [produtos, setProdutos] = useState<IProduto[]>([]);
    const [clientes, setClientes] = useState<IClifor[]>([]);
    const [precificacao, setPrecificacao] = useState<IPrecificacao[]>([]);
    const [taxas, setTaxas] = useState<ITaxa[]>([]);
    const {register, handleSubmit, reset, formState:{errors}, setValue, control, getValues, trigger} = useForm({ mode: 'onSubmit' });
    /* const [streaming, setStreaming] = useState(false); */
    const [extra, setExtra] = useState(false);
    /* const [precificacao, setPrecificacao] = useState<IPrecificacao[]>([]); */
    const [output, setOutput] = useState("");
    const [regras, setRegras] = useState("");
    const [preencheu, setPreencheu] = useState(false);
    const [modal, setModal] = useState("produto");
    const {usuario} = autenticaStore;
    const [index, setIndex] = useState(0);    
    const taxasComissao = useRef([{"taxa": 0, "comissao": 0, "vlrbase": 0, "meioPag": {value: '', label: ''}, "tipoPag": {value: '', label: ''}, "bandeira": {value: '', label: ''}}])
    const tipoPagArray = useRef([{"tipoPag": ""}])
    const [totalComissao, setTotalComissao] = useState(0)
    const [totalTaxas, setTotalTaxas] = useState(0)
    const [totalComprador, setTotalComprador] = useState(0)
    //const campoObservado = getValues(`meiopagamento[${index}]`);
               
    const axiosConfig = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${usuario.token}`,
        },
    };

    function resetCampos(){
        reset()
        setMeiosPagamento([{ meiopagamento: '', tipopagamento: '' }])
        setItensVenda([{ idproduct: '', quantidade: 1 }])
        taxasComissao.current = [{"taxa": 0, "comissao": 0, "vlrbase": 0, "meioPag": {value: '', label: ''}, "tipoPag": {value: '', label: ''}, "bandeira": {value: '', label: ''}}]
        setTotalComissao(0)
        setTotalTaxas(0)
        setTotalComprador(0)
    }

    React.useEffect(() => {
        let isMounted = true; // flag para verificar se o componente está montado
    
        http.get<IBodyRequest<ITaxa>>(`taxa?size=500`, axiosConfig)
          .then(resposta => {
            if (isMounted) {
              setTaxas(resposta.data.content);
              //console.log("TAXAS TAXAS TAXAS");
              //console.log(resposta.data.content);
            }
          })
          .catch(erro => {
            mostrarMensagem(erro, "error");
          });
    
        return () => {
          isMounted = false; // limpar no desmontagem
        };
      }, []);

    React.useEffect(() => {

        http.get<IBodyRequest<IProduto>>('produtos?size=500', axiosConfig)
        .then(resposta => {
            setProdutos(resposta.data.content.filter(produto => produto.active))            
        })
        .catch(erro => {
            mostrarMensagem(erro, "error")
        })

        http.get<IBodyRequest<IPrecificacao>>(`precificacao?size=500`, axiosConfig)
        .then(resposta => {
            //console.log("precificacao")
            //console.log(resposta)
            setPrecificacao(resposta.data.content.filter(precifica => precifica.active))
        })
        .catch(erro => {
            mostrarMensagem(erro, "error")
        })  

        http.get<IBodyRequest<IClifor>>(`clifor?size=500`, axiosConfig)
        .then(resposta => {
            //console.log("clientes")
            //console.log(resposta)
            setClientes(resposta.data.content.filter(clifor => clifor.active))
        })
        .catch(erro => {
            mostrarMensagem(erro, "error")
        })
        
    }, []);


    const produtosFormatados = produtos.map(produto => ({
        value: produto.id,
        label: produto.origem + " - " + produto.nome
    }));

    const clientesFormatados = clientes.map(cliente => ({
        value: cliente.cpfcnpj,
        label: cliente.cpfcnpj + " - " + cliente.nomecomercial + " " + cliente.nomesocial
    }));

    const tiposAceitaveisPgto = ["INTER", "STONE", "HOTMART", "ASAAS"]
        
    const taxasFornecedor = taxas.reduce((unique: ITaxa[], o) => {
        if (!unique.some((obj: ITaxa) => obj.fornecedor === o.fornecedor)) {
            if(tiposAceitaveisPgto.includes(o.fornecedor))
            unique.push(o);
        }
        return unique;
    }, []).map(taxa => ({
        value: taxa.fornecedor,
        label: taxa.fornecedor
    }));
    

    const tiposAceitaveis = ["CREDITO", "CREDITO - CLIENTE", "CREDITO - FORNECEDOR", "PIX", "PIX" , "BOLETO", "DEBITO", "DEBITO"]

    const tipopagamentoFiltrado = (fornecedor: any, indice: any) => {
        //console.log("TIPO PAGAMENTO FILTRADO")

        if(fornecedor === "" || fornecedor == undefined || fornecedor == null) return []
        //console.log(taxas)
        let taxasFiltradas = taxas.filter(taxa => taxa.fornecedor === fornecedor.value).reduce((unique: ITaxa[], o) => {
            if (!unique.some((obj: ITaxa) => obj.tipo === o.tipo)) {
                if(tiposAceitaveis.includes(o.tipo))
                unique.push(o);
            }
            return unique;
        }, []).map(taxa => ({
            value: taxa.tipo,
            label: taxa.tipo
        })) 
       
        if(fornecedor.value !== taxasComissao.current[indice].meioPag.value){
            taxasComissao.current[indice].meioPag = fornecedor;
            if(getValues(`tipopagamento[${indice}]`) === undefined){
                if(taxasFiltradas.length == 1){
                    setValue(`tipopagamento[${indice}]`, taxasFiltradas[0])                    
                }
            }else{
                if(taxasFiltradas.length == 1 && getValues(`tipopagamento[${indice}]`).value !== taxasFiltradas[0].value){
                    //console.log("VAI SETAR O VALOR TIPO PAGAMENTO!!!")
                    setValue(`tipopagamento[${indice}]`, taxasFiltradas[0])                    
                }else if(taxasFiltradas.length != 1 && getValues(`tipopagamento[${indice}]`) !== ""){
                    //console.log("RESET TIPO PAGAMENTO")
                    setValue(`tipopagamento[${indice}]`, "") 
                    taxasComissao.current[indice].tipoPag = {value: '', label: ''};
                    taxasComissao.current[indice].bandeira = {value: '', label: ''}; 
                          
                    setValue(`bandeira[${indice}]`, "")   
                    setValue(`parcelas[${indice}]`, "")
                          
                }
            } 
        }       

        return taxasFiltradas
    }

    function bandeiraFiltrada(meio: any, tipo: any, indice: any){ 
        //console.log("BANDEIRA FILTRADA")
        if(meio === "" || meio == undefined || meio == null ||
        tipo === "" || tipo == undefined || tipo == null) return []

        let taxasFiltradas = taxas.filter(taxa => taxa.fornecedor === meio.value && taxa.tipo === tipo.value).reduce((unique: ITaxa[], o) => {
            if (!unique.some((obj: ITaxa) => obj.bandeira === o.bandeira)) {
                unique.push(o);
            }
            return unique;
        }, []).map(taxa => ({
            value: taxa.bandeira,
            label: taxa.bandeira
        })) 

        if(tipo.value !== taxasComissao.current[indice].tipoPag.value){
            taxasComissao.current[indice].tipoPag = tipo;

            if(getValues(`bandeira[${indice}]`) === undefined){
                if(taxasFiltradas.length == 1){
                    setValue(`bandeira[${indice}]`, taxasFiltradas[0])    
                                     
                }
            }else{
                if(taxasFiltradas.length == 1){
                    //console.log("VAI SETAR O VALOR BANDEIRA!!!")
                    setValue(`bandeira[${indice}]`, taxasFiltradas[0])    
                    taxasComissao.current[indice].bandeira = {value: '', label: ''};                                   

                }else if(taxasFiltradas.length != 1){
                    //console.log("RESET BANDEIRA")
                    setValue(`bandeira[${indice}]`, "")                     
                    setValue(`parcelas[${indice}]`, "")                          
                }
            } 
        }

        return taxasFiltradas
    }   

  

    const parcelaFiltrada = (meio: any, tipo: any, bandeira: any, indice: any) => {
        //console.log("PARCELA FILTRADA")
        /* return [] */
        if(meio === "" || meio == undefined || meio == null ||
        tipo === "" || tipo == undefined || tipo == null ||
        bandeira === "" || bandeira == undefined || bandeira == null) return []
        let taxasFiltradas =  taxas.filter(taxa => taxa.fornecedor === meio.value && taxa.tipo === tipo.value && taxa.bandeira === bandeira.value).reduce((unique: ITaxa[], o) => {
            if (!unique.some((obj: ITaxa) => obj.parcela === o.parcela)) {
                unique.push(o);
            }
            return unique;
        }, []).map(taxa => ({
            value: taxa.id,
            label: taxa.parcela
        })) 
        //console.log(taxasFiltradas)
        if(bandeira.value !== taxasComissao.current[indice].bandeira.value){
            taxasComissao.current[indice].bandeira = bandeira;

            if(getValues(`parcelas[${indice}]`) === undefined){
                if(taxasFiltradas.length == 1){
                    setValue(`parcelas[${indice}]`, taxasFiltradas[0])                    
                }
            }else{
                if(taxasFiltradas.length == 1 && getValues(`parcelas[${indice}]`).value !== taxasFiltradas[0].value){
                    //console.log("VAI SETAR O VALOR PARCELA!!!")
                    setValue(`parcelas[${indice}]`, taxasFiltradas[0])                    
                }else if(taxasFiltradas.length != 1 && getValues(`parcelas[${indice}]`) !== ""){
                    //console.log("RESET PARCELA")
                    setValue(`parcelas[${indice}]`, "")            
                }
            } 
        }


        return taxasFiltradas
    }

    const formataValor = (moeda: string, valor: string | number) => {
        if(moeda === "REAL") return `R$ ${valor.toLocaleString('pt-br', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        if(moeda === "DOLAR") return `U$ ${valor.toLocaleString('pt-br', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        if(moeda === "EURO") return `€ ${valor.toLocaleString('pt-br', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`        
    }

    const moedaSigla = (moeda: string) => {
        if(moeda === "DOLAR") return "USD"
        if(moeda === "EURO") return "EUR"
        return "BRL"
    }

    const itemPrecificacaoFormatados = (produtoSelecionado: any, indice: number) => {
        if(produtoSelecionado === "" || produtoSelecionado == undefined || produtoSelecionado == null) return []

        let filtrado = precificacao.filter(precifica => precifica.idproduto === produtoSelecionado.value)

        if(indice === 0){
            let produto = produtos.find(produto => produto.id === produtoSelecionado.value)
            setRegras(produto?.regras ? produto.regras : "")
        }

        return filtrado.map(precifica => ({
            value: { valor: Number(precifica.valor), moeda: precifica.moeda, cupom: precifica.cupom },
            label: `${precifica.cupom} - ${formataValor(precifica.moeda, precifica.valor)}`
        }))
    }

    function calculaPrecoFinalItem(indice: number) {
        const precoSelecionado = getValues(`itemprecificacao[${indice}]`)
        const quantidade = getValues(`itemquantidade[${indice}]`)
        const tipoDesconto = getValues(`itemtipodesconto[${indice}]`)
        const valorDesconto = getValues(`itemvalordesconto[${indice}]`)

        if(precoSelecionado === "" || precoSelecionado == undefined || precoSelecionado == null) return 0

        const unitPrice = Number(precoSelecionado.value.valor)
        const qtd = quantidade && quantidade > 0 ? Number(quantidade) : 1
        const desconto = valorDesconto ? Number(valorDesconto) : 0

        let total = unitPrice * qtd
        total = tipoDesconto === 'PERCENTAGE' ? total - (total * desconto / 100) : total - desconto

        return total > 0 ? total : 0
    }
    
      
    if(open && !preencheu && tipo === 'edita'){
        const prod = venda.find(item => item.id === id[0]);
        setIdProduto(prod?.id ? prod.id.toString() : "")
        /* setValue('nome', prod?.nome ? prod.nome : "")
        setValue('descricao', prod?.descricao ? prod.descricao : "") */
        setPreencheu(true)
    }else if(open && !preencheu && tipo === 'cadastra'){
        resetCampos()
        setPreencheu(true)
    }

    if(!open && preencheu){
        resetCampos()
        setPreencheu(false)
    } 

    function postVenda(data: any){

        const pagamentos: IPagamento[] = [];
        //console.log("DATA")
        const qtdMetodos = data.bandeira.length
        for(let i = 0; i < qtdMetodos; i++){
            pagamentos.push({
                id: null,
                moeda: moedaSigla(data.itemprecificacao && data.itemprecificacao[0] ? data.itemprecificacao[0].value.moeda : ""),
                meiopagamento: data.meiopagamento[i].value,
                tipopagamento: data.tipopagamento[i].value,
                parcelas: data.parcelas[i].label,
                valorcomprador: data.valorcomprador[i].toFixed(2),
                valorbase: data.vlrbase[i].toFixed(2),
                taxas: data.taxafixaoperadora[i].toFixed(2),
                comissao: data.comissao[i].toFixed(2),
                datapagamento: transformDate(data.datavenda[i]) + "T00:00:00",
                cupom: data.itemprecificacao && data.itemprecificacao[0] ? data.itemprecificacao[0].value.cupom : "",
            })
        }

        const itens: IItem[] = [];
        const qtdItens = itensVenda.length
        for(let i = 0; i < qtdItens; i++){
            const produtoItem = data.itemproduto && data.itemproduto[i]
            const precoItem = data.itemprecificacao && data.itemprecificacao[i]

            if(!produtoItem || !precoItem) continue

            const quantidade = data.itemquantidade && data.itemquantidade[i] ? Number(data.itemquantidade[i]) : 1
            const tipoDesconto = data.itemtipodesconto && data.itemtipodesconto[i] ? data.itemtipodesconto[i] : 'VALUE'
            const valorDesconto = data.itemvalordesconto && data.itemvalordesconto[i] ? Number(data.itemvalordesconto[i]) : 0
            const unitPrice = Number(precoItem.value.valor)
            let finalPrice = unitPrice * quantidade
            finalPrice = tipoDesconto === 'PERCENTAGE' ? finalPrice - (finalPrice * valorDesconto / 100) : finalPrice - valorDesconto

            itens.push({
                idproduct: produtoItem.value,
                product: produtoItem.label,
                pricing: unitPrice,
                quantity: quantidade,
                itemOrder: i + 1,
                unitPrice: unitPrice,
                discountType: tipoDesconto,
                discountValue: valorDesconto,
                finalPrice: Number(finalPrice.toFixed(2))
            })
        }

        
        /* //console.log("PAGAMENTOS")
        //console.log(pagamentos) */
        /* if(JSON.stringify(data).indexOf("descricao") !== -1){ */
            const venda: IVenda = {
                id: null,
                statusvenda: data.statusvenda,
                idproduto: itens.length > 0 ? itens[0].idproduct as string : "",
                produto: itens.length > 0 ? itens[0].product : "",
                datavenda: transformDate(data.datavenda[0]),
                documentocliente: data.cliente.value,
                pagamento: pagamentos,
                itens: itens,
            }
            /* setOutput(JSON.stringify(venda, null, 2)); */
            //console.log("VENDA")
            //console.log(venda)
            //console.log('pause')
            if(tipo === 'cadastra'){         
                console.log("CADASTRA VENDA")
                console.log(JSON.stringify(venda, null, 2))
                http.post(`venda`,venda ,axiosConfig)
                .then(resposta => {
                    
                    cadastrarFinanceiro(qtdMetodos, resposta.data.id)
                    /* resetCampos()
                    handleClose() */
                })
                .catch(erro => {            
                    mostrarMensagem("ERRO:" + erro, "error")
                })  
            }else{
                http.put("venda",venda ,axiosConfig)
                .then(resposta => {
                    mostrarMensagem("Alteração efetuada com sucesso!", "success")
                    resetCampos()
                    handleClose()
                })
                .catch(erro => {            
                    mostrarMensagem("ERRO:" + erro, "error")
                })   
            }
        /* } */
         
    } 

    function isFutureDate(date: string) {
        //console.log('DATA: ' + date)
        let dia = date.split('/')[0]
        let mes = date.split('/')[1]   
        let ano = date.split('/')[2] 
        const currentDate = new Date();
        const inputDate = new Date(mes + '/' + dia + '/' + ano);   
        //console.log('data string:'+ mes + '/' + dia + '/' + ano) 
        //console.log('DATA INPUT: ' + inputDate)
        return inputDate > currentDate;
    }

    function cadastrarFinanceiro(qtdMetodos: number, idVenda: number){
        const cadastro = []
        const moedaPrincipal = moedaSigla(getValues(`itemprecificacao[0]`) ? getValues(`itemprecificacao[0]`).value.moeda : "")

        for(let i = 0; i < qtdMetodos; i++){
            //console.log("CADASTRO data")
            //console.log(getValues(`datavenda[${i}]`))
            //console.log(isFutureDate(getValues(`datavenda[${i}]`)))
            let prod = getValues(`itemproduto[0]`).label
            cadastro.push({
                tipo: 'E',
                descricao: 'VENDA: '+ idVenda + ' - ' + getValues(`itemproduto[0]`).label.split(" - ")[1] + ' - ' + getValues(`cliente`).label.split(" - ")[1],
                idcategoria: prod.indexOf("urso") == -1 || prod.indexOf("URSO") == -1 ? '2' : '3',
                dataprevista: transformDate(getValues(`datavenda[${i}]`)),
                dataexecutada: isFutureDate(getValues(`datavenda[${i}]`)) ? "" : transformDate(getValues(`datavenda[${i}]`)),
                moeda: moedaPrincipal,
                valor: getValues(`valorcomprador[${i}]`).toFixed(2)
            })
            if(getValues(`taxafixaoperadora[${i}]`) > 0){                
                cadastro.push({
                    tipo: 'S',
                    descricao: getValues(`meiopagamento[${i}]`).label + ' - VENDA: '+ idVenda +  ' - ' + getValues(`itemproduto[0]`).label.split(" - ")[1] + ' - ' + getValues(`cliente`).label.split(" - ")[1],
                    idcategoria: '29',
                    dataprevista: transformDate(getValues(`datavenda[${i}]`)),
                    dataexecutada: transformDate(getValues(`datavenda[${i}]`)),
                    moeda: moedaPrincipal,
                    valor: getValues(`taxafixaoperadora[${i}]`).toFixed(2)
                })
            }            
        }
        
        if(extra === true){            
            cadastro.push({
                tipo: 'S',
                descricao: 'HOTMART CURSO. VENDA: ' + idVenda + ' - ' + getValues(`itemproduto[0]`).label.split(" - ")[1] + ' - ' + getValues(`cliente`).label.split(" - ")[1],
                idcategoria: '29',
                dataprevista: transformDate(getValues(`datavenda[0]`)),
                dataexecutada: transformDate(getValues(`datavenda[0]`)),
                moeda: "BRL",
                valor: 1
            })
        }
        //console.log("CADASTRO")
        //console.log(cadastro)   
        http.post(`financeiro`,cadastro ,axiosConfig)
                .then(resposta => {
                    mostrarMensagem("registro de VENDAS e FINANCEIRO cadastrado com SUCESSO!", "success")
                    resetCampos()
                    handleClose()
                })
                .catch(erro => {            
                    mostrarMensagem("ERRO:" + erro, "error")
                }) 

    }

    const Close =() => {
        resetCampos()
        handleClose()   
        setMeiosPagamento([{ meiopagamento: '', tipopagamento: '' }])
        setItensVenda([{ idproduct: '', quantidade: 1 }])
        
    }

    const addItem = () => {
        setItensVenda([...itensVenda, { idproduct: '', quantidade: 1 }]);
    }

    const removeItem = (indexToRemove: number) => {
        setValue(`itemproduto[${indexToRemove}]`, "")
        setValue(`itemprecificacao[${indexToRemove}]`, "")
        setValue(`itemquantidade[${indexToRemove}]`, "")
        setValue(`itemtipodesconto[${indexToRemove}]`, "")
        setValue(`itemvalordesconto[${indexToRemove}]`, "")

        setItensVenda(itensVenda.filter((_, index) => index !== indexToRemove));
    }

    const addMeioPagamento = () => {
        setMeiosPagamento([...meiosPagamento, { meiopagamento: '', tipopagamento: '' }]);
        setIndex(index + 1)
        taxasComissao.current.push({"taxa": 0, "comissao": 0, "vlrbase": 0, "meioPag": {value: '', label: ''}, "tipoPag": {value: '', label: ''}, "bandeira": {value: '', label: ''}})

    }

    const removeMeioPagamento = (indexToRemove: number) => {
        setValue(`meiopagamento[${indexToRemove}]`, "") 
        setValue(`tipopagamento[${indexToRemove}]`, "")
        setValue(`bandeira[${indexToRemove}]`, "")
        setValue(`parcelas[${indexToRemove}]`, "")
        setValue(`vlrbase[${indexToRemove}]`, "")
        setValue(`datavenda[${indexToRemove}]`, "")
        setValue(`valorcomprador[${indexToRemove}]`, "")
        setValue(`taxaFixa[${indexToRemove}]`, 0)
        setValue(`comissao[${indexToRemove}]`, 0)

        setMeiosPagamento(meiosPagamento.filter((_, index) => index !== indexToRemove));
        setIndex(index - 1)
        taxasComissao.current.splice(indexToRemove, 1)

      };
      
    function somaTotalTaxas() {
        let total = 0;
        for(let i = 0; i <= index; i++){
            total += taxasComissao.current[i].taxa   
        }
        //setTotalTaxas(total)
        //GERA ERRO NO CONSOLE QUANDO SETA ALGUM MEIO DE PAGAMENTO, VERIFICAR
    }
    function somaTotalComprador(){
        let ttlComprador = 0;
        let ttlTaxas = 0;
        let ttlComissao = 0;
        if(getValues(`itemprecificacao[0]`) === "" || getValues(`itemprecificacao[0]`) == undefined) return 0
        for(let i = 0; i <= index; i++){            
            ttlComprador += getValues(`valorcomprador[${i}]`)            
        }
        for(let i = 0; i <= index; i++){            
            ttlTaxas += getValues(`taxafixaoperadora[${i}]`)            
        }
        for(let i = 0; i <= index; i++){            
            ttlComissao += getValues(`comissao[${i}]`)            
        }
        if(extra === true){
            ttlTaxas += 1
            ttlComissao -= 1
        }

        setTotalComprador(ttlComprador)
        setTotalTaxas(ttlTaxas)
        setTotalComissao(ttlComissao)
    } 

 

    const calculaTotalComprador = (idTaxa: any, indice: any) => {
        //console.log("calculaTotalComprador")
        //console.log(idTaxa) 
        //console.log(indice)
        setValue(`taxafixaoperadora[${indice}]`, "")
        setValue(`comissao[${indice}]`, "")   
         
        if(idTaxa === "" || idTaxa == undefined || idTaxa == null) return 0
        let valorBase = getValues(`vlrbase[${indice}]`)  
        let meio = getValues(`meiopagamento[${indice}]`).value
        //console.log("valor base "+valorBase)
        //console.log("meio "+meio)
        let taxa = taxas.find(taxa => taxa.id == idTaxa.value)         
        if(meio === "STONE") {
            //console.log("entrou Stone")   
            if(taxa?.porcentagem === true){
                //console.log('STONE')
                if(taxa?.tipo.indexOf("CLIENTE") !== -1){
                    let taxaFornecedor = taxas.find(taxaFix => taxaFix.tipo == taxa?.tipo + " - TAXAFIXA")
                    let taxaForn = 0
                    if(taxaFornecedor != undefined){
                        taxaForn = valorBase * taxaFornecedor.valortaxa / 100
                    }
                    let valor = (valorBase - taxaForn) / (1 - taxa?.valortaxa / 100) 
                    taxasComissao.current[indice].taxa = valor
                    somaTotalTaxas()
                    let juros = getValues(`valorcomprador[${indice}]`) - valorBase
                    setValue(`taxafixaoperadora[${indice}]`, taxaForn + juros)
                    setValue(`comissao[${indice}]`, valorBase - taxaForn)                   

                    somaTotalComprador()
                    return valor.toFixed(2)

                }else if(taxa?.tipo.indexOf("FORNECEDOR") !== -1){
                    
                    let taxaForn = 0
                    
                    let valor = valorBase - (valorBase * (1 + taxa?.valortaxa / 100))
                    taxasComissao.current[indice].taxa = valor
                    somaTotalTaxas()

                    let juros = valorBase * (taxa?.valortaxa / 100)
                    //juros = duasCasasDecimais(juros)

                    setValue(`taxafixaoperadora[${indice}]`, juros)
                    setValue(`comissao[${indice}]`, valorBase - juros)                   

                    somaTotalComprador()
                    return valorBase.toFixed(2)
                }
            }

        }else if(meio === "INTER"){   
            //console.log("entrou banco inter")         
            somaTotalTaxas()
            setValue(`taxafixaoperadora[${indice}]`, 0)
            setValue(`comissao[${indice}]`, valorBase)   
            somaTotalComprador()
            return valorBase
            
        }else if(meio === "HOTMART"){   
            //console.log("entrou Hotmart")    
            //calcular taxa de licença
            let licenca = taxas.filter(taxa => taxa.fornecedor == "HOTMART" && taxa.tipo == " - LICENCA") 
            let valorLicenca = 0 
            let regra = licenca.find(taxa => taxa.valormaximo != null && valorBase < taxa.valormaximo)
            if(regra != undefined){
                if(valorBase < regra.valormaximo){
                    if(!regra.porcentagem){                    
                        valorLicenca += regra.valortaxa
                    }else{
                        let valor = (valorBase * regra.valortaxa) / 100
                        valorLicenca += valor
                    }
                }
            }else{
                licenca.filter(taxa => taxa.valormaximo == null).forEach(taxa => {
                    if(!taxa.porcentagem){                    
                        valorLicenca += taxa.valortaxa
                    }else{
                        let valor = (valorBase * taxa.valortaxa) / 100
                        valorLicenca += valor
                    }
                })

            }
            //verifica se existe alguma regra
            if(regras != "" || regras == undefined || regras == null){
                let regra1 = regras.split(";")
                
                regra1.forEach(regra => {                   
                    
                    let taxaRegra = taxas.filter(taxa => taxa.fornecedor == "HOTMART" && taxa.tipo == regra.replace(/\s/g, '')) 
                    taxaRegra.forEach(taxa => {
                        if(taxa.porcentagem){
                            let valor = (valorBase * taxa.valortaxa) / 100
                            valorLicenca += valor
                        }else{
                            valorLicenca += taxa.valortaxa
                        }                       
                    })                    
                })
            }
            let valorCliente = 0
            //calcula valor pago pelo cliente
            if( taxa?.tipo == "CREDITO - CLIENTE" ){
                
                if(!taxa.porcentagem){                    
                    valorCliente = taxa.valortaxa
                }else{
                    let valor = (valorBase * taxa.valortaxa) / 100
                    valor = valor + valorBase
                    valor = valor / taxa.parcela
                    let valorParcela = valor.toFixed(2)
                    valorCliente = parseFloat(valorParcela) * taxa.parcela
                    
                }

            }else if(taxa?.tipo == "CREDITO - FORNECEDOR"){
                if(!taxa.porcentagem){                    
                    valorLicenca += taxa.valortaxa
                }else{
                    let valor = (valorBase * taxa.valortaxa) / 100
                    valorLicenca += valor 
                }
            }
            
            setValue(`taxafixaoperadora[${indice}]`, valorLicenca)
            setValue(`comissao[${indice}]`, valorBase - valorLicenca)   
            somaTotalComprador() 
            return valorCliente
        }else if (meio === "ASAAS"){
            if(taxa?.tipo == "CREDITO - FORNECEDOR"){
            
                let taxaFornecedor = taxas.find(taxaFix => taxaFix.tipo == taxa?.tipo + " - TAXAFIXA")
                let taxaForn = 0
                if(taxaFornecedor != undefined){
                    taxaForn = valorBase * taxaFornecedor.valortaxa / 100
                }    

                let valor = valorBase - (valorBase * (1 + taxa?.valortaxa / 100))
                taxasComissao.current[indice].taxa = valor
                somaTotalTaxas()

                let juros = valorBase * (taxa?.valortaxa / 100)
                //juros = duasCasasDecimais(juros)

                setValue(`taxafixaoperadora[${indice}]`, juros + taxaForn)
                setValue(`comissao[${indice}]`, valorBase - juros - taxaForn)                   

                somaTotalComprador()
                return valorBase.toFixed(2)
            
            }else if(taxa?.tipo == "PIX"){
                
                let taxaFornecedor = taxas.find(taxaFix => taxaFix.tipo == taxa?.tipo + " - TAXAPIX")
                let taxaForn = 0
                if(taxaFornecedor != undefined){
                    taxaForn += taxaFornecedor.valortaxa
                }
                somaTotalTaxas()
                setValue(`taxafixaoperadora[${indice}]`, taxaForn)
                setValue(`comissao[${indice}]`, valorBase - taxaForn)   
                somaTotalComprador()
                return valorBase
            }
             
        /* return 0 */
        }    
    }
    //console.log("quantas vezes passa aqui") 

    function calcularValorBase(valorTotal: number, taxaJuros: number, numeroParcelas: number) {
        // Converte a taxa de juros de percentual para decimal
        const taxaDecimal = taxaJuros / 100;
        
        // Aplica a fórmula dos juros compostos
        const valorBase = valorTotal / Math.pow(1 + taxaDecimal, numeroParcelas);
        
        // Retorna o valor base arredondado para duas casas decimais
        return valorBase.toFixed(2);
    }
    
    // Exemplo de uso:
    const valorTotal = 100.00; // Valor total do parcelamento
    const taxaJuros = 2.89;    // Taxa de juros mensal em percentual
    const numeroParcelas = 4;  // Número de parcelas
    
    const teste = calcularValorBase(valorTotal, taxaJuros, numeroParcelas);
    

    function duasCasasDecimais(valor: number) {
        const valorString = valor.toString();
        const pontoDecimalIndex = valorString.indexOf('.');
      
        if (pontoDecimalIndex === -1) {
          // Se não houver ponto decimal, o valor já é um número inteiro
          return parseFloat(valorString);
        }
      
        // Pega a parte inteira e as duas primeiras casas decimais
        const parteInteira = valorString.split('.')[0]
        const parteDecimal = valorString.split('.')[1].substring(0,2)
        let valorFormatado = parteInteira + '.' + parteDecimal;

        return parseFloat(valorFormatado);
    }

       
    return (
        <>
            <Modal
                open={open}
                onClose={() => Close()}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"                
            >
                <BoxCustomizado>
                    <form onSubmit={handleSubmit(postVenda)}>
                        <Titulo>{`${tipo === 'cadastra' ? "Cadastrar" : "Editar"} Venda`}</Titulo>
                        <Grid container spacing={2} >
                            <Grid item xs={12} md={2}>
                                <Rotulo>Status *</Rotulo>                                
                                <CampoSelect {...register('statusvenda', {
                                required: 'Campo obrigatório'})}>
                                    <option value="FINALIZADA">FINALIZADA</option>
                                    <option value="PROCESSANDO">PROCESSANDO</option>
                                    <option value="CANCELADA">CANCELADA</option>
                                </CampoSelect>
                                {errors.statusvenda && typeof errors.statusvenda.message === 'string' && <SpanErro>{errors.statusvenda.message}</SpanErro>}
                            </Grid>  
                            <Grid item xs={12} md={7}>
                                <Rotulo>CLIENTE *</Rotulo>
                                <Controller name="cliente" control={control}
                                    render={({ field }) => (<SelectCustomizado styles={createCrmSelectStyles()} {...field} options={clientesFormatados} isSearchable/>)}
                                    
                                />
                            </Grid>                           

                            <Grid item xs={12} style={{marginTop: "10px", marginBottom: "10px"}}>
                                <BotaoAcao style={{backgroundColor: "green"}} onClick={() => addItem()}>Adicionar Item</BotaoAcao>
                            </Grid>

                            {itensVenda.map((itemVenda, indexItem) => (
                            <LinhaItem container spacing={2} key={indexItem}>

                                <Grid item xs={12} sm={6} md={4}>
                                    <Rotulo>Produto *</Rotulo>
                                    <Controller name={`itemproduto[${indexItem}]`} control={control}
                                        render={({ field }) => (<SelectCustomizado styles={createCrmSelectStyles()} {...field} options={produtosFormatados} isSearchable
                                            onChange={(e) => {
                                                field.onChange(e);
                                                setValue(`itemprecificacao[${indexItem}]`, "")
                                            }}/>)}
                                    />
                                </Grid>

                                <Grid item xs={12} sm={6} md={3}>
                                    <Rotulo>Preço Unitário *</Rotulo>
                                    <Controller name={`itemprecificacao[${indexItem}]`} control={control}
                                        render={({ field }) => {
                                            const produtoSelecionado = getValues(`itemproduto[${indexItem}]`)
                                            return (<SelectCustomizado styles={createCrmSelectStyles()} {...field} options={itemPrecificacaoFormatados(produtoSelecionado, indexItem)} isSearchable/>)
                                        }}
                                    />
                                </Grid>

                                <Grid item xs={6} sm={3} md={2}>
                                    <Rotulo>Quantidade *</Rotulo>
                                    <Campo type="number" min={1} defaultValue={1} {...register(`itemquantidade[${indexItem}]`, { valueAsNumber: true })} />
                                </Grid>

                                <Grid item xs={6} sm={3} md={1}>
                                    <Rotulo>Desconto</Rotulo>
                                    <CampoSelect defaultValue="VALUE" {...register(`itemtipodesconto[${indexItem}]`)}>
                                        <option value="VALUE">R$</option>
                                        <option value="PERCENTAGE">%</option>
                                    </CampoSelect>
                                </Grid>

                                <Grid item xs={12} sm={6} md={1}>
                                    <Rotulo>Vlr. Desconto</Rotulo>
                                    <Controller
                                        name={`itemvalordesconto[${indexItem}]`}
                                        control={control}
                                        defaultValue={0}
                                        render={({ field: { onChange, value } }) => (
                                            <NumericFormat
                                                value={value}
                                                decimalScale={2}
                                                fixedDecimalScale={true}
                                                allowNegative={false}
                                                decimalSeparator=","
                                                allowedDecimalSeparators={[".", ","]}
                                                onValueChange={(values) => onChange(values.floatValue)}
                                                customInput={Campo}
                                            />
                                        )}
                                    />
                                </Grid>

                                <Grid item xs={12} sm={6} md={1}>
                                    <Rotulo>Preço Final</Rotulo>
                                    <NumericFormat
                                        value={calculaPrecoFinalItem(indexItem)}
                                        prefix={"R$ "}
                                        thousandSeparator={"."}
                                        decimalScale={2}
                                        fixedDecimalScale={true}
                                        allowNegative={false}
                                        decimalSeparator=","
                                        allowedDecimalSeparators={[".", ","]}
                                        customInput={Campo}
                                        readOnly
                                        style={{backgroundColor: "#f7f1e9"}}
                                    />
                                </Grid>

                                <Grid item xs={12}>
                                    <AcoesLinha>
                                        <BotaoRemoverLinha onClick={() => removeItem(indexItem)}>Remover Item</BotaoRemoverLinha>
                                    </AcoesLinha>
                                </Grid>

                            </LinhaItem>
                            ))}

                            <Grid item xs={12} style={{marginTop: "10px", marginBottom: "10px"}}>
                                <BotaoAcao style={{backgroundColor: "green"}} onClick={() => addMeioPagamento()}>Adicionar Método de Pagamento</BotaoAcao>
                            </Grid>
                                  
                                 

                            {meiosPagamento.map((meioPagamento, index) => (
                            <React.Fragment key={index}>  
                                <LinhaItem container spacing={2}>
                                
                                    <Grid item xs={12} sm={6} md={2}>
                                        <Rotulo>Valor Base</Rotulo>                                        
                                        <Controller
                                            name={`vlrbase[${index}]`}
                                            control={control}
                                            rules={{ required: "Campo obrigatório" }}
                                            defaultValue=""
                                            render={({ field: { onChange, value } }) => {
                                                const meioPagamento = getValues(`parcelas[${index}]`);                                                   
                                                const indice = index                                  
                                                return (
                                                    <NumericFormat                    
                                                        value={value}
                                                        prefix={"R$ "}
                                                        thousandSeparator={"."}
                                                        decimalScale={2}
                                                        fixedDecimalScale={true}
                                                        allowNegative={false}  
                                                        decimalSeparator=","   
                                                        allowedDecimalSeparators={[".", ","]}
                                                        onValueChange={(values) => onChange(values.floatValue)}     
                                                        onBlur={() => { 
                                                            //console.log("BLUR")
                                                            //console.log(meioPagamento)
                                                            //console.log(indice)                                                           
                                                            if((meioPagamento !== "" && meioPagamento != undefined && meioPagamento != null) && (indice != undefined && indice != null)){
                                                                calculaTotalComprador(meioPagamento, indice)
                                                            }
                                                        }}                       
                                                        customInput={Campo}                                    
                                                    />
                                                );
                                            }}
                                        />
                                        {errors.vlrbase && typeof errors.vlrbase.message === 'string' && <SpanErro>{errors.vlrbase.message}</SpanErro>}
                                    </Grid>
                                    
                                    <Grid item xs={12} sm={6} md={2}>
                                        <Rotulo>Meio de pagamento *</Rotulo>
                                        <Controller name={`meiopagamento[${index}]`} control={control}
                                            render={({ field }) => (<SelectCustomizado styles={createCrmSelectStyles()} {...field} options={taxasFornecedor} isSearchable
                                                onChange={(e) => {
                                                    field.onChange(e);

                                                    trigger(`tipopagamento[${index}]`)
                                                  }}/>)}                                            
                                        />
                                    </Grid> 
                                    {errors.meiopagamento && typeof errors.meiopagamento.message === 'string' && <SpanErro>{errors.meiopagamento.message}</SpanErro>}

                                    <Grid item xs={12} sm={6} md={2}>
                                        <Rotulo>Tipo de pagamento *</Rotulo>
                                        <Controller
                                            name={`tipopagamento[${index}]`}
                                            control={control}
                                            render={({ field }) => {
                                                const meioPagamento = getValues(`meiopagamento[${index}]`);   
                                                const indice = index   
                              
                                                return (
                                                    <SelectCustomizado styles={createCrmSelectStyles()}
                                                        {...field}
                                                        options={tipopagamentoFiltrado(meioPagamento, indice)}
                                                        isSearchable
                                                        onChange={(e) => {
                                                            field.onChange(e);                                                            
                                                            trigger(`bandeira[${index}]`)
                                                          }}
                                                        
                                                    />
                                                );
                                            }}
                                        />
                                    </Grid>
                                    {errors.tipopagamento && typeof errors.tipopagamento.message === 'string' && <SpanErro>{errors.tipopagamento.message}</SpanErro>}
                                                                   
                                    <Grid item xs={12} sm={6} md={2}>
                                        <Rotulo>Bandeira</Rotulo>
                                        <Controller
                                            name={`bandeira[${index}]`}
                                            control={control}
                                            render={({ field }) => {
                                                const meio = getValues(`meiopagamento[${index}]`);
                                                const tipo = getValues(`tipopagamento[${index}]`);
                                                const indice = index
                                                const bandeiraFiltered = bandeiraFiltrada(meio, tipo, indice)

                                                return (
                                                    <SelectCustomizado styles={createCrmSelectStyles()}
                                                        {...field}
                                                        options={bandeiraFiltered.length > 1 ? bandeiraFiltered : []}                                                        
                                                        isSearchable
                                                        onChange={(e) => {
                                                            field.onChange(e);
                                                            trigger(`parcelas[${index}]`)
                                                          }}
                                                    />
                                                );
                                            }}
                                        />
                                    </Grid>
                                    {errors.bandeira && typeof errors.bandeira.message === 'string' && <SpanErro>{errors.bandeira.message}</SpanErro>}

                                    <Grid item xs={12} sm={6} md={2}>
                                        <Rotulo>PARCELAS</Rotulo>
                                        <Controller
                                            name={`parcelas[${index}]`}
                                            control={control}
                                            render={({ field }) => {
                                                const meio = getValues(`meiopagamento[${index}]`);
                                                const tipo = getValues(`tipopagamento[${index}]`);
                                                const bandeira = getValues(`bandeira[${index}]`);
                                                const indice = index
                                                const parcelaFiltered = parcelaFiltrada(meio, tipo, bandeira, indice)
                                                return (
                                                    <SelectCustomizado styles={createCrmSelectStyles()}
                                                        {...field}
                                                        options={parcelaFiltered.length > 1 ? parcelaFiltered : []}
                                                        isSearchable
                                                        onChange={(e) => {
                                                            field.onChange(e);
                                                            trigger(`valorcomprador[${index}]`)
                                                          }}
                                                    />
                                                );
                                            }}
                                        />
                                    </Grid>
                                    {errors.parcelas && typeof errors.parcelas.message === 'string' && <SpanErro>{errors.parcelas.message}</SpanErro>}                                                                            

                                     
                                    
                                    <Grid item xs={12} sm={6} md={2}>
                                        <ContainerInput>
                                            <Rotulo>Data Pagamento *</Rotulo>
                                            <InputMaskCustomizado mask="99/99/9999" maskChar={null} {...register(`datavenda[${index}]`, {
                                                pattern: {
                                                    value: /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/(19|20)\d\d$/,
                                                    message: 'Favor digitar uma data válida'
                                                }
                                                /* ,
                                                validate: value => { if (value === '') return true;
                                                    const dateParts = value.split("/");
                                                    const dateObject = new Date(+dateParts[2], dateParts[1] - 1, +dateParts[0]);
                                                    return dateObject <= new Date() || 'A data não pode ser futura';
                                                } */
                                            })} />
                                            {errors.datavenda && typeof errors.datavenda.message === 'string' && <SpanErro>{errors.datavenda.message}</SpanErro>}  
                                        </ContainerInput>
                                    </Grid>                

                                    {/* <Grid item xs={12} md={2}>
                                        <Rotulo>CUPOM</Rotulo>
                                        <Campo type="text" placeholder="" maxLength={30} {...register(`cupom[${index}]`)} />                                
                                    </Grid>  */} 

                                    
                                    <Grid item xs={12} sm={6} md={2}>
                                    <Rotulo>Valor Total Comprador</Rotulo>
                                        <Controller
                                            name={`valorcomprador[${index}]`}
                                            control={control}
                                            rules={{ required: "Campo obrigatório" }}
                                            defaultValue=""
                                            render={({ field: { onChange, value } }) => {
                                                const idTaxa = getValues(`parcelas[${index}]`)    
                                                const indice = index

                                                return (
                                                <NumericFormat                    
                                                value={calculaTotalComprador(idTaxa, indice)}
                                                prefix={"R$ "}
                                                thousandSeparator={"."}
                                                decimalScale={2}
                                                fixedDecimalScale={true}
                                                allowNegative={false}  
                                                decimalSeparator=","   
                                                allowedDecimalSeparators={[".", ","]}
                                                onValueChange={(values) => onChange(values.floatValue)}                               
                                                customInput={Campo}     
                                                readOnly            
                                                style={{backgroundColor: "#f7f1e9"}}
                                            />
                                                );
                                            }}
                                        />
                                        {errors.valorcomprador && typeof errors.valorcomprador.message === 'string' && <SpanErro>{errors.valorcomprador.message}</SpanErro>}
                                    </Grid> 

                                    <Grid item xs={12} sm={6} md={2}>
                                    <Rotulo>Taxa da venda</Rotulo>
                                        <Controller
                                            name={`taxafixaoperadora[${index}]`}
                                            control={control}
                                            rules={{ required: "Campo obrigatório" }}
                                            defaultValue=""
                                            render={({ field: { onChange, value } }) => (
                                                <NumericFormat                    
                                                value={value}
                                                prefix={"R$ "}
                                                thousandSeparator={"."}
                                                decimalScale={2}
                                                fixedDecimalScale={true}
                                                allowNegative={false}  
                                                decimalSeparator=","   
                                                allowedDecimalSeparators={[".", ","]}
                                                onValueChange={(values) => onChange(values.floatValue)}                               
                                                customInput={Campo}     
                                                readOnly            
                                                style={{backgroundColor: "#f7f1e9"}}
                                            />
                                            )}
                                        />
                                        {errors.taxafixaoperadora && typeof errors.taxafixaoperadora.message === 'string' && <SpanErro>{errors.taxafixaoperadora.message}</SpanErro>}
                                    </Grid> 

                                    <Grid item xs={12} sm={6} md={2}>
                                    <Rotulo>Comissão</Rotulo>
                                        <Controller
                                            name={`comissao[${index}]`}
                                            control={control}
                                            rules={{ required: "Campo obrigatório" }}
                                            defaultValue=""
                                            render={({ field: { onChange, value } }) => (
                                                <NumericFormat                    
                                                value={value}
                                                prefix={"R$ "}
                                                thousandSeparator={"."}
                                                decimalScale={2}
                                                fixedDecimalScale={true}
                                                allowNegative={false}  
                                                decimalSeparator=","   
                                                allowedDecimalSeparators={[".", ","]}
                                                onValueChange={(values) => onChange(values.floatValue)}                               
                                                customInput={Campo}     
                                                readOnly            
                                                style={{backgroundColor: "#f7f1e9"}}
                                            />
                                            )}
                                        />
                                        {errors.comissao && typeof errors.comissao.message === 'string' && <SpanErro>{errors.comissao.message}</SpanErro>}
                                    </Grid>                                                                                    
                                                                                  
                                    <Grid item xs={12}>
                                        <AcoesLinha>
                                            <BotaoRemoverLinha onClick={() => removeMeioPagamento(index)}>Remover Linha</BotaoRemoverLinha>
                                        </AcoesLinha>
                                    </Grid>
                                </LinhaItem> 
                                
                            </React.Fragment>   
                            ))}     
                            <Grid container spacing={2} 
                                direction="row"
                                justifyContent="center"
                                alignItems="baseline" 
                                style={{/* backgroundColor: "rgb(53 53 53)", */ 
                                        paddingRight: "15px", 
                                        borderRadius: "5px", 
                                        marginBottom: "20px", 
                                        marginTop: "20px", 
                                        marginLeft: "9px"}}>      

                                                       
                                    <Grid item xs={12} md={3}>
                                        <Rotulo>Total Comprador</Rotulo>
                                        <NumericFormat                    
                                                value={totalComprador}
                                                prefix={"R$ "}
                                                thousandSeparator={"."}
                                                decimalScale={2}
                                                fixedDecimalScale={true}
                                                allowNegative={false}  
                                                decimalSeparator=","   
                                                allowedDecimalSeparators={[".", ","]}                            
                                                customInput={Campo}     
                                                readOnly            
                                                style={{backgroundColor: "#f7f1e9"}}
                                            />                                
                                    </Grid> 
                                    <Grid item xs={12} md={3}>
                                        <Rotulo>Total Taxas</Rotulo>
                                        
                                        <NumericFormat                    
                                                value={totalTaxas}
                                                prefix={"R$ "}
                                                thousandSeparator={"."}
                                                decimalScale={2}
                                                fixedDecimalScale={true}
                                                allowNegative={false}  
                                                decimalSeparator=","   
                                                allowedDecimalSeparators={[".", ","]}                            
                                                customInput={Campo}     
                                                readOnly            
                                                style={{backgroundColor: "#f7f1e9"}}
                                            />                              
                                    </Grid> 
                                    <Grid item xs={12} md={3}>
                                        <Rotulo>Total Comissão</Rotulo>
                                        
                                        <NumericFormat                    
                                                value={totalComissao}
                                                prefix={"R$ "}
                                                thousandSeparator={"."}
                                                decimalScale={2}
                                                fixedDecimalScale={true}
                                                allowNegative={false}  
                                                decimalSeparator=","   
                                                allowedDecimalSeparators={[".", ","]}                            
                                                customInput={Campo}     
                                                readOnly            
                                                style={{backgroundColor: "#f7f1e9"}}
                                            />                            
                                    </Grid>
                            </Grid>      
                        </Grid>                            
                        <BotaoCustomizado>{`${tipo === 'cadastra' ? "Cadastrar" : "Salvar"}`}</BotaoCustomizado>            
                        <pre>{output}</pre>
                    </form>                    
                </BoxCustomizado>
            </Modal >
        </>
    );
}