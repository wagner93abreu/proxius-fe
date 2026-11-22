import { managementDialogStyles, managementFieldStyles } from "../../../styles/managementStyles";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Grid, Modal } from '@mui/material';
import { Box } from "@mui/material";
import Titulo from "../../../components/Titulo";
import styled, { css } from "styled-components";
import Botao from "../../../components/Botao";
import autenticaStore from "../../../stores/autentica.store";
import { useForm } from "react-hook-form";
import { isAxiosError } from "axios";
import http from "../../../http";
import { GridRowId } from "@mui/x-data-grid";
import IProduto, { UnidadeDuracaoAcesso } from "../../../types/IProduto";
import Precificacao from "../../Precificacao";
import { mostrarMensagem } from "../../../stores/mensagem.store";


const BoxCustomizado = styled(Box)`
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 80vw;
    max-height: 90vh;
    overflow-y: auto;
    background-color: #ffffff;
    border: none;
    border-radius: 12px;
    padding: 1em 5em;
    ${managementDialogStyles}
`;

const campoStyles = css`
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
`;

const Campo = styled.input`${campoStyles}`;

const AreaDetalhes = styled.textarea`
    ${campoStyles}
    margin-bottom: 4px;
    resize: vertical;
`;

const CamposProduto = styled.fieldset`
    border: 0;
    margin: 0;
    padding: 0;
    min-width: 0;
`;

const FotoPreview = styled.img`
    display: block;
    max-width: 100%;
    max-height: 220px;
    object-fit: contain;
    border-radius: 10px;
    margin: 8px 0;
`;

const Rotulo = styled.label`
    display: block;
    font-weight: 700;
    font-size: 16px;
    line-height: 19px;
    color: #242424
`

const SpanErro = styled.span`
    float: left;
    color: #303030;
    font-size: 14px;
    margin-top: -25px;
`

const PrecificacaoWrapper = styled.div`
    margin-top: 8px;
`;

interface IProdutoPost {
    id: string,
    origem: string,
    nome: string,
    descricao: string,
    regras: string,
    active: boolean,
    videoUrl: string,
    detalhes: string,
    duracaoAcessoQuantidade: number | null,
    duracaoAcessoUnidade: UnidadeDuracaoAcesso | null
}

interface IProdutoForm {
    origem: string;
    nome: string;
    descricao: string;
    regras: string;
    active: boolean;
    videoUrl: string;
    detalhes: string;
    semExpiracao: boolean;
    duracaoAcessoQuantidade?: number;
    duracaoAcessoUnidade: UnidadeDuracaoAcesso | "";
}

const valoresIniciais: IProdutoForm = {
    origem: "",
    nome: "",
    descricao: "",
    regras: "",
    active: true,
    videoUrl: "",
    detalhes: "",
    semExpiracao: true,
    duracaoAcessoQuantidade: undefined,
    duracaoAcessoUnidade: "",
};

const limiteDetalhes = 60000;
const limiteVideoUrl = 2048;
const limiteFoto = 5 * 1024 * 1024;
const tiposFoto = ["image/jpeg", "image/png", "image/webp"];
const hostsYouTube = ["youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com"];
const identificadorVideo = /^[a-zA-Z0-9_-]{11}$/;
type AlteracaoFoto = { arquivo: File } | "remover" | null;

function armazenamentoIndisponivel(erro: unknown) {
    return isAxiosError(erro) && [501, 502, 503, 504].includes(erro.response?.status ?? 0);
}

