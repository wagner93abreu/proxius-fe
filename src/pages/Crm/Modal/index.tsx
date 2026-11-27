import createCrmSelectStyles from "../../../styles/crmSelectStyles";
import React, { useState, useEffect } from "react";
import { Checkbox, Grid, Modal, Dialog, DialogTitle, DialogContent, DialogContentText, Button, DialogActions, IconButton, Chip, Stack, Tab, Tabs, FormControlLabel as MuiFormControlLabel } from '@mui/material';
import { Box, CircularProgress } from "@mui/material";
import { AxiosError } from "axios";
import styled, { keyframes } from 'styled-components';
import autenticaStore from "../../../stores/autentica.store";
import http from "../../../http";
import { useForm, Controller } from "react-hook-form";
import InputMask from "react-input-mask";
import Botao from "../../../components/Botao";
import Select from 'react-select';
import IUser from "../../../types/IUser";
import IBodyRequest from "../../../types/IBodyRequest";
import IColumn from "../../../types/IColumn";
import ICard from "../../../types/ICard";
import Alert from '@mui/material/Alert';
import IProduto from "../../../types/IProduto";
import IPrecificacao from "../../../types/IPrecificacao";
import IArquivo from "../../../types/IArquivo";
import IPagamentoNF from "../../../types/IPagamentoNF";
import IClifor from "../../../types/IClifor";
import IUsuario from "../../../types/IUsuario";
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { set } from "mobx";
import Comentarios from "../../../components/Comentarios";
import IComentario from "../../../types/IComentario";
import CloseIcon from "@mui/icons-material/Close";
import ITag from "../../../types/ITag";
import ModalEtiquetas from "../Etiquetas";
import AgendamentoCRM from "../../../components/AgendamentoCRM";
import TarefasCRM from "../../../components/TarefasCRM";
import ProcessoVendasCRM from "../../../components/ProcessoVendasCRM";
import DescricaoCard from "../../../components/DescricaoCard";
import { ThemeProvider } from "@mui/material/styles";
import lightTheme from "../../../styles/lightTheme";
import { mostrarMensagem } from "../../../stores/mensagem.store";

const BoxCustomizado = styled(Box)`
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: min(1280px, 95vw);
    max-height: 90vh;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: rgba(20, 20, 20, 0.25) #ffffff;
    background-color: #ffffff;
    border-radius: 20px;
    padding: 24px;
    box-sizing: border-box;
    border: 1px solid rgba(20, 20, 20, 0.12);
    box-shadow: 0 24px 60px rgba(20, 20, 20, 0.18);
    color: #242424;

    @media (max-width: 768px) {
        width: 95vw; 
    }

`;

const SpanErro = styled.span`
    float: left;
    color: #303030;
    font-size: 14px;
    margin-top: -25px;
`

const Campo = styled.input`
    color: #242424;
    font-size: 15px;
    background:#ffffff;
    margin-top: 3px;
    margin-bottom: 0px;
    box-sizing: border-box;
    box-shadow: 0 4px 16px rgba(20, 20, 20, 0.04);
    border-radius: 10px;
    border: 1px solid rgba(20, 20, 20, 0.2);
    width: 100%;
    padding: 10px;
    &:focus-visible { outline: 2px solid #141414; outline-offset: 1px; }
    &::placeholder { color: #666666; }
`

const Rotulo = styled.label`
    display: block;
    font-weight: 700;
    font-size: 16px;
    line-height: 19px;
    color: #242424
`

const InputMaskCustomizado = styled(InputMask)`
    color: #242424;
    font-size: 15px;
    background:#ffffff;
    margin-top: 3px;
    margin-bottom: 0px;
    box-sizing: border-box;
    box-shadow: 0 4px 16px rgba(20, 20, 20, 0.04);
    border-radius: 10px;
    border: 1px solid rgba(20, 20, 20, 0.2);
    width: 100%;
    padding: 10px;
    &:focus-visible { outline: 2px solid #141414; outline-offset: 1px; }
    &::placeholder { color: #666666; }
`

