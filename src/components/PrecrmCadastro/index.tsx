import { managementDialogStyles, managementFieldStyles } from "../../styles/managementStyles";
import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { Box, CircularProgress, Grid, Modal } from "@mui/material";
import CampoDigitacao from "../CampoDigitacao";
import Botao from "../Botao";
import http from "../../http";
import autenticaStore from "../../stores/autentica.store";
import IPrecrm from "../../types/IPrecrm";
import IBodyRequest from "../../types/IBodyRequest";
import IUser from "../../types/IUser";
import Select from "react-select";
import createCrmSelectStyles from "../../styles/crmSelectStyles";
import { mostrarMensagem } from "../../stores/mensagem.store";

const BoxCustomizado = styled(Box)`
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 60vw;
    max-height: 90vh;
    overflow-y: auto;
    background-color: #ffffff;
    border: none;
    border-radius: 12px;
    padding: 1.5em;

    @media (max-width: 768px) {
        width: 95vw;
    }
    ${managementDialogStyles}
`;

const Formulario = styled.form`
    width: 100%;
`;

const Titulo = styled.h2`
    color: #242424;
    margin-top: 0;
    text-align: center;
`;

const Rotulo = styled.label`
    display: block;
    font-weight: 700;
    font-size: 16px;
    line-height: 19px;
    color: #242424;
`;

const CampoContainer = styled.div`
    width: 100%;
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
`;

const AreaTexto = styled.textarea`
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
    min-height: 140px;
    resize: vertical;
    ${managementFieldStyles}
`;

const SelectCustomizado = styled(Select)`
    margin-top: 3px;
    margin-bottom: 25px;
`;

const Rodape = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    flex-wrap: wrap;
    margin-top: 16px;
`;

const Mensagem = styled.p<{ tipo: "sucesso" | "erro" }>`
    margin: 0;
    color: ${({ tipo }) => (tipo === "sucesso" ? "#777777" : "#303030")};
    font-weight: 700;
`;

const BotaoSecundario = styled(Botao)`
    background-color: transparent;
    border-color: #141414;
    color: #141414;

    &:hover {
        background-color: rgba(20, 20, 20, 0.06);
    }