function validarVideo(valor: string) {
    const link = valor.trim();
    if (!link) return true;
    const autoridade = /^https:\/\/([^/?#]+)/i.exec(link)?.[1];
    if (!autoridade || autoridade.includes("@") || /[\s\\]/.test(link)) return false;
    try {
        const url = new URL(link);
        if (url.protocol !== "https:" || url.port || url.username || url.password) return false;
        const segmentos = url.pathname.replace(/\/$/, "").split("/").slice(1);
        const [rota, videoId] = segmentos;
        if (url.hostname === "youtu.be") {
            return segmentos.length === 1 && identificadorVideo.test(rota);
        }
        if (!hostsYouTube.includes(url.hostname)) return false;
        if (url.pathname === "/watch") {
            const ids = url.searchParams.getAll("v");
            return ids.length === 1 && identificadorVideo.test(ids[0]);
        }
        return segmentos.length === 2 && ["embed", "shorts", "live"].includes(rota)
            && identificadorVideo.test(videoId);
    } catch {
        return false;
    }
}

function useUrlFoto(foto: Blob | null) {
    const [preview, setPreview] = useState<{ foto: Blob; url: string } | null>(null);
    useEffect(() => {
        if (!foto) {
            setPreview(null);
            return;
        }
        const url = URL.createObjectURL(foto);
        setPreview({ foto, url });
        return () => URL.revokeObjectURL(url);
    }, [foto]);
    return preview?.foto === foto ? preview.url : null;
}

export default function ModalProduto({ open, handleClose, produtos, id, tipo }: { open: boolean, handleClose: () => void, produtos: IProduto[], id: GridRowId[], tipo: string}) {
    const produtoEditado = tipo === "edita" ? produtos.find(item => String(item.id) === String(id[0])) : undefined;
    const idProduto = produtoEditado?.id == null ? "" : String(produtoEditado.id);
    const [idSalvo, setIdSalvo] = useState<string | null>(null);
    const [salvando, setSalvando] = useState(false);
    const enviandoRef = useRef(false);
    const [alteracaoFoto, setAlteracaoFoto] = useState<AlteracaoFoto>(null);
    const [erroArquivo, setErroArquivo] = useState("");
    const [erroSalvar, setErroSalvar] = useState("");
    const [fotoAtual, setFotoAtual] = useState<Blob | null>(null);
    const [carregandoFoto, setCarregandoFoto] = useState(false);
    const [erroFotoAtual, setErroFotoAtual] = useState("");
    const urlFotoAtual = useUrlFoto(fotoAtual);
    const arquivoFoto = alteracaoFoto && alteracaoFoto !== "remover" ? alteracaoFoto.arquivo : null;
    const urlNovaFoto = useUrlFoto(arquivoFoto);
    const {register, handleSubmit, reset, formState:{errors}, watch} = useForm<IProdutoForm>({
        defaultValues: valoresIniciais,
    });
    const semExpiracao = watch("semExpiracao");
    const initializedFormRef = useRef<string | null>(null);
    const {usuario} = autenticaStore;
    
    const axiosConfig = useMemo(() => ({
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${usuario.token}`,
        },
    }), [usuario]);
    const headersFoto = useMemo(() => ({
        Authorization: axiosConfig.headers.Authorization,
    }), [axiosConfig]);
    const temFotoAtual = produtoEditado?.fotoDisponivel === true;
    const fotoEndpoint = idProduto ? `produtos/${encodeURIComponent(idProduto)}/foto` : "";
      
    useEffect(() => {
        if (!open) {
            initializedFormRef.current = null;
            setIdSalvo(null);
            setAlteracaoFoto(null);
            setErroArquivo("");
            setErroSalvar("");
            reset(valoresIniciais);
            return;
        }
        if (tipo === "edita" && !produtoEditado) return;
        const formKey = `${tipo}:${idProduto}`;
        if (initializedFormRef.current === formKey) return;
        initializedFormRef.current = formKey;
        setIdSalvo(null);
        setAlteracaoFoto(null);
        setErroArquivo("");
        setErroSalvar("");
        if (produtoEditado) {
            reset({
                origem: produtoEditado.origem,
                nome: produtoEditado.nome,
                descricao: produtoEditado.descricao,
                regras: produtoEditado.regras,
                active: produtoEditado.active ?? true,
                videoUrl: produtoEditado.videoUrl ?? "",
                detalhes: produtoEditado.detalhes ?? "",
                semExpiracao: produtoEditado.duracaoAcessoQuantidade == null && produtoEditado.duracaoAcessoUnidade == null,
                duracaoAcessoQuantidade: produtoEditado.duracaoAcessoQuantidade ?? undefined,
                duracaoAcessoUnidade: produtoEditado.duracaoAcessoUnidade ?? "",
            });
            return;
        }
        reset(valoresIniciais);
    }, [open, tipo, idProduto, produtoEditado, reset]);

    useEffect(() => {
        setFotoAtual(null);
        setErroFotoAtual("");
        setCarregandoFoto(false);
        if (!open || !temFotoAtual || !fotoEndpoint) return;
        const controller = new AbortController();
        setCarregandoFoto(true);
        http.get<Blob>(fotoEndpoint, {
            headers: headersFoto,
            responseType: "blob",
            signal: controller.signal,
        }).then(({ data }) => {
            if (!controller.signal.aborted) setFotoAtual(data);
        }).catch((erro: unknown) => {
            if (!controller.signal.aborted) {
                setErroFotoAtual(armazenamentoIndisponivel(erro)
                    ? "Não foi possível carregar a foto atual: o serviço de armazenamento de fotos está indisponível neste ambiente."
                    : "Não foi possível carregar a foto atual.");
            }
        }).finally(() => {
            if (!controller.signal.aborted) setCarregandoFoto(false);
        });
        return () => controller.abort();
    }, [open, temFotoAtual, fotoEndpoint, headersFoto]);

    function selecionarFoto(event: React.ChangeEvent<HTMLInputElement>) {
        const arquivo = event.currentTarget.files?.[0];
        event.currentTarget.value = "";
        if (!arquivo) return;
        if (!tiposFoto.includes(arquivo.type) || arquivo.size === 0 || arquivo.size > limiteFoto) {
            setAlteracaoFoto(null);
            setErroArquivo("Selecione uma foto JPEG, PNG ou WebP de até 5 MiB. O arquivo não pode estar vazio.");
            return;
        }
        setErroArquivo("");
        setAlteracaoFoto({ arquivo });
    }

    async function postProduto(data?: IProdutoForm) {
        if (enviandoRef.current || erroArquivo || (data && tipo === "edita" && !idProduto)) return;
        enviandoRef.current = true;
        setSalvando(true);
        setErroSalvar("");
        let produtoSalvo = idSalvo;
        try {
            if (produtoSalvo === null && data) {
                const produto: IProdutoPost = {
                    id: idProduto,
                    origem: data.origem,
                    nome: data.nome,
                    descricao: data.descricao,
                    regras: data.regras,
                    active: data.active,
                    videoUrl: data.videoUrl.trim(),
                    detalhes: data.detalhes,
                    duracaoAcessoQuantidade: data.semExpiracao ? null : Number(data.duracaoAcessoQuantidade),
                    duracaoAcessoUnidade: data.semExpiracao || !data.duracaoAcessoUnidade
                        ? null
                        : data.duracaoAcessoUnidade,
                };
                const resposta = tipo === "cadastra"
                    ? await http.post<IProduto>("produtos", produto, axiosConfig)
                    : await http.put<IProduto>("produtos", produto, axiosConfig);
                produtoSalvo = String(resposta.data?.id ?? idProduto);
                setIdSalvo(produtoSalvo);
            }
            if (alteracaoFoto) {
                if (!produtoSalvo) {
                    setErroSalvar("Produto salvo, mas a API não retornou o ID do produto. Desfaça a alteração da foto e reabra o produto para tentar novamente.");
                    return;
                }
                const endpoint = `produtos/${encodeURIComponent(produtoSalvo)}/foto`;
                if (alteracaoFoto === "remover") {
                    await http.delete(endpoint, { headers: headersFoto });
                } else {
                    const formData = new FormData();
                    formData.append("file", alteracaoFoto.arquivo);
                    await http.post<IProduto>(endpoint, formData, { headers: headersFoto });
                }
            }
            mostrarMensagem(tipo === "cadastra" ? "registro cadastrado com SUCESSO!" : "Alteração efetuada com sucesso!", "success");
            handleClose();
        } catch (erro) {
            if (produtoSalvo !== null) {
                const acao = alteracaoFoto === "remover" ? "remover" : "enviar";
                const motivo = armazenamentoIndisponivel(erro)
                    ? " O serviço de armazenamento de fotos está indisponível neste ambiente."
                    : "";
                setErroSalvar(`Produto salvo, mas não foi possível ${acao} a foto.${motivo} Tente novamente sem salvar o produto outra vez.`);
            } else {
                setErroSalvar("Não foi possível salvar o produto. Confira os dados e tente novamente.");
            }
        } finally {
            enviandoRef.current = false;
            setSalvando(false);
        }
    }

    function fechar() {
        if (!enviandoRef.current && idSalvo === null) handleClose();
    }

    return (
        <>
            <Modal
                open={open}
                onClose={fechar}
                
            >
                <BoxCustomizado role="dialog" aria-label="Produto">
                    <form onSubmit={idSalvo === null ? handleSubmit(postProduto) : event => {
                        event.preventDefault();
                        void postProduto();
                    }} aria-busy={salvando}>
                        <Titulo>{`${tipo === 'cadastra' ? "Cadastrar" : "Editar"} Produto`}</Titulo>
                        <CamposProduto disabled={salvando || idSalvo !== null}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={2}>
                                <Rotulo htmlFor="produto-origem">Origem</Rotulo>
                                <Campo id="produto-origem" type="text" placeholder="" maxLength={100} {...register('origem', {required: "Campo obrigatório"})} />
                                {errors.origem && typeof errors.origem.message === 'string' && <SpanErro>{errors.origem.message}</SpanErro>}
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <Rotulo htmlFor="produto-nome">Nome</Rotulo>
                                <Campo id="produto-nome" type="text" placeholder="" maxLength={100} {...register('nome', {required: "Campo obrigatório"})} />
                                {errors.nome && typeof errors.nome.message === 'string' && <SpanErro>{errors.nome.message}</SpanErro>}
                            </Grid>
                            <Grid item xs={12} md={7}>
                                <Rotulo htmlFor="produto-descricao">Descrição</Rotulo>
                                <Campo id="produto-descricao" type="text" placeholder="" maxLength={100} {...register('descricao', {required: "Campo obrigatório"})} />
                                {errors.descricao && typeof errors.descricao.message === 'string' && <SpanErro>{errors.descricao.message}</SpanErro>}
                            </Grid>
                            <Grid item xs={12}>
                                <Rotulo htmlFor="produto-regras">Regras (Separar com ";") A regra deve ter seu valor cadastrado na tabela de taxas para ser calculada corretamente</Rotulo>
                                <Campo id="produto-regras" type="text" placeholder="" maxLength={100} {...register('regras')} />
                                {errors.regras && typeof errors.regras.message === 'string' && <SpanErro>{errors.regras.message}</SpanErro>}
                            </Grid>
                            <Grid item xs={12}>
                                <label>
                                    <input type="checkbox" role="switch" {...register("active")} />
                                    Ativo
                                </label>
                            </Grid>
                            <Grid item xs={12}>
                                <Rotulo htmlFor="produto-video">Link do vídeo no YouTube (opcional)</Rotulo>
                                <Campo id="produto-video" type="text" inputMode="url" maxLength={limiteVideoUrl}
                                    aria-invalid={Boolean(errors.videoUrl)}
                                    aria-describedby={errors.videoUrl ? "produto-video-erro" : undefined}
                                    {...register("videoUrl", {
                                        maxLength: { value: limiteVideoUrl, message: "Use um link de até 2.048 caracteres." },
                                        validate: valor => validarVideo(valor) || "Informe um link HTTPS válido para um vídeo do YouTube.",
                                    })}
                                />
                                {errors.videoUrl?.message && <SpanErro id="produto-video-erro" role="alert">{errors.videoUrl.message}</SpanErro>}
                            </Grid>
                            <Grid item xs={12}>
                                <Rotulo htmlFor="produto-detalhes">Detalhes (opcional)</Rotulo>
                                <AreaDetalhes id="produto-detalhes" rows={6} maxLength={limiteDetalhes}
                                    aria-describedby="produto-detalhes-ajuda"
                                    {...register("detalhes", { maxLength: { value: limiteDetalhes, message: "Use até 60.000 caracteres." } })}
                                />
                                <div id="produto-detalhes-ajuda">Texto simples, até 60.000 caracteres.</div>
                                {errors.detalhes?.message && <div role="alert">{errors.detalhes.message}</div>}
                            </Grid>
                            <Grid item xs={12} md={12}>
                                <label>
                                    <input type="checkbox" {...register("semExpiracao")} />
                                    Sem expiração
                                </label>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Rotulo htmlFor="duracao-acesso-quantidade">Duração do acesso</Rotulo>
                                <Campo
                                    id="duracao-acesso-quantidade"
                                    type="number"
                                    min={1}
                                    step={1}
                                    disabled={semExpiracao}
                                    {...register("duracaoAcessoQuantidade", {
                                        valueAsNumber: true,
                                        validate: (value, formValues) =>
                                            formValues.semExpiracao ||
                                            (Number.isInteger(value) && Number(value) > 0) ||
                                            "Informe um número inteiro positivo",
                                    })}
                                />
                                {errors.duracaoAcessoQuantidade?.message && <SpanErro>{errors.duracaoAcessoQuantidade.message}</SpanErro>}
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Rotulo>Unidade</Rotulo>
                                <select
                                    aria-label="Unidade da duração"
                                    disabled={semExpiracao}
                                    {...register("duracaoAcessoUnidade", {
                                        validate: (value, formValues) =>
                                            formValues.semExpiracao || value !== "" || "Selecione uma unidade",
                                    })}
                                >
                                    <option value="">Selecione</option>
                                    <option value="DIA">Dia(s)</option>
                                    <option value="MES">Mês(es)</option>
                                    <option value="ANO">Ano(s)</option>
                                </select>
                                {errors.duracaoAcessoUnidade?.message && <SpanErro>{errors.duracaoAcessoUnidade.message}</SpanErro>}
                            </Grid>
                        </Grid>
                        </CamposProduto>
                        <CamposProduto disabled={salvando} style={{ marginTop: 16 }}>
                            <Rotulo htmlFor="produto-foto">Foto do produto (opcional)</Rotulo>
                            <Campo id="produto-foto" type="file" accept={tiposFoto.join(",")}
                                aria-describedby="produto-foto-ajuda" aria-invalid={Boolean(erroArquivo)}
                                onChange={selecionarFoto}
                            />
                            <div id="produto-foto-ajuda">JPEG, PNG ou WebP, até 5 MiB.</div>
                            {alteracaoFoto === "remover" ? <p>A foto atual será removida ao salvar.</p> : (
                                <>
                                    {carregandoFoto && <p role="status">Carregando foto atual…</p>}
                                    {erroFotoAtual && <Alert severity="warning">{erroFotoAtual}</Alert>}
                                    {urlFotoAtual && <FotoPreview src={urlFotoAtual} alt="Foto atual do produto" />}
                                    {urlNovaFoto && <FotoPreview src={urlNovaFoto} alt="Prévia da nova foto do produto" />}
                                    {arquivoFoto && <p>Arquivo selecionado: {arquivoFoto.name}</p>}
                                </>
                            )}
                            {(alteracaoFoto || erroArquivo) && (
                                <Botao type="button" onClick={() => {
                                    setAlteracaoFoto(null);
                                    setErroArquivo("");
                                }}>
                                    Desfazer alteração da foto
                                </Botao>
                            )}
                            {temFotoAtual && alteracaoFoto !== "remover" && (
                                <Botao type="button" onClick={() => {
                                    setAlteracaoFoto("remover");
                                    setErroArquivo("");
                                }}>
                                    Remover foto atual
                                </Botao>
                            )}
                        </CamposProduto>
                        {erroArquivo && <Alert severity="error">{erroArquivo}</Alert>}
                        {erroSalvar && <Alert severity={idSalvo === null ? "error" : "warning"}>{erroSalvar}</Alert>}
                        <Botao type="submit" disabled={salvando || !!erroArquivo || (tipo === "edita" && !idProduto)}>
                            {salvando ? "Salvando…" : idSalvo !== null
                                ? alteracaoFoto ? "Tentar novamente com a foto" : "Concluir sem alterar a foto"
                                : tipo === "cadastra" ? "Cadastrar" : "Salvar"}
                        </Botao>
                        {idSalvo === null && <Botao type="button" disabled={salvando} onClick={fechar}>Cancelar</Botao>}
                    </form>
                    {tipo === 'cadastra' ? "" : (
                        <PrecificacaoWrapper>
                            <Precificacao idProd={idProduto} />
                        </PrecificacaoWrapper>
                    )}  
                </BoxCustomizado>
            </Modal >
        </>
    );
}