const BotaoCustomizado = styled(Botao)`
    width: 50%;
    display: block;
    margin: 0 auto;
    background: #141414;
    border: 1px solid transparent;
    border-radius: 10px;
    color: #ffffff;
    &:hover { background: #383838; }
    box-shadow: 0 4px 16px rgba(20, 20, 20, 0.04);
    cursor: pointer;    
`
const BotaoDownload = styled.button`
    background-color: #141414;
    border-radius: 10px;
    padding: 5px 9px;
    color: var(--branco);
    border: 1px solid #141414;
    margin-top: 5px;
    font-weight: 700;
    line-height: 19px;
    &:hover {
        background-color: #383838;
    }
    &:active{
        border: 1px solid #141414;
    }
`

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
`;

const BotaoCustom = styled.button`
  font-size: 14px;
  font-weight: 500;
  background-color: #141414;
  color: #ffffff;
  padding: 8px 16px;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  &:hover { background: #383838; }
  box-shadow: 0 4px 16px rgba(20, 20, 20, 0.04);
`;

const SelectCustomizado = styled(Select)`
 margin-top: 3px;
`;


  const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

const fadeOut = keyframes`
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
`;

interface FloatingAlertProps {
  show: boolean;
}

const Badge = styled.div`
    color: #242424;
    background-color: #777777;
    width: fit-content;
    font-size: 12px;
    padding: 4px 8px;
    border-radius: 7px;
    margin-top: 2px;
`

const FloatingAlert = styled(Alert)<FloatingAlertProps>`
  position: absolute;
  top: 0px;
  left: 120px;
  transform: translateX(-50%);
  z-index: 40000;
  width: 100%;
  max-width: 230px;
  animation: ${({ show }) => (show ? fadeIn : fadeOut)} 0.5s forwards;
`;

const buildPublicCadastroLink = (cardId: string | number, produto: { value: number; label: string }, preco: { value: number; label: string }) => {
        const params = new URLSearchParams({
                cardId: String(cardId),
                produtoId: String(produto.value),
                produto: produto.label,
                precoId: String(preco.value),
                preco: preco.label,
        });

        return `${window.location.origin}/checkout?${params.toString()}`;
};


export default function ModalCRM({ open, handleClose, dados, colunas, arquivado}: { open: boolean, handleClose: () => void, dados: ICard, colunas: IColumn[], arquivado: boolean}) {
    const {register, handleSubmit, reset, formState:{errors}, setValue, control, getValues, trigger} = useForm({ mode: 'onSubmit'});
    //const [index, setIndex] = useState(0);      
    const [dadosCard, setDadosCard] = useState<ICard>()
    const [arquivos, setArquivos] = useState<IArquivo[]>([]);
    const {usuario} = autenticaStore;
    const [colaboradores, setColaboradores] = useState<IUser[]>([]); 
    const [produtos, setProdutos] = useState<IProduto[]>([]);
    const [precificacao, setPrecificacao] = useState<IPrecificacao[]>([]);
    const [linksPgto, setLinksPgto] = useState<IPrecificacao[]>([]);
    const [linkselected, setLinkSelected] = useState("");
    const [loading, setLoading] = useState(false);
    const [fileToRemove, setFileToRemove] = useState<number | null>(null);
    const [openFileConfirm, setOpenFileConfirm] = useState(false);
    const [openRemoveCardConfirm, setOpenRemoveCardConfirm] = useState(false);
    const [openComentarios, setOpenComentarios] = useState(false);
    const [comentariosOrigemTipo, setComentariosOrigemTipo] = useState<"CARD" | "PLANEJAMENTO">("CARD");
    const [sessaoOptions, setSessaoOptions] = useState<{ value: string; label: string }[]>([]);
    const [showAlert, setShowAlert] = useState(false);
    const [atualizaCard, setAtualizaCard] = useState(false);
    const [vendas, setVendas] = useState<IPagamentoNF[]>([])
    const [statusSelecionado, setStatusSelecionado] = useState<{value: number; label: string}>({value: 0, label: ''});
    const [produtoSelecionado, setProdutoSelecionado] = useState<{value: any; label: string}>({value: 0, label: ''});
    const [precoSelecionado, setPrecoSelecionado] = useState<{value: any; label: string}>({value: 0, label: ''});
    const [vendaSelecionada, setVendaSelecionada] = useState<{value: any; label: string}>({value: 0, label: ''});
    const [clienteId, setClienteId] = useState<number | null>(null);
    const [linkDrive, setLinkDrive] = useState<string>('');
    const [papel, setPapel] = useState<string | null>(null);
    const isAtendimento = papel === 'ATENDIMENTO';
    const usuarioIdAtual = localStorage.getItem('userID') || "";
    const usuarioNomeAtual = usuario.login;
    const [senhaGerada, setSenhaGerada] = useState<string | null>(null);
    const [openUsuarioInfo, setOpenUsuarioInfo] = useState(false);
    const [openUsuarioInfoConfirmClose, setOpenUsuarioInfoConfirmClose] = useState(false);
    const [usuarioInfoNome, setUsuarioInfoNome] = useState("");
    const [usuarioInfoEmail, setUsuarioInfoEmail] = useState("");
    const [criandoUsuario, setCriandoUsuario] = useState(false);
    const [openCriarUsuarioConfirm, setOpenCriarUsuarioConfirm] = useState(false);
    const [tagsDisponiveis, setTagsDisponiveis] = useState<ITag[]>([]);
    const [tagsSelecionadas, setTagsSelecionadas] = useState<number[]>([]);
    const [openSelecionarTags, setOpenSelecionarTags] = useState(false);
    const [openEditarEtiquetas, setOpenEditarEtiquetas] = useState(false);
    const [crmAbaAtiva, setCrmAbaAtiva] = useState<"tarefas" | "agendamento" | "processoVendas">("tarefas");

    const generateRandomPassword = () => {
        const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
        const numbers = "0123456789";
        const all = letters + numbers;
        let pwd = "";
        pwd += letters[Math.floor(Math.random() * letters.length)];
        pwd += numbers[Math.floor(Math.random() * numbers.length)];
        for (let i = 0; i < 8; i++) {
            pwd += all[Math.floor(Math.random() * all.length)];
        }
        return pwd
            .split("")
            .sort(() => Math.random() - 0.5)
            .join("")
            .slice(0, 10);
    };

    const buildWelcomeMessage = (nomeCliente: string, emailCliente: string, senha: string) => {
        return `Olá, ${nomeCliente}\n\nSeja bem-vindo ao sistema RH Integrado: uma nova experiência para os nossos clientes!!\n\nAcesse pelo seguinte endereço:\nhttps://rhintegrado.com.br/\n\nLogin: ${emailCliente}\nSenha: ${senha}\n\nNão esqueça de alterar a senha após o primeiro acesso!`;
    };

    function formataMoeda(valor: number): string {
        return valor.toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        });
      }

    const axiosConfig = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${usuario.token}`,
        },
    };

    const parseTagsString = (tagsValue: any): number[] => {
        if (!tagsValue) return [];
        try {
            const parsed = JSON.parse(tagsValue);
            if (Array.isArray(parsed)) {
                return parsed.map((v) => Number(v)).filter((v) => !Number.isNaN(v));
            }
            return [];
        } catch {
            return [];
        }
    };

    const stringifyTags = (ids: number[]) => JSON.stringify(ids);

    const fetchTagsDisponiveis = async () => {
        try {
            const { data } = await http.get<ITag[]>(`tag`, axiosConfig);
            setTagsDisponiveis(data || []);
        } catch (erro) {
            mostrarMensagem(erro, "error");
        }
    };

    const salvarTags = async (ids: number[]) => {
        const tagsString = stringifyTags(ids);
        setTagsSelecionadas(ids);
        setValue('tags', tagsString);
        onInputblur({ id: dados.id, tags: tagsString });
    };

    const handleRemoveTag = async (id: number) => {
        const novos = tagsSelecionadas.filter((t) => t !== id);
        await salvarTags(novos);
    };

    const handleCriarUsuarioCliente = async () => {
        if (!clienteId) {
            mostrarMensagem("Cliente não definido para criar usuário.", "warning");
            return;
        }

        const nomeCliente = getValues("nome") || dadosCard?.nome || "Cliente";
        const emailCliente = getValues("email") || dadosCard?.email || "";

        if (!emailCliente) {
            mostrarMensagem("Informe um e-mail para criar o usuário do cliente.", "warning");
            return;
        }

        const senha = generateRandomPassword();
        setCriandoUsuario(true);

        try {
            const user: IUsuario = {
                login: emailCliente,
                email: emailCliente,
                password: senha,
                nome: nomeCliente,
                papel: "CLIENTE",
                active: true,
            };

            const { data } = await http.post(`usuarios`, user, axiosConfig);
            const novoUsuarioId = (data as any)?.idusuario ?? (data as any)?.id ?? (data as any)?.idUsuario;

            if (!novoUsuarioId) {
                mostrarMensagem("Não foi possível obter o ID do usuário criado.", "error");
                return;
            }

            const clientefornecedor: Partial<IClifor> = {
                id: clienteId,
                idusuario: novoUsuarioId,
            };

            await http.put("clifor", clientefornecedor, axiosConfig);

            setSenhaGerada(senha);
            setUsuarioInfoNome(nomeCliente);
            setUsuarioInfoEmail(emailCliente);
            setOpenUsuarioInfo(true);
        } catch (erro) {
            const axiosErr = erro as AxiosError<any>;
            const backendMessage = axiosErr?.response?.data;
            const readableMessage =
                (typeof backendMessage === "string" && backendMessage) ||
                (backendMessage?.message as string) ||
                (backendMessage?.error as string) ||
                axiosErr.message;

            mostrarMensagem(readableMessage ? `ERRO: ${readableMessage}` : "Erro ao criar usuário.", "error");
        } finally {
            setCriandoUsuario(false);
        }
    };

    const handleConfirmCriarUsuario = async () => {
        setOpenCriarUsuarioConfirm(false);
        await handleCriarUsuarioCliente();
    };

    const handleOpenCriarUsuarioConfirm = () => setOpenCriarUsuarioConfirm(true);
    const handleCloseCriarUsuarioConfirm = () => setOpenCriarUsuarioConfirm(false);

    const handleCopyWelcomeText = async () => {
        if (!senhaGerada || !usuarioInfoEmail) return;
        const text = buildWelcomeMessage(usuarioInfoNome || "Cliente", usuarioInfoEmail, senhaGerada);
        try {
            await navigator.clipboard.writeText(text);
        } catch {
            const textarea = document.createElement("textarea");
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand("copy");
            document.body.removeChild(textarea);
        }
    };

    const handleRequestCloseUsuarioInfo = () => {
        setOpenUsuarioInfoConfirmClose(true);
    };

    const handleConfirmCloseUsuarioInfo = () => {
        setOpenUsuarioInfo(false);
        setOpenUsuarioInfoConfirmClose(false);
        setSenhaGerada(null);
    };

    const handleCancelCloseUsuarioInfo = () => {
        setOpenUsuarioInfoConfirmClose(false);
    };

    const fetchSessaoOptions = async () => {
        if (!dados?.id) return;
        try {
            const { data } = await http.get<IComentario[]>(`comentario/filter?origemTipo=PLANEJAMENTO&origemId=${dados.id}`, axiosConfig);
            const opts = (data || [])
                .slice()
                .sort((a, b) => (a.descricao || "").localeCompare(b.descricao || "", undefined, { sensitivity: "base" }))
                .map((c) => ({ value: c.id, label: c.descricao }));
            setSessaoOptions(opts);
        } catch (erro) {
            mostrarMensagem(erro, "error");
        }
    };

    useEffect(() => {
        if (!usuario.token) return;
        http.get<IUser>(`usuarios/${localStorage.getItem('userID')}`, axiosConfig)
        .then(resposta => {
            setPapel(resposta.data.papel);
        })
        .catch(erro => {
            mostrarMensagem(erro, "error");
        });
    }, [usuario.token]);

    useEffect(() => {
        if (open) {
            setCrmAbaAtiva("tarefas");
            fetchSessaoOptions();
            fetchTagsDisponiveis();
        }
    }, [open, dados.id]);

    const getCurrentDate = (): string => {
        const currentDate = new Date();
        return `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
      };
      
    const getDate31DaysAgo = (): string => {
    const date31DaysAgo = new Date();
    date31DaysAgo.setDate(date31DaysAgo.getDate() - 31);
    return `${date31DaysAgo.getFullYear()}-${String(date31DaysAgo.getMonth() + 1).padStart(2, '0')}-${String(date31DaysAgo.getDate()).padStart(2, '0')}`;
    };
    
      const agruparPagamentos = (vendas: IPagamentoNF[]) => {
        //console.log("ENTROU AGRUPAR PAGAMENTOS")
        const agrupados: { [key: string]: IPagamentoNF } = {};
        let ttlComprador = 0;
        let ttlBase = 0;
        let ttlTaxas = 0;
        let ttlComissao = 0;
        vendas.forEach(pagamento => {
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
    
        return Object.values(agrupados).map(dado => ({
          ...dado,
          value: dado.pagamentoId,
          label: `${dado.cpfcnpj} - ${dado.nomecomercial} ${dado.nomesocial} - ${dado.produto.includes(" - ") ? dado.produto.split(" - ")[1] : dado.produto}`, 
          /* label: `${dado.cpfcnpj} - ${dado.nomecomercial} ${dado.nomesocial} - ${dado.produto.split(" - ")[1]} - ${formataMoeda(dado.valorbase)}`, */
          valorcomprador: formataMoeda(dado.valorcomprador), // Formata valorcomprador
          valorbase: formataMoeda(dado.valorbase), // Formata valorbase
          taxas: formataMoeda(dado.taxas), // Formata taxas
          comissao: formataMoeda(dado.comissao), // Formata comissao
          datapagamento: new Date(dado.datapagamento).toLocaleDateString('pt-BR'),
          datavenda: new Date(dado.datavenda).toLocaleDateString('pt-BR')
        }));
      };

    useEffect(() => {
        if(open){
            if(vendas.length === 0){
                let startDate = getDate31DaysAgo();
                let endDate = getCurrentDate();
                //console.log("DATAS: " + startDate + " - " + endDate)
                
                http.get<IPagamentoNF[]>(`venda/filtrarPorData?startDate=2024-01-01&endDate=${endDate}`, axiosConfig)
                .then(resposta => {
                    const dadosAgrupados = agruparPagamentos(resposta.data);            
                    setVendas(dadosAgrupados);
                    

                    let vendasFormatadas = dadosAgrupados.map(dado => ({
                        value: dado.pagamentoId,
                        label: dado.label
                    }));

                    //console.log("--------------VENDA SELECIONADA-----------")
                    //console.log(dados)
                    //console.log(vendasFormatadas)
                    setVendaSelecionada(vendasFormatadas.filter(p => p.value === dados.venda)[0])
                })
                .catch(erro => {
                    mostrarMensagem(erro, "error");
                });  
            } 

            if(produtos.length === 0){
                http.get<IBodyRequest<IProduto>>('produtos?size=500', axiosConfig)
                .then(resposta => {
                    setProdutos(resposta.data.content.filter(produto => produto.active))   
                    //console.log("--------------PRODUTO SELECIONADO-----------")      
                    let prod = resposta.data.content
                    let formatados = prod.map(produto => ({
                        value: produto.id,
                        label: produto.nome
                    }))
                    setProdutoSelecionado(formatados.filter(p => p.value == dados.produtoId)[0])
                })
                .catch(erro => {
                    mostrarMensagem(erro, "error")
                })
            }

            if(precificacao.length === 0){
                http.get<IBodyRequest<IPrecificacao>>(`precificacao?size=500`, axiosConfig)
                .then(resposta => {
                    setPrecificacao(resposta.data.content.filter(precifica => precifica.active))
                    let prec = resposta.data.content
                    setLinksPgto(prec)
                    //console.log("PRECIFICACAO")
                    //console.log(prec)
                    let formatados = prec.map(precifica => ({
                        value: precifica.id,
                        label: precifica.cupom + " - " + formataValor(precifica.moeda, precifica.valor)
                    }))
                    setPrecoSelecionado(formatados.filter(p => p.value == dados.precoId)[0])
                })
                .catch(erro => {
                    mostrarMensagem(erro, "error")
                }) 
            }

            if(colaboradores.length === 0){
                http.get<IBodyRequest<IUser>>(`usuarios?size=500`, axiosConfig)
                .then(resposta => { 
                    setColaboradores(resposta.data.content.filter(usuarios => usuarios.active && usuarios.papel !== 'CLIENTE'))
                })
                .catch(erro => {
                    mostrarMensagem(erro, "error")
                })  
            }            
        }        
    
      }, [open, showAlert, handleClose]);

      useEffect(() => {
        http.get<ICard>(`card/${dados.id}`, axiosConfig)
            .then(resposta => {

                let colunasFormatadas = colunas.map(column => ({
                    value: column.id,
                    label: column.tipo + " - " + column.name
                }));                
                setStatusSelecionado(colunasFormatadas.filter(c => c.value == resposta.data.statusId)[0])
                setValue('status', colunasFormatadas.filter(c => c.value == resposta.data.statusId)[0])
                //console.log("RESPOSTA")
                //console.log(resposta)
                setValue('atendente', {value: resposta.data.atendenteId, label: resposta.data.atendente})
                setValue('nome', resposta.data.nome)    
                setValue('lastUpdate', resposta.data.lastStatusUpdate)
                setValue('cardID', resposta.data.id)
                setValue('status', resposta.data.statusId)
                setValue('email', resposta.data.email)
                setValue('linkedin', resposta.data.linkedin)
                setValue('instagram', resposta.data.instagram)
                setValue('telefone', resposta.data.telefone != null ? resposta.data.telefone : "") 
                setValue('produto', resposta.data.produto)
                setValue('preco', resposta.data.preco)
                setValue('objetivo', resposta.data.objetivo) 
                setValue('descricao', resposta.data.descricao)
                setValue('tags', resposta.data.tags)
                setValue('cliente', resposta.data.cliente)
                setValue('venda', resposta.data.venda)
                setValue('linkPgto', resposta.data.linkPgto)
                setValue('linkCadastroPublico', resposta.data.linkCadastroPublico ?? '')
                setClienteId(resposta.data.cliente ?? null)
                const parsedTags = parseTagsString(resposta.data.tags);
                setTagsSelecionadas(parsedTags);
                setValue('tags', resposta.data.tags || "")
                setArquivos(resposta.data.arquivos)
                setValue('comoConheceu', resposta.data.comoConheceu)
                setValue('comoConheceuDetalhamento', resposta.data.comoConheceuDetalhamento)
                console.log("ATUALIZANDO DADOS")
                setDadosCard(resposta.data)
                //console.log(resposta.data.arquivos)
                

            })
            .catch(erro => {
                mostrarMensagem(erro, "error");
            });

      }, [atualizaCard]);

            useEffect(() => {
                fetchLinkDrive(clienteId);
                // eslint-disable-next-line react-hooks/exhaustive-deps
            }, [clienteId]);

      const vendasFormatadas = vendas.map(dado => ({
        value: dado.pagamentoId,
        label: `${dado.cpfcnpj} - ${dado.nomecomercial} ${dado.nomesocial} - ${dado.produto.includes(" - ") ? dado.produto.split(" - ")[1] : dado.produto}`
        /* label: `${dado.cpfcnpj} - ${dado.nomecomercial} ${dado.nomesocial} - ${dado.produto.includes(" - ") ? dado.produto.split(" - ")[1] : dado.produto} - ${formataMoeda(dado.valorbase)}` */
      }));

    const colaboradoresFormatados = colaboradores.map(colaborador => ({
        value: colaborador.id,
        label: colaborador.nome
    }));

      const confirmRemoveFile = async () => {
        if (fileToRemove !== null) {
          let i = fileToRemove;
          let fileId = getValues(`id[${i}]`);
          const arquivoId = getValues(`fileId[${i}]`);
          const fileName = getValues(`fileName[${i}]`);

          if (fileId != ""){
            try {
                const response = await http.delete(`file/delete/${dados.id}/${arquivoId}/${fileName}`, axiosConfig);
                //console.log('Tarefa deletada com sucesso:', response.data);
                setValue(`fileId[${i}]`, "");
                setValue(`fileName[${i}]`, "");
                setValue(`fileData[${i}]`, "");
        
                setArquivos(arquivos.filter((_, index) => index !== i));
                //console.log("ENTROU NO REMOVE FILE")
                setShowAlert(true);
                setTimeout(() => setShowAlert(false), 3000);
              } catch (erro) {
                mostrarMensagem(erro, "error");
              }
          }else{
            setArquivos(arquivos.filter((_, index) => index !== i));
            //console.log("ENTROU NO REMOVE FILE ELSE")
            setShowAlert(true);
            setTimeout(() => setShowAlert(false), 3000);
        }
        }
        handleCloseFileConfirm();
      };

      const confirmRemoveCard = () => {

        http.delete<ICard[]>(`card/${dados.id}`, axiosConfig)
        .then(resposta => {
          
          console.log("CARD REMOVIDO COM SUCESSO")
          mostrarMensagem("Card removido com sucesso", "success")
          handleCloseFileConfirm()
          handleClose()
          //console.log(resposta.data)
          
        })
        .catch(erro => {
          mostrarMensagem(erro, "error");
        });
        
      };

      const onSubmit = (data: any) => {
        //console.log(data);
      };

      const onInputblur = (inputData: object) => {
        //console.log("O QUE FOI?")
        //console.log(inputData)
        setLoading(true);
        http.put(`card`,inputData ,axiosConfig)
        .then(resposta => {       
            setShowAlert(true);
            setTimeout(() => setShowAlert(false), 3000);
        })
        .catch(erro => {            
            mostrarMensagem("ERRO integracao: " + erro, "error")

        })    
        .finally(() => setLoading(false)); 
      };

            const fetchLinkDrive = async (cliente: number | null) => {
                if (!cliente) {
                        setLinkDrive('');
                        setValue('linkDrive', '');
                        return;
                }
                try {
                        const { data } = await http.get<IClifor>(`clifor/${cliente}`, axiosConfig);
                        const drive = (data as any).linkDrive ?? '';
                        setLinkDrive(drive || '');
                        setValue('linkDrive', drive || '');
                } catch (erro) {
                        mostrarMensagem(erro, "error");
                }
            };

            const handleLinkDriveBlur = async (value: string) => {
                if (!clienteId) {mostrarMensagem("Cliente não definido", "warning"); return;}
                try {
                        await http.put(`clifor`, { id: clienteId, linkDrive: value }, axiosConfig);
                        setShowAlert(true);
                        setTimeout(() => setShowAlert(false), 3000);
                } catch (erro) {
                        mostrarMensagem(erro, "error");
                }
            };

            const handleOpenAreaClienteAtendente = () => {
                const codCliente = getValues('cliente') || clienteId;
                if (!codCliente) {
                        mostrarMensagem("Cliente nao definido", "warning");
                        return;
                }
                const url = `${window.location.origin}/AreaClienteAtendente/${encodeURIComponent(String(codCliente))}`;
                window.open(url, "_blank", "noopener,noreferrer");
            };

      const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        //console.log("---------- OBJETO ARQUIVO -----------------");
        //console.log(e.target.files);
        if (e.target.files && e.target.files.length > 0) {
          const file = e.target.files[0];
          const formData = new FormData();
          formData.append('file', file);
          formData.append('card', dados.id);
      
          const axiosConfig = {
            headers: {
              'Content-Type': 'multipart/form-data',
              'Authorization': `Bearer ${usuario.token}`,
            },
          };
      
          http.post(`file/upload`, formData, axiosConfig)
            .then(resposta => {       
              //console.log('--------------------upload concluido-----------------');   
              //console.log(resposta);
              mostrarMensagem("Arquivo enviado com sucesso", "success");
              setShowAlert(true);
              setTimeout(() => setShowAlert(false), 3000);
            })
            .catch(erro => {            
              mostrarMensagem("ERRO:" + erro, "error");
            });
        }
      };

      const precificacaoFormatados = (filtro: any) =>{
        
        if(filtro === "" || filtro == undefined) return []
        
        let filtrado = precificacao.filter(precifica => precifica.idproduto === filtro.value)
 
        
        let precifica = filtrado.map(precifica => ({
            value: precifica.id,
            label: precifica.cupom + " - " + formataValor(precifica.moeda, precifica.valor)
        }));
        
        return precifica        
    }

    const formataValor = (moeda: string, valor: string | number) => {
        if(moeda === "REAL") return `R$ ${valor.toLocaleString('pt-br', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        if(moeda === "DOLAR") return `U$ ${valor.toLocaleString('pt-br', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        if(moeda === "EURO") return `€ ${valor.toLocaleString('pt-br', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`        
    }

    const handleOpenFileConfirm = (index: number) => {
        setFileToRemove(index);
        setOpenFileConfirm(true);
    };
    const handleCloseFileConfirm = () => {
        setFileToRemove(null);
        setOpenFileConfirm(false);
    };

    const handleOpenRemoveCardConfirm = () => {
        setOpenRemoveCardConfirm(true);
    };
    const handleCloseRemoveCardConfirm = () => {
        setOpenRemoveCardConfirm(false);
    };

    const handleDownloadFile = (index: number) => {
        const arquivoId = getValues(`fileId[${index}]`);
        const fileName = getValues(`fileName[${index}]`);
      
        http.get(`file/download/${dados.id}/${arquivoId}/${fileName}`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${usuario.token}`,
          },
          responseType: 'blob', // Importante para obter o arquivo como um blob
        })
        .then(resposta => {
          // Cria um link temporário para o blob do arquivo
          const url = window.URL.createObjectURL(new Blob([resposta.data]));
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', fileName); // Define o nome do arquivo
          document.body.appendChild(link);
          link.click();
          link.remove();
          window.URL.revokeObjectURL(url); // Libera o objeto URL
      
          //console.log("Download efetuado com sucesso!");
        })
        .catch(erro => {
          mostrarMensagem(erro, "error");
        });
      };
      
      const formatDate = (dateString: string | null): string => {
        if (!dateString) {
          return "";
        }
        // Verifica se a data está no formato YYYY-MM-DDTHH:mm:ss
        const regex = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})$/;
        const match = dateString.match(regex);
      
        if (!match) {
          throw new Error("Formato de data inválido");
        }
      
        const year = match[1];
        const month = match[2];
        const day = match[3];
      
        // Retorna a data no formato DD/MM/YYYY
        return `${day}/${month}/${year}`;
      };

      const objetivoOptions = [
        { value: 'recolocacao', label: 'Recolocação' },
        { value: 'troca_de_emprego', label: 'Troca de Emprego' },
        { value: 'transicao_de_carreira', label: 'Transição de Carreira' },
        { value: 'empregabilidade', label: 'Empregabilidade' },
        { value: 'direcionamento_de_carreira', label: 'Direcionamento de Carreira' },
        { value: 'trainee', label: 'Trainee' },
        { value: 'promocao', label: 'Promoção' },
        { value: 'empreendedorismo', label: 'Empreendedorismo' },
        { value: 'consultoria_empresarial', label: 'Consultoria Empresarial' },
        { value: 'personalizado', label: 'Personalizado' },
      ];

      const comoConheceuOptions = [
        { value: 'indicacao', label: 'Indicação de Amigo' },
        { value: 'linkedin', label: 'LinkedIn' },
        { value: 'instagram', label: 'Instagram' },
        { value: 'anuncios', label: 'Anúncios' },
        { value: 'eventos', label: 'Eventos' },
        { value: 'tiktok', label: 'TikTok' },
        { value: 'youtube', label: 'Youtube' },
        { value: 'outros', label: 'Outros' },
      ];

      const blankProductOption = { value: 0, label: '' };
      const blankSaleOption = { value: 0, label: '' };
    const clientePreenchido = !!clienteId;

   
    return (
        <ThemeProvider theme={lightTheme}>
                {showAlert && (
                <FloatingAlert show={showAlert} variant="filled" severity="success">
                    Card atualizado com Sucesso!
                </FloatingAlert>
                )}     
                 
            <Modal
                open={open}
                onClose={handleClose}
                aria-labelledby="crm-card-titulo"
            >
                
                <BoxCustomizado role="dialog" aria-labelledby="crm-card-titulo">
                  
                {/* {loading && (
                <Overlay>
                    <CircularProgress color="primary" size="5rem"/>
                </Overlay>
                )} */}  
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <Grid item xs={12}>
                            <Box display="flex" alignItems="center" position="relative">
                                <h2 id="crm-card-titulo" style={{flex: 1, color: "#141414", margin: 0}}>Cliente/Lead</h2>
                                <IconButton aria-label="Fechar card" onClick={handleClose} sx={{ color: "#141414" }}>
                                    <CloseIcon />
                                </IconButton>
                                {/* {clientePreenchido && (
                                    <Box position="absolute" right={0} top={-6}>
                                        <BotaoCustomizado
                                            style={{ width: "auto", padding: "6px 12px" }}
                                            onClick={handleOpenCriarUsuarioConfirm}
                                            disabled={criandoUsuario}
                                        >
                                            Criar usuário
                                        </BotaoCustomizado>
                                    </Box>
                                )} */}
                            </Box>
                        </Grid>
                        <Grid container spacing={2}>
                        <Grid item xs={12}>
                            
                            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                {tagsSelecionadas.length === 0 && (
                                    <span style={{ color: '#141414' }}>Nenhuma tag selecionada</span>
                                )}
                                {tagsSelecionadas.map((tagId) => {
                                    const tag = tagsDisponiveis.find((t) => t.id === tagId);
                                    return (
                                        <Chip
                                            key={tagId}
                                            label={tag?.name || `Tag ${tagId}`}
                                            onDelete={() => handleRemoveTag(tagId)}
                                            deleteIcon={<CloseIcon sx={{ color: '#242424' }} />}
                                            sx={{
                                                backgroundColor: '#ededed',
                                                color: '#242424',
                                                fontWeight: 400,
                                                borderRadius: '4px',
                                                fontSize:'10',
                                                '& .MuiChip-deleteIcon': { color: '#242424', opacity: 0.8 },
                                                '&:hover': {
                                                    backgroundColor: '#d8d8d8',
                                                },
                                            }}
                                        />
                                    );
                                })}
                                <Button
                                    variant="outlined"
                                    color="primary"
                                    size="small"
                                    onClick={() => setOpenSelecionarTags(true)}
                                    sx={{ borderColor: '#141414', color: '#141414' }}
                                >
                                    Selecionar tags
                                </Button>
                            </Stack>
                        </Grid>
                            <Grid item xs={6} md={3}>
                                <Rotulo>Atendente</Rotulo>                                
                                <Controller
                                    name="atendente"
                                    control={control}
                                    render={({ field }) => (
                                        <SelectCustomizado
                                        {...field}
                                        value={field.value}
                                        options={colaboradoresFormatados}
                                        onChange={(e: any) => {
                                            field.onChange(e);
                                            let card = {
                                                id: dados.id,
                                                atendenteId: e.value,
                                                atendente: e.label,
                                                fotoAtendente: e.value + "/foto_perfil.png"
                                            }
                                            onInputblur(card)
                                        }}
                                        isSearchable
                                        styles={createCrmSelectStyles()}
                                        />
                                    )}
                                    />                                                             
                            </Grid> 
                            <Grid item xs={6} md={3}>
                                <Rotulo>Etapa</Rotulo>                                
                                <Controller
                                    name="status"
                                    control={control}                                    
                                    render={({ field }) => (
                                        <SelectCustomizado
                                        {...field}                                        
                                        value={statusSelecionado}
                                        options={colunas
                                            .filter(column => column.tipo === 'leads' || column.tipo === 'clientes' || column.tipo === 'arquivado' || column.tipo === 'parceiros')
                                            .map(column => ({
                                              value: column.id,
                                              label: column.tipo + " - " + column.name
                                            }))}
                                        onChange={(newValue: any) => {
                                            field.onChange(newValue);
                                            let card = {
                                                id: dados.id,                                                
                                                statusId: newValue.value,
                                            }
                                            onInputblur(card)
                                            setStatusSelecionado(newValue)
                                        }}
                                        isSearchable
                                        styles={createCrmSelectStyles()}
                                        />
                                    )}
                                />                                                                
                            </Grid> 
                            <Grid item xs={3} md={1}>
                            <Rotulo>Cliente</Rotulo>
                            <Campo type="text" placeholder="" readOnly {...register('cliente')}  />
                            </Grid>

                            
                                                        
                            <Grid item xs={6} md={2}>
                                <Rotulo>Ultimo Update</Rotulo>
                                <Campo type="text" readOnly {...register('lastUpdate')} />
                            </Grid> 
                            <Grid item xs={6} md={3}>
                                <Rotulo>ID</Rotulo>
                                <Campo type="text" readOnly {...register('cardID')} />
                            </Grid>

                            <Grid item xs={12} md={6}>                                                                                     
                                <Rotulo>Nome *</Rotulo>                                
                                <Campo type="text" placeholder="" maxLength={100} {...register('nome',{
                                onBlur: (e) => {
                                    let card = {
                                        id: dados.id,
                                        nome: e.target.value                                        
                                    }
                                    onInputblur(card)
                                },
                                required: 'Campo obrigatório',
                                minLength: {
                                    value: 3,
                                    message: 'Deve ter no mínimo 3 caracteres'
                                },
                                maxLength: {
                                    value: 100,
                                    message: 'Deve ter no máximo 100 caracteres'
                                }
                                })} />
                                 {errors.nome && typeof errors.nome.message === 'string' && <SpanErro>{errors.nome.message}</SpanErro>}                         
                            </Grid>   

                            <Grid item xs={12} md={6}>
                                <Rotulo>Contato</Rotulo>
                                <Campo type="text" placeholder="" maxLength={2000} {...register('descricao', {
                                    onBlur: (e) => {
                                        if (e.target.value !== dadosCard?.descricao) {
                                            const card = {
                                                id: dados.id,
                                                descricao: e.target.value
                                            };
                                            onInputblur(card);
                                        }
                                    }
                                })} />
                            </Grid>

                            <Grid item xs={6} md={3}>
                                <Rotulo>E-mail</Rotulo>                                
                                <Campo type="text" placeholder="" maxLength={100} {...register('email', {
                                onBlur: (e) => {
                                    let card = {
                                        id: dados.id,
                                        email: e.target.value                                        
                                    }
                                    onInputblur(card)
                                },

                                }
                                )} />
                            </Grid>    

                           {/*  <Grid item xs={6} md={3}>
                                <Rotulo>Telefone</Rotulo>                                
                                <InputMaskCustomizado mask="(99) 99999-9999" maskChar={null} {...register('telefone', {
                                        onBlur: (e) => {
                                            let card = {
                                                id: dados.id,
                                                telefone: e.target.value                                        
                                            }
                                            onInputblur(card)
                                        },
                                        minLength: {
                                        value: 14,
                                        message: `Favor digitar um telefone válido`
                                        }})} />
                            </Grid>   */}  

                            <Grid item xs={6} md={3}>
                                <Rotulo>Telefone</Rotulo>
                                <Controller
                                    name="telefone"
                                    control={control}
                                    render={({ field }) => (
                                        <PhoneInput
                                            {...field}
                                            country={'br'}
                                            value={field.value}
                                            onBlur={() => {
                                                let card = {
                                                    id: dados.id,
                                                    telefone: field.value
                                                };
                                                onInputblur(card);
                                            }}
                                            inputStyle={{ width: '100%', height: 40, borderRadius: 10, borderColor: 'rgba(20, 20, 20, 0.2)', backgroundColor: '#ffffff', color: '#242424' }}
                                            buttonStyle={{ borderColor: 'rgba(20, 20, 20, 0.2)', backgroundColor: '#ffffff', borderRadius: '10px 0 0 10px' }}
                                            dropdownStyle={{ backgroundColor: '#ffffff', color: '#242424' }}
                                            specialLabel=""
                                        />
                                    )}
                                />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <Rotulo>LinkedIn</Rotulo>
                                <Campo type="text" placeholder="" maxLength={200} {...register('linkedin',{
                                    onBlur: (e) => {
                                        let card = {
                                            id: dados.id,
                                            linkedin: e.target.value                                        
                                        }
                                        onInputblur(card)
                                    },
                                })} />
                            </Grid>       
                            <Grid item xs={12} md={6}>
                                <Rotulo>Instagram</Rotulo>
                                <Campo type="text" placeholder="" maxLength={200} {...register('instagram',{
                                    onBlur: (e) => {
                                        let card = {
                                            id: dados.id,
                                            instagram: e.target.value                                        
                                        }
                                        onInputblur(card)
                                    },
                                })} />
                            </Grid>  
                            <Grid item xs={12} md={4}>
                                <Rotulo>Como nos conheceu</Rotulo>
                                <Controller
                                    name="comoConheceu"
                                    control={control}
                                    render={({ field }) => (
                                    <SelectCustomizado
                                        {...field}
                                        options={comoConheceuOptions}
                                        value={comoConheceuOptions.find(option => option.value === field.value)}
                                        onChange={(e: any) => {
                                        field.onChange(e.value);
                                        let card = {
                                            id: dados.id,
                                            comoConheceu: e.value,
                                        };
                                        onInputblur(card);
                                        }}
                                        isSearchable
                                        styles={createCrmSelectStyles()}
                                    />
                                    )}
                                />
                            </Grid> 
                            <Grid item xs={12} md={4}>
                                <Rotulo>Detalhamento</Rotulo>
                                <Campo type="text" placeholder="" maxLength={200} {...register('comoConheceuDetalhamento',{
                                    onBlur: (e) => {
                                        let card = {
                                            id: dados.id,
                                            comoConheceuDetalhamento: e.target.value                                        
                                        }
                                        onInputblur(card)
                                    },
                                })} />
                            </Grid> 

                            <Grid item xs={12} md={3} style={{ display: 'none' }}>
                                <Rotulo>Produto</Rotulo>
                                <Controller name="produto" control={control}
                                    render={({ field }) => (<SelectCustomizado 
                                        {...field} 
                                        options={[blankProductOption, ...produtos.map(produto => ({
                                            value: produto.id,
                                            label: produto.nome
                                        }))]} 
                                        value={produtoSelecionado}
                                        isSearchable
                                        styles={createCrmSelectStyles()}
                                        onChange={(e: any) => {
                                            field.onChange(e);
                                            setProdutoSelecionado(e)
                                            
                                            // Se for a opção em branco
                                            if (e.value === 0) {
                                                let card = {
                                                    id: dados.id,
                                                    produtoId: 0,
                                                    produto: "",
                                                    precoId: 0,
                                                    preco: "",
                                                    linkPgto: "",
                                                    linkCadastroPublico: ""
                                                }
                                                setValue('preco', '')
                                                setValue('linkPgto', '')
                                                setValue('linkCadastroPublico', '')
                                                setPrecoSelecionado({ value: 0, label: '' })
                                                onInputblur(card)
                                                return;
                                            }
                                            
                                            if (isAtendimento) {
                                                return;
                                            }
                                            setValue('preco', '')
                                            setValue('linkPgto', '')
                                            setValue('linkCadastroPublico', '')
                                            trigger('preco')                                           
                                            setPrecoSelecionado({ value: 0, label: '' })
                                        }}/>
                                    )}                                                                                   
                                />
                            </Grid>                                         

                            {/* <Grid item xs={12} md={3}>
                                <Rotulo>Produto</Rotulo>
                                <Controller name="produto" control={control}
                                    render={({ field }) => (<SelectCustomizado 
                                        {...field} 
                                        options={produtos.map(produto => ({
                                            value: produto.id,
                                            label: produto.nome
                                        }))} 
                                        value={produtoSelecionado}
                                        isSearchable
                                        styles={createCrmSelectStyles()}
                                        onChange={(e: any) => {
                                            field.onChange(e);
                                            setProdutoSelecionado(e)
                                            if (isAtendimento) {
                                                return;
                                            }
                                            setValue('preco', '')
                                            trigger('preco')                                           
                                            
                                        }}/>
                                    )}                                                                                   
                                />
                            </Grid>  */}
                            
                            {!isAtendimento && (
                                <Grid item xs={12} md={3} style={{ display: 'none' }}>
                                    <Rotulo>Preço</Rotulo>
                                    <Controller 
                                    name="preco" 
                                    control={control} 
                                    render={({ field }) => {
                                        return (
                                            <SelectCustomizado 
                                            {...field} 
                                            options={precificacaoFormatados(getValues("produto"))} 
                                            isSearchable
                                            value={precoSelecionado}
                                            styles={createCrmSelectStyles()}
                                            onChange={(e: any) => {
                                                field.onChange(e);   
                                                setPrecoSelecionado(e)   
                                                let linkPgto = linksPgto.filter(link => link.id === e.value)[0].linkpgto
                                                let linkCadastroPublico = buildPublicCadastroLink(dados.id, getValues("produto"), e)
                                                setValue('linkPgto',linkPgto)
                                                setValue('linkCadastroPublico', linkCadastroPublico)
                                                let card = {
                                                    id: dados.id,
                                                    produtoId: getValues("produto").value,
                                                    produto: getValues("produto").label,
                                                    precoId: e.value,
                                                    preco: e.label,
                                                    linkPgto: linkPgto,
                                                    linkCadastroPublico: linkCadastroPublico                       
                                                }
                                                onInputblur(card)     
                                                }}
                                            />
                                            )
                                        }}
                                    />
                                </Grid>
                            )}

                            {!isAtendimento && (
                                <Grid item xs={12} md={6} style={{ display: 'none' }}>
                                    <Rotulo>Link de Pagamento</Rotulo>
                                    <Campo type="text" placeholder="" readOnly {...register('linkPgto')} />
                                </Grid>
                            )}

                            {!isAtendimento && (
                                <Grid item xs={12} md={6} style={{ display: 'none' }}>
                                    <Rotulo>Link Público de Cadastro</Rotulo>
                                    <Campo type="text" placeholder="" readOnly {...register('linkCadastroPublico')} />
                                </Grid>
                            )}

                            {!isAtendimento && (
                                <Grid item xs={9} md={6} style={{ display: 'none' }}>
                                    <Rotulo>Venda</Rotulo>                                
                                    <Controller
                                        name="venda"
                                        control={control}
                                        render={({ field }) => (
                                            <SelectCustomizado
                                            {...field}
                                            value={vendaSelecionada}
                                            options={[blankSaleOption, ...vendasFormatadas]}
                                            onChange={(e: any) => {
                                                field.onChange(e);
                                                setVendaSelecionada(e)
                                                
                                                // Se for a opção em branco
                                                if (e.value === 0) {
                                                    let card = {
                                                        id: dados.id,
                                                        venda: 0,
                                                        cliente: 0                                        
                                                    }
                                                    setValue('clienteID', 0)
                                                    setClienteId(null)
                                                    setLinkDrive('')
                                                    setValue('linkDrive', '')
                                                    onInputblur(card)
                                                    return;
                                                }
                                                
                                                let cliente = vendas.filter(pagamento => pagamento.pagamentoId === e.value)[0].clienteId
                                                setValue('clienteID', cliente)
                                                setClienteId(cliente)

                                                let card = {
                                                    id: dados.id,
                                                    venda: e.value,
                                                    cliente: cliente                                        
                                                }
                                                onInputblur(card)
                                            }}
                                            isSearchable
                                            styles={createCrmSelectStyles()}
                                            />
                                        )}
                                        />                                                             
                                </Grid>
                            )}                             
                              

                            <Grid item xs={12} md={4} style={{ display: 'none' }}>
                                <Rotulo>Objetivo</Rotulo>
                                <Controller
                                    name="objetivo"
                                    control={control}
                                    render={({ field }) => (
                                    <SelectCustomizado
                                        {...field}
                                        options={objetivoOptions}
                                        value={objetivoOptions.find(option => option.value === field.value)}
                                        onChange={(e: any) => {
                                        field.onChange(e.value);
                                        let card = {
                                            id: dados.id,
                                            objetivo: e.value,
                                        };
                                        onInputblur(card);
                                        }}
                                        isSearchable
                                        styles={createCrmSelectStyles()}
                                    />
                                    )}
                                />
                            </Grid>  
                            <Grid item xs={12} md={12} style={{ display: 'none' }}>
                                <Rotulo>Link do Drive</Rotulo>
                                <Controller
                                    name="linkDrive"
                                    control={control}
                                    render={({ field }) => (
                                        <Campo
                                            {...field}
                                            type="text"
                                            placeholder="Cole o link do cliente"
                                            value={linkDrive}
                                            onChange={(e) => {
                                                setLinkDrive(e.target.value);
                                                field.onChange(e.target.value);
                                            }}
                                            onBlur={(e) => handleLinkDriveBlur(e.target.value)}
                                        />
                                    )}
                                />
                            </Grid>
                            <Grid item xs={12} md={12}>
                                <DescricaoCard cardId={dados.id} usuarioNome={usuarioNomeAtual} usuarioId={usuarioIdAtual} />
                            </Grid>

                            <Grid item xs={12} md={12} style={{ marginLeft: "10px" }}>
                                <Box sx={{ borderBottom: "1px solid rgba(20, 20, 20, 0.12)", mb: 1 }}>
                                    <Tabs
                                        variant="scrollable"
                                        scrollButtons="auto"
                                        value={crmAbaAtiva}
                                        onChange={(_, newValue) => setCrmAbaAtiva(newValue)}
                                        textColor="inherit"
                                        TabIndicatorProps={{ style: { backgroundColor: '#141414' } }}
                                        sx={{
                                            '& .MuiTab-root': {
                                                color: '#666666',
                                                textTransform: 'none',
                                                fontWeight: 700,
                                            },
                                            '& .Mui-selected': {
                                                color: '#141414',
                                            },
                                        }}
                                    >
                                        <Tab value="tarefas" label="Tarefas" />
                                        <Tab value="agendamento" label="Sessão gratuita" />
                                        <Tab value="processoVendas" label="Processo de Vendas" />
                                    </Tabs>
                                </Box>
                                {crmAbaAtiva === "tarefas" && <TarefasCRM cardId={dados.id} />}
                                {crmAbaAtiva === "agendamento" && <AgendamentoCRM cardId={dados.id} />}
                                {crmAbaAtiva === "processoVendas" && <ProcessoVendasCRM cardId={dados.id} />}
                            </Grid>

                            <Grid item xs={12} md={12} style={{ paddingBottom: "10px", marginTop: "10px" }}>
                                <Box display="flex" justifyContent="center">
                                    <BotaoCustomizado
                                        onClick={handleOpenAreaClienteAtendente}
                                        style={{
                                            backgroundColor: "#141414",
                                            border: "2px solid #141414",
                                            color: "#ffffff",
                                            boxShadow: "none",
                                            padding: "5px 16px",
                                        }}
                                    >
                                        Area do Cliente
                                    </BotaoCustomizado>
                                </Box>
                            </Grid>

                            <Grid container spacing={1} style={{marginTop: "23px", marginLeft: '10px'}}>
                                <Grid item xs={12} md={12} style={{paddingBottom: "10px", marginBottom: "3px"}}>
                                <BotaoCustom as="label">
                                    Anexar Arquivo
                                    <Campo type="file" style={{ display: 'none' }} onChange={handleFileChange} />
                                </BotaoCustom>
                                </Grid> 
                                <Grid container spacing={1} style={{marginBottom: "1px"}} >
                                {arquivos.map((arquivo, indexArquivo) => (
                                    setValue(`fileId[${indexArquivo}]`, arquivo.id),
                                    <React.Fragment key={indexArquivo}>
                                        <input type="hidden" {...register(`fileId[${indexArquivo}]`)} value={arquivo.id} />
                                        <Grid item xs={7} md={5} >
                                                    <Controller
                                                    name={`fileName[${indexArquivo}]`}
                                                    control={control}
                                                    defaultValue={arquivo.fileName}
                                                    render={({ field }) => (
                                                        <Campo
                                                        {...field}
                                                        type="text"
                                                        style={{ marginTop: '4px', marginBottom: '0px' }}
                                                        maxLength={255}
                                                        readOnly                                            
                                                        />
                                                    )}
                                                    />                                        
                                                </Grid>
                                                <Grid item xs={5} md={1}>                                                    
                                                    <Campo type="text"  readOnly value={formatDate(arquivo.createdAt)} {...register(`fileData[${indexArquivo}]`)} />
                                                </Grid>
                                                <Grid item xs={5} md={1}> 
                                                <BotaoDownload onClick={() => handleDownloadFile(indexArquivo)}>Download</BotaoDownload>
                                                </Grid>                                                
                                                <Grid item xs={1} md={1}> 
                                                <BotaoCustomizado style={{backgroundColor: "rgb(48, 48, 48)", marginTop: "12px", padding: "0px", width: "23px", height: "23px"}} onClick={() => handleOpenFileConfirm(indexArquivo)}>X</BotaoCustomizado>
                                                </Grid>
                                    </React.Fragment>   
                                ))}  
                                </Grid>
                            </Grid>                      
                        </Grid>  
                        {arquivado && (  
                        
                        <Grid container spacing={2}>
                            <Grid item md={3}></Grid>
                            <Grid item xs={12} md={6}>

                                <BotaoCustomizado style={{backgroundColor: "rgb(48, 48, 48)", marginTop: "12px", padding: "0px", height: "23px"}} onClick={() => handleOpenRemoveCardConfirm()}>Remover Card</BotaoCustomizado>

                            </Grid>
                            <Grid item md={3}></Grid>
                              
                        </Grid>    
                        )}

                    </form>

                    <Dialog
                        open={openComentarios}
                        onClose={() => setOpenComentarios(false)}
                        fullWidth
                        maxWidth="md"
                    >
                        
                        <DialogContent style={{ backgroundColor: '#ffffff' }}>
                            <Comentarios cardId={dados.id} usuarioNome={usuarioNomeAtual} usuarioId={usuarioIdAtual} origemTipo={comentariosOrigemTipo} $light />
                        </DialogContent>
                        <DialogActions style={{ backgroundColor: '#ffffff' }}>
                            <Button
                                onClick={() => setOpenComentarios(false)}
                                sx={{ backgroundColor: '#141414', color: "#ffffff", fontWeight: 700, '&:hover': { backgroundColor: '#383838' } }}
                            >
                                Fechar
                            </Button>
                        </DialogActions>
                    </Dialog>

                    <Dialog
                        open={openSelecionarTags}
                        onClose={() => setOpenSelecionarTags(false)}
                        fullWidth
                        maxWidth="sm"
                    >
                        <DialogTitle style={{ backgroundColor: '#ffffff', color: "#242424" }}>Selecionar tags</DialogTitle>
                        <DialogContent style={{ backgroundColor: '#ffffff', color: "#242424" }}>
                            <Stack spacing={1}>
                                {tagsDisponiveis.map((tag) => {
                                    const checked = tagsSelecionadas.includes(tag.id);
                                    return (
                                        <Box key={tag.id} display="flex" alignItems="center" justifyContent="space-between" sx={{ backgroundColor: 'rgba(20, 20, 20, 0.04)', borderRadius: '8px', padding: '8px 12px' }}>
                                            <MuiFormControlLabel
                                                control={<Checkbox checked={checked} onChange={(e) => {
                                                    const next = e.target.checked
                                                        ? [...tagsSelecionadas, tag.id]
                                                        : tagsSelecionadas.filter((t) => t !== tag.id);
                                                    setTagsSelecionadas(next);
                                                }} />}
                                                label={tag.name}
                                                sx={{ color: "#242424" }}
                                            />
                                            <Chip
                                                label={tag.name}
                                                sx={{ backgroundColor: '#ededed', color: '#242424', fontWeight: 700 }}
                                            />
                                        </Box>
                                    );
                                })}
                                {tagsDisponiveis.length === 0 && (
                                    <Box sx={{ color: '#141414', textAlign: 'center' }}>Nenhuma tag cadastrada.</Box>
                                )}
                            </Stack>
                        </DialogContent>
                        <DialogActions style={{ backgroundColor: '#ffffff' }}>
                            <Button onClick={() => setOpenSelecionarTags(false)} sx={{ color: '#141414' }}>Cancelar</Button>
                            <Button onClick={() => { salvarTags(tagsSelecionadas); setOpenSelecionarTags(false); }} sx={{ backgroundColor: '#141414', color: "#ffffff", fontWeight: 700, '&:hover': { backgroundColor: '#383838' } }}>
                                Salvar
                            </Button>
                            <Button onClick={() => setOpenEditarEtiquetas(true)} sx={{ color: '#141414' }}>
                                Editar etiquetas
                            </Button>
                        </DialogActions>
                    </Dialog>

                    <ModalEtiquetas open={openEditarEtiquetas} handleClose={() => { setOpenEditarEtiquetas(false); fetchTagsDisponiveis(); }} />

                    <Dialog
                        open={openCriarUsuarioConfirm}
                        onClose={handleCloseCriarUsuarioConfirm}
                        aria-labelledby="alert-dialog-title"
                        aria-describedby="alert-dialog-description"
                    >
                        <DialogTitle style={{backgroundColor: '#ffffff' , color: "#242424"}} id="alert-dialog-title">{"Confirmar criação de usuário"}</DialogTitle>
                        <DialogContent style={{backgroundColor: '#ffffff' , color: "#242424"}}>
                            <DialogContentText style={{backgroundColor: '#ffffff' , color: "#242424"}} id="alert-dialog-description">
                                O nome de exibição e o email para criação de usuário são os mesmos que estão nesse card. Você tem certeza que deseja criar esse usuário? Clique em voltar para ajustar os campos.
                            </DialogContentText >
                        </DialogContent>
                        <DialogActions style={{backgroundColor: '#ffffff'}}>
                            <Button style={{backgroundColor: '#ffffff'}} onClick={handleCloseCriarUsuarioConfirm} color="success">
                                Voltar
                            </Button>
                            <Button style={{backgroundColor: '#ffffff'}} onClick={handleConfirmCriarUsuario} color="primary" autoFocus>
                                Criar usuário
                            </Button>
                        </DialogActions>
                    </Dialog>

                    <Dialog
                        open={openUsuarioInfo}
                        onClose={(event, reason) => {
                            if (reason === "backdropClick" || reason === "escapeKeyDown") return;
                            handleRequestCloseUsuarioInfo();
                        }}
                        fullWidth
                        maxWidth="sm"
                    >
                        <DialogTitle style={{ backgroundColor: '#ffffff', color: "#242424", display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            Mensagem para o cliente
                            <IconButton onClick={handleRequestCloseUsuarioInfo} size="small" sx={{ color: '#141414' }}>
                                <CloseIcon />
                            </IconButton>
                        </DialogTitle>
                        <DialogContent style={{ backgroundColor: '#ffffff', color: "#242424" }}>
                            <Box component="pre" sx={{ whiteSpace: 'pre-wrap', color: "#242424", fontFamily: 'inherit', fontSize: '16px' }}>
                                {senhaGerada && usuarioInfoEmail ? buildWelcomeMessage(usuarioInfoNome || 'Cliente', usuarioInfoEmail, senhaGerada) : ''}
                            </Box>
                            <Box display="flex" justifyContent="flex-end" mt={2}>
                                <Button
                                    onClick={handleCopyWelcomeText}
                                    sx={{ backgroundColor: '#141414', color: "#ffffff", fontWeight: 700, '&:hover': { backgroundColor: '#383838' } }}
                                >
                                    Copiar texto
                                </Button>
                            </Box>
                        </DialogContent>
                    </Dialog>

                    <Dialog
                        open={openUsuarioInfoConfirmClose}
                        onClose={handleCancelCloseUsuarioInfo}
                        aria-labelledby="alert-dialog-title"
                        aria-describedby="alert-dialog-description"
                    >
                        <DialogTitle style={{backgroundColor: '#ffffff' , color: "#242424"}} id="alert-dialog-title">{"Confirmar fechamento"}</DialogTitle>
                        <DialogContent style={{backgroundColor: '#ffffff' , color: "#242424"}}>
                            <DialogContentText style={{backgroundColor: '#ffffff' , color: "#242424"}} id="alert-dialog-description">
                                Tem certeza que deseja fechar essa tela? a senha será perdida!
                            </DialogContentText >
                        </DialogContent>
                        <DialogActions style={{backgroundColor: '#ffffff'}}>
                            <Button style={{backgroundColor: '#ffffff'}} onClick={handleCancelCloseUsuarioInfo} color="success">
                                Cancelar
                            </Button>
                            <Button style={{backgroundColor: '#ffffff'}} onClick={handleConfirmCloseUsuarioInfo} color="primary" autoFocus>
                                Confirmar
                            </Button>
                        </DialogActions>
                    </Dialog>

                <Dialog
                open={openFileConfirm}
                onClose={handleCloseFileConfirm}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description">
                    <DialogTitle style={{backgroundColor: '#ffffff' , color: "#242424"}} id="alert-dialog-title">{"Confirmar Remoção"}</DialogTitle>
                    <DialogContent style={{backgroundColor: '#ffffff' , color: "#242424"}}>
                    <DialogContentText style={{backgroundColor: '#ffffff' , color: "#242424"}} id="alert-dialog-description">
                        Tem certeza que deseja remover este arquivo?
                    </DialogContentText >
                    </DialogContent>
                    <DialogActions style={{backgroundColor: '#ffffff'}}>
                    <Button style={{backgroundColor: '#ffffff'}} onClick={handleCloseFileConfirm} color="success">
                        Cancelar
                    </Button>
                    <Button style={{backgroundColor: '#ffffff'}} onClick={confirmRemoveFile} color="primary" autoFocus>
                        Confirmar
                    </Button>
                    </DialogActions>
                </Dialog>

                <Dialog
                open={openRemoveCardConfirm}
                onClose={handleCloseRemoveCardConfirm}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description">
                    <DialogTitle style={{backgroundColor: '#ffffff' , color: "#242424"}} id="alert-dialog-title">{"Confirmar Remoção"}</DialogTitle>
                    <DialogContent style={{backgroundColor: '#ffffff' , color: "#242424"}}>
                    <DialogContentText style={{backgroundColor: '#ffffff' , color: "#242424"}} id="alert-dialog-description">
                        Tem certeza que deseja excluir permanentemente?
                    </DialogContentText >
                    </DialogContent>
                    <DialogActions style={{backgroundColor: '#ffffff'}}>
                    <Button style={{backgroundColor: '#ffffff'}} onClick={handleCloseRemoveCardConfirm} color="success">
                        Cancelar
                    </Button>
                    <Button style={{backgroundColor: '#ffffff'}} onClick={confirmRemoveCard} color="primary" autoFocus>
                        Confirmar
                    </Button>
                    </DialogActions>
                </Dialog>


                </BoxCustomizado>
            </Modal >
        </ThemeProvider>
    );
}