`;

const canaisPrecrm = ["", "WhatsApp", "Instagram", "Facebook", "LinkedIn", "Telefone", "Email", "Outro"];

const customStyles = createCrmSelectStyles();

interface PrecrmCadastroProps {
    open: boolean;
    handleClose: () => void;
    tipo: "cadastra" | "edita";
    registro?: IPrecrm | null;
    onSaved?: () => void;
}

interface SelectOption {
    value: number;
    label: string;
}

const getToday = () => new Date().toISOString().slice(0, 10);

const initialForm = {
    dataHora: getToday(),
    canal: "",
    campanhaLink: "",
    observacao: "",
    qtdAbordado: "",
    qtdResposta: "",
    qtdRespostaPositiva: "",
};

type FormState = typeof initialForm;

const normalizeDate = (value: string) => {
    if (!value) {
        return null;
    }

    return `${value}T00:00:00`;
};

const parseNumber = (value: string) => {
    if (value === "") {
        return null;
    }

    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
};

const formatDateForInput = (value?: string | null) => {
    if (!value) {
        return getToday();
    }

    return value.includes("T") ? value.slice(0, 10) : value.slice(0, 10);
};

export default function PrecrmCadastro({ open, handleClose, tipo, registro, onSaved }: PrecrmCadastroProps) {
    const { usuario } = autenticaStore;
    const [form, setForm] = useState<FormState>(initialForm);
    const [colaboradores, setColaboradores] = useState<IUser[]>([]);
    const [responsavelSelecionado, setResponsavelSelecionado] = useState<SelectOption | null>(null);
    const [loading, setLoading] = useState(false);
    const [erro, setErro] = useState("");
    const [sucesso, setSucesso] = useState("");

    const axiosConfig = useMemo(() => ({
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${usuario.token}`,
        },
    }), [usuario.token]);

    const colaboradoresFormatados = colaboradores.map(colaborador => ({
        value: colaborador.id,
        label: colaborador.nome
    }));

    useEffect(() => {
        if (!open) {
            return;
        }

        http.get<IBodyRequest<IUser>>(`usuarios?size=500`, axiosConfig)
            .then(resposta => {
                setColaboradores(resposta.data.content.filter(usuarios => usuarios.active && usuarios.papel !== 'CLIENTE'));
            })
            .catch(responseError => {
                mostrarMensagem(responseError, "error");
            });
    }, [open, axiosConfig]);

    useEffect(() => {
        if (!open) {
            return;
        }

        if (tipo === "edita" && registro) {
            setForm({
                dataHora: formatDateForInput(registro.dataHora),
                canal: registro.canal || "",
                campanhaLink: registro.campanhaLink || "",
                observacao: registro.observacao || "",
                qtdAbordado: registro.qtdAbordado !== null && registro.qtdAbordado !== undefined ? String(registro.qtdAbordado) : "",
                qtdResposta: registro.qtdResposta !== null && registro.qtdResposta !== undefined ? String(registro.qtdResposta) : "",
                qtdRespostaPositiva: registro.qtdRespostaPositiva !== null && registro.qtdRespostaPositiva !== undefined ? String(registro.qtdRespostaPositiva) : "",
            });
            setResponsavelSelecionado(registro.responsavel ? { value: 0, label: registro.responsavel } : null);
            setErro("");
            setSucesso("");
            return;
        }

        setForm(initialForm);
        setResponsavelSelecionado(null);
        setErro("");
        setSucesso("");
    }, [open, tipo, registro]);

    useEffect(() => {
        if (!open || !registro?.responsavel || colaboradoresFormatados.length === 0) {
            return;
        }

        const responsavelAtual = colaboradoresFormatados.find(option => option.label === registro.responsavel);
        if (responsavelAtual) {
            setResponsavelSelecionado(responsavelAtual);
        }
    }, [open, registro, colaboradoresFormatados.length]);

    useEffect(() => {
        if (!open || tipo !== "cadastra" || colaboradoresFormatados.length === 0) {
            return;
        }

        const usuarioIdLogado = Number(localStorage.getItem("userID"));
        if (Number.isNaN(usuarioIdLogado)) {
            return;
        }

        const responsavelAtual = colaboradoresFormatados.find(option => option.value === usuarioIdLogado);
        if (responsavelAtual) {
            setResponsavelSelecionado(responsavelAtual);
        }
    }, [open, tipo, colaboradoresFormatados.length]);

    const atualizarCampo = (campo: keyof FormState, valor: string) => {
        setForm((estadoAtual) => ({
            ...estadoAtual,
            [campo]: valor,
        }));
    };

    const limparFormulario = () => {
        setForm(initialForm);
        setResponsavelSelecionado(null);
        setErro("");
        setSucesso("");
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setErro("");
        setSucesso("");

        if (!form.canal) {
            setErro("O campo canal e obrigatorio.");
            return;
        }

        if (form.qtdAbordado === "") {
            setErro("O campo quantidade abordada e obrigatorio.");
            return;
        }

        const payload: IPrecrm = {
            id: tipo === "edita" ? registro?.id : undefined,
            dataHora: normalizeDate(form.dataHora),
            responsavel: responsavelSelecionado?.label || null,
            canal: form.canal || null,
            campanhaLink: form.campanhaLink.trim() || null,
            observacao: form.observacao.trim() || null,
            qtdAbordado: parseNumber(form.qtdAbordado),
            qtdResposta: parseNumber(form.qtdResposta),
            qtdRespostaPositiva: parseNumber(form.qtdRespostaPositiva),
        };

        setLoading(true);

        try {
            if (tipo === "cadastra") {
                await http.post<IPrecrm>("precrm", payload, axiosConfig);
                setSucesso("Registro PRECRM cadastrado com sucesso.");
            } else {
                await http.put<IPrecrm>("precrm", payload, axiosConfig);
                setSucesso("Registro PRECRM atualizado com sucesso.");
            }
            onSaved?.();
            handleClose();
            limparFormulario();
        } catch (responseError) {
            setErro(`Nao foi possivel ${tipo === "cadastra" ? "cadastrar" : "atualizar"} o PRECRM.`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            open={open}
            onClose={handleClose}
            aria-labelledby="modal-precrm-title"
            aria-describedby="modal-precrm-description"
        >
            <BoxCustomizado role="dialog" aria-label="PRECRM">
                <Titulo>{tipo === "cadastra" ? "Cadastrar PRECRM" : "Editar PRECRM"}</Titulo>
                <Formulario onSubmit={handleSubmit}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                            <CampoDigitacao
                                tipo="date"
                                label="Data"
                                valor={form.dataHora}
                                placeholder="Selecione a data"
                                onChange={(value) => atualizarCampo("dataHora", value)}
                                required={false}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <CampoContainer>
                                <Rotulo>Responsavel</Rotulo>
                                <SelectCustomizado
                                    options={colaboradoresFormatados}
                                    value={responsavelSelecionado}
                                    onChange={(selected) => setResponsavelSelecionado(selected as SelectOption | null)}
                                    isClearable
                                    isSearchable
                                    styles={customStyles}
                                />
                            </CampoContainer>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <CampoContainer>
                                <Rotulo>Canal</Rotulo>
                                <select
                                    value={form.canal}
                                    onChange={(event) => atualizarCampo("canal", event.target.value)}
                                    required
                                    style={{
                                        background: '#fff',
                                        color: '#242424',
                                        marginTop: '3px',
                                        marginBottom: '25px',
                                        boxSizing: 'border-box',
                                        boxShadow: 'none',
                                        borderRadius: '10px',
                                        border: '1px solid rgba(20, 20, 20, 0.2)',
                                        width: '100%',
                                        padding: '10px'
                                    }}
                                >
                                    {canaisPrecrm.map(item => <option key={item}>{item}</option>)}
                                </select>
                            </CampoContainer>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <CampoDigitacao
                                tipo="url"
                                label="Link da campanha"
                                valor={form.campanhaLink}
                                placeholder="https://..."
                                onChange={(value) => atualizarCampo("campanhaLink", value)}
                                required={false}
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <CampoDigitacao
                                tipo="number"
                                label="Quantidade abordada"
                                valor={form.qtdAbordado}
                                placeholder="0"
                                onChange={(value) => atualizarCampo("qtdAbordado", value)}
                                required={true}
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <CampoDigitacao
                                tipo="number"
                                label="Quantidade de respostas"
                                valor={form.qtdResposta}
                                placeholder="0"
                                onChange={(value) => atualizarCampo("qtdResposta", value)}
                                required={false}
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <CampoDigitacao
                                tipo="number"
                                label="Respostas positivas"
                                valor={form.qtdRespostaPositiva}
                                placeholder="0"
                                onChange={(value) => atualizarCampo("qtdRespostaPositiva", value)}
                                required={false}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <CampoContainer>
                                <Rotulo>Observacao</Rotulo>
                                <AreaTexto
                                    value={form.observacao}
                                    placeholder="Contexto da abordagem, retorno recebido e proximos passos"
                                    onChange={(event) => atualizarCampo("observacao", event.target.value)}
                                    maxLength={500}
                                />
                            </CampoContainer>
                        </Grid>
                    </Grid>

                    {erro && <Mensagem tipo="erro">{erro}</Mensagem>}
                    {sucesso && <Mensagem tipo="sucesso">{sucesso}</Mensagem>}

                    <Rodape>
                        <BotaoSecundario type="button" onClick={handleClose}>
                            Cancelar
                        </BotaoSecundario>
                        <Botao type="submit" disabled={loading}>
                            {loading ? <CircularProgress size="1.2rem" color="inherit" /> : tipo === "cadastra" ? "Cadastrar" : "Salvar"}
                        </Botao>
                    </Rodape>
                </Formulario>
            </BoxCustomizado>
        </Modal>
    );
}
