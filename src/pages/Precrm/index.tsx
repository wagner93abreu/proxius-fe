import { managementFieldStyles } from "../../styles/managementStyles";
import { ForumOutlined, AddOutlined, EditOutlined, DeleteOutline } from "@mui/icons-material";
import Container from "../../components/Container";
import Titulo from "../../components/Titulo";
import { DataGrid, GridColDef, GridRowId } from "@mui/x-data-grid";
import { useEffect, useMemo, useState } from "react";
import PrecrmCadastro from "../../components/PrecrmCadastro";
import Botao from "../../components/Botao";
import autenticaStore from "../../stores/autentica.store";
import http from "../../http";
import IBodyRequest from "../../types/IBodyRequest";
import IPrecrm from "../../types/IPrecrm";
import IUser from "../../types/IUser";
import styled from "styled-components";
import {
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { mostrarMensagem } from "../../stores/mensagem.store";

const Acoes = styled.div`
    margin-bottom: 16px;
`;

const Painel = styled.div`
    display: grid;
    grid-template-columns: minmax(0, 1.6fr) minmax(340px, 1fr);
    gap: 20px;
    align-items: start;

    @media (max-width: 1200px) {
        grid-template-columns: 1fr;
    }
`;

const Card = styled.section`
    background: #fffdfa;
    border: 1px solid rgba(85, 8, 29, 0.12);
    border-radius: 12px;
    padding: 16px;
    min-width: 0;
    box-shadow: 0 4px 20px rgba(85, 8, 29, 0.04);
`;

const CardTitulo = styled.h3`
    color: #35252b;
    margin-top: 0;
    margin-bottom: 16px;
`;

const Filtros = styled.div`
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
    margin-bottom: 16px;

    @media (max-width: 768px) {
        grid-template-columns: 1fr;
    }
`;

const CampoFiltro = styled.select`
    background: #f0f0f0;
    margin-top: 6px;
    box-sizing: border-box;
    box-shadow: none;
    border-radius: 12px;
    border: none;
    width: 100%;
    padding: 10px;
    ${managementFieldStyles}
`;

const Rotulo = styled.label`
    display: block;
    font-weight: 700;
    font-size: 16px;
    line-height: 19px;
    color: #35252b;
`;

const Metricas = styled.div`
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
    margin-bottom: 16px;

    @media (max-width: 768px) {
        grid-template-columns: 1fr;
    }
`;

const Metrica = styled.div`
    background: #f7f1e9;
    border-radius: 12px;
    padding: 12px;
`;

const MetricaRotulo = styled.span`
    display: block;
    color: #75656b;
    font-size: 0.85rem;
    margin-bottom: 6px;
`;

const MetricaValor = styled.strong`
    color: #35252b;
    font-size: 1.4rem;
`;

const SeriesFilters = styled.div`
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
    margin-bottom: 12px;
`;

const CheckboxLabel = styled.label`
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: #35252b;
    font-size: 0.95rem;
    cursor: pointer;
`;

const CheckboxInput = styled.input`
    width: 16px;
    height: 16px;
    accent-color: #55081d;
    ${managementFieldStyles}
`;

const TabelaContainer = styled.div`
    height: 680px;
    width: 100%;
`;

const Vazio = styled.div`
    min-height: 360px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #75656b;
    text-align: center;
    padding: 24px;
`;

const Descricao = styled.p`
    color: #35252b;
    max-width: 720px;
    line-height: 1.5;
    margin-top: 0;
    margin-bottom: 24px;
`;

const formatDate = (value?: string | null) => {
    if (!value) {
        return "";
    }

    const data = value.includes("T") ? value.slice(0, 10) : value.slice(0, 10);
    const [year, month, day] = data.split("-");
    return `${day}/${month}/${year}`;
};

const toNumber = (value?: number | null) => value ?? 0;

const normalizeDate = (value?: string | null) => {
    if (!value) {
        return null;
    }

    const safeValue = value.includes("T") ? value : `${value}T00:00:00`;
    const parsed = new Date(safeValue);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatWeekLabel = (date: Date) => {
    const reference = new Date(date);
    const day = reference.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    reference.setDate(reference.getDate() + diff);

    const end = new Date(reference);
    end.setDate(reference.getDate() + 6);

    const startLabel = reference.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    const endLabel = end.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    return `${startLabel} - ${endLabel}`;
};

type Agrupamento = "dia" | "semana" | "mes" | "ano";

type ChartPoint = {
    label: string;
    abordado: number;
    resposta: number;
    positivo: number;
    sortKey: number;
};

export default function Precrm() {
    const { usuario } = autenticaStore;
    const [registros, setRegistros] = useState<IPrecrm[]>([]);
    const [colaboradores, setColaboradores] = useState<IUser[]>([]);
    const [selectedRows, setSelectedRows] = useState<GridRowId[]>([]);
    const [open, setOpen] = useState(false);
    const [tipo, setTipo] = useState<"cadastra" | "edita">("cadastra");
    const [atualizarTabela, setAtualizarTabela] = useState(false);
    const [filtroCanal, setFiltroCanal] = useState("");
    const [filtroResponsavel, setFiltroResponsavel] = useState("");
    const [agrupamento, setAgrupamento] = useState<Agrupamento>("mes");
    const [showAbordado, setShowAbordado] = useState(true);
    const [showResposta, setShowResposta] = useState(true);
    const [showPositiva, setShowPositiva] = useState(true);

    const axiosConfig = useMemo(() => ({
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${usuario.token}`,
        },
    }), [usuario.token]);

    useEffect(() => {
        http.get<IBodyRequest<IPrecrm>>("precrm?page=0&size=500&sort=dataHora,desc", axiosConfig)
            .then(resposta => {
                setRegistros(resposta.data.content || []);
            })
            .catch(erro => {
                mostrarMensagem(erro, "error");
            });
    }, [axiosConfig, atualizarTabela, open]);

    useEffect(() => {
        http.get<IBodyRequest<IUser>>(`usuarios?size=500`, axiosConfig)
            .then(resposta => {
                setColaboradores(resposta.data.content.filter(usuarios => usuarios.active && usuarios.papel !== 'CLIENTE'));
            })
            .catch(erro => {
                mostrarMensagem(erro, "error");
            });
    }, [axiosConfig]);

    const registroSelecionado = registros.find(item => item.id === selectedRows[0]) || null;

    const canaisDisponiveis = useMemo(() => {
        return Array.from(new Set(registros.map(registro => registro.canal || "").filter(Boolean))).sort();
    }, [registros]);

    const responsaveisDisponiveis = useMemo(() => {
        const nomesUsuarios = colaboradores.map(colaborador => colaborador.nome);
        const nomesRegistros = registros.map(registro => registro.responsavel || "").filter(Boolean) as string[];
        return Array.from(new Set([...nomesUsuarios, ...nomesRegistros])).sort((a, b) => a.localeCompare(b));
    }, [colaboradores, registros]);

    const registrosFiltrados = useMemo(() => {
        return registros.filter(registro => {
            const canalValido = !filtroCanal || (registro.canal || "") === filtroCanal;
            const responsavelValido = !filtroResponsavel || (registro.responsavel || "") === filtroResponsavel;
            return canalValido && responsavelValido;
        });
    }, [registros, filtroCanal, filtroResponsavel]);

    const chartData = useMemo(() => {
        const grouped = new Map<string, ChartPoint>();

        registrosFiltrados.forEach(registro => {
            const parsedDate = normalizeDate(registro.dataHora);
            if (!parsedDate) {
                return;
            }

            let label = "";
            let sortKey = parsedDate.getTime();

            if (agrupamento === "dia") {
                label = parsedDate.toLocaleDateString("pt-BR");
                sortKey = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate()).getTime();
            }

            if (agrupamento === "semana") {
                label = formatWeekLabel(parsedDate);
                const weekStart = new Date(parsedDate);
                const day = weekStart.getDay();
                const diff = day === 0 ? -6 : 1 - day;
                weekStart.setDate(weekStart.getDate() + diff);
                weekStart.setHours(0, 0, 0, 0);
                sortKey = weekStart.getTime();
            }

            if (agrupamento === "mes") {
                label = parsedDate.toLocaleDateString("pt-BR", { month: "short", year: "numeric" });
                sortKey = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), 1).getTime();
            }

            if (agrupamento === "ano") {
                label = String(parsedDate.getFullYear());
                sortKey = new Date(parsedDate.getFullYear(), 0, 1).getTime();
            }

            const current = grouped.get(label) || {
                label,
                abordado: 0,
                resposta: 0,
                positivo: 0,
                sortKey,
            };

            current.abordado += toNumber(registro.qtdAbordado);
            current.resposta += toNumber(registro.qtdResposta);
            current.positivo += toNumber(registro.qtdRespostaPositiva);
            current.sortKey = Math.min(current.sortKey, sortKey);

            grouped.set(label, current);
        });

        return Array.from(grouped.values()).sort((a, b) => a.sortKey - b.sortKey);
    }, [registrosFiltrados, agrupamento]);

    const totais = useMemo(() => {
        return registrosFiltrados.reduce((acc, registro) => {
            acc.abordado += toNumber(registro.qtdAbordado);
            acc.resposta += toNumber(registro.qtdResposta);
            acc.positivo += toNumber(registro.qtdRespostaPositiva);
            return acc;
        }, { abordado: 0, resposta: 0, positivo: 0 });
    }, [registrosFiltrados]);

    const rows = registrosFiltrados.map(registro => ({
        id: registro.id,
        dataHora: formatDate(registro.dataHora),
        responsavel: registro.responsavel || "",
        canal: registro.canal || "",
        campanhaLink: registro.campanhaLink || "",
        observacao: registro.observacao || "",
        qtdAbordado: registro.qtdAbordado ?? "",
        qtdResposta: registro.qtdResposta ?? "",
        qtdRespostaPositiva: registro.qtdRespostaPositiva ?? "",
    }));

    const columns: GridColDef[] = [
        { field: "id", headerName: "ID", width: 90 },
        { field: "dataHora", headerName: "Data", width: 120 },
        { field: "responsavel", headerName: "Responsavel", width: 220 },
        { field: "canal", headerName: "Canal", width: 140 },
        { field: "qtdAbordado", headerName: "Qtd. Abordado", width: 140 },
        { field: "qtdResposta", headerName: "Qtd. Resposta", width: 140 },
        { field: "qtdRespostaPositiva", headerName: "Qtd. Positiva", width: 140 },
        { field: "campanhaLink", headerName: "Campanha", width: 280 },
        { field: "observacao", headerName: "Observacao", width: 320 },
    ];

    const handleOpen = (novoTipo: "cadastra" | "edita") => {
        if (novoTipo === "edita") {
            if (selectedRows.length === 0) {
                mostrarMensagem("Nenhum registro selecionado!", "warning");
                return;
            }

            if (selectedRows.length > 1) {
                mostrarMensagem("Favor selecionar um unico registro!", "warning");
                return;
            }
        }

        setTipo(novoTipo);
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const excluir = () => {
        if (selectedRows.length === 0) {
            mostrarMensagem("Nenhum registro selecionado!", "warning");
            return;
        }

        if (selectedRows.length > 1) {
            mostrarMensagem("Favor selecionar um unico registro!", "warning");
            return;
        }

        if (!window.confirm("Tem certeza que deseja excluir este registro PRECRM?")) {
            return;
        }

        http.delete(`precrm/${selectedRows[0]}`, axiosConfig)
            .then(() => {
                mostrarMensagem("Registro PRECRM excluido com sucesso!", "success");
                setSelectedRows([]);
                setAtualizarTabela(!atualizarTabela);
            })
            .catch(erro => {
                mostrarMensagem(erro, "error");
            });
    };

    return (
        <Container>
            <Titulo icone={<ForumOutlined />}>Cadastro de PRECRM</Titulo>
            <Descricao>
                Registre o volume abordado, o retorno obtido e o contexto da campanha para acompanhar a etapa anterior ao CRM principal.
            </Descricao>
            <Acoes>
                <Botao onClick={() => handleOpen("cadastra")}><AddOutlined aria-hidden="true" />Cadastrar</Botao>
                <Botao onClick={() => handleOpen("edita")}><EditOutlined aria-hidden="true" />Editar</Botao>
                <Botao onClick={excluir} style={{ backgroundColor: "#c50000", borderColor: "#c50000" }}><DeleteOutline aria-hidden="true" />
                    Excluir
                </Botao>
            </Acoes>
            <PrecrmCadastro
                open={open}
                handleClose={handleClose}
                tipo={tipo}
                registro={registroSelecionado}
                onSaved={() => setAtualizarTabela(!atualizarTabela)}
            />
            <Filtros>
                <div>
                    <Rotulo>Canal</Rotulo>
                    <CampoFiltro value={filtroCanal} onChange={(event) => setFiltroCanal(event.target.value)}>
                        <option value="">Todos</option>
                        {canaisDisponiveis.map(canal => (
                            <option key={canal} value={canal}>{canal}</option>
                        ))}
                    </CampoFiltro>
                </div>
                <div>
                    <Rotulo>Responsavel</Rotulo>
                    <CampoFiltro value={filtroResponsavel} onChange={(event) => setFiltroResponsavel(event.target.value)}>
                        <option value="">Todos</option>
                        {responsaveisDisponiveis.map(responsavel => (
                            <option key={responsavel} value={responsavel}>{responsavel}</option>
                        ))}
                    </CampoFiltro>
                </div>
                <div>
                    <Rotulo>Agrupar por</Rotulo>
                    <CampoFiltro value={agrupamento} onChange={(event) => setAgrupamento(event.target.value as Agrupamento)}>
                        <option value="dia">Dia</option>
                        <option value="semana">Semana</option>
                        <option value="mes">Mes</option>
                        <option value="ano">Ano</option>
                    </CampoFiltro>
                </div>
            </Filtros>
            <Painel>
                <Card>
                    <CardTitulo>Registros PRECRM</CardTitulo>
                    <TabelaContainer>
                        <DataGrid
                            style={{
                                backgroundColor: "#fffdfa",
                                borderBottomColor: "rgba(85, 8, 29, 0.12)",
                                borderTopColor: "rgba(85, 8, 29, 0.12)",
                                color: "#35252b",
                                borderColor: "rgba(85, 8, 29, 0.12)",
                            }}
                            rows={rows}
                            columns={columns}
                            initialState={{
                                pagination: {
                                    paginationModel: { page: 0, pageSize: 20 },
                                },
                            }}
                            pageSizeOptions={[20, 30, 50]}
                            checkboxSelection
                            disableRowSelectionOnClick
                            onRowSelectionModelChange={(ids) => setSelectedRows(ids)}
                        />
                    </TabelaContainer>
                </Card>
                <Card>
                    <CardTitulo>Evolucao PRECRM</CardTitulo>
                    <Metricas>
                        <Metrica>
                            <MetricaRotulo>Total abordado</MetricaRotulo>
                            <MetricaValor>{totais.abordado}</MetricaValor>
                        </Metrica>
                        <Metrica>
                            <MetricaRotulo>Total respostas</MetricaRotulo>
                            <MetricaValor>{totais.resposta}</MetricaValor>
                        </Metrica>
                        <Metrica>
                            <MetricaRotulo>Total positivas</MetricaRotulo>
                            <MetricaValor>{totais.positivo}</MetricaValor>
                        </Metrica>
                    </Metricas>
                    <SeriesFilters>
                        <CheckboxLabel>
                            <CheckboxInput
                                type="checkbox"
                                checked={showAbordado}
                                onChange={(event) => setShowAbordado(event.target.checked)}
                            />
                            Abordado
                        </CheckboxLabel>
                        <CheckboxLabel>
                            <CheckboxInput
                                type="checkbox"
                                checked={showResposta}
                                onChange={(event) => setShowResposta(event.target.checked)}
                            />
                            Resposta
                        </CheckboxLabel>
                        <CheckboxLabel>
                            <CheckboxInput
                                type="checkbox"
                                checked={showPositiva}
                                onChange={(event) => setShowPositiva(event.target.checked)}
                            />
                            Positiva
                        </CheckboxLabel>
                    </SeriesFilters>
                    {chartData.length === 0 ? (
                        <Vazio>Nao ha dados para exibir no grafico com os filtros atuais.</Vazio>
                    ) : (
                        <ResponsiveContainer width="100%" height={420}>
                            <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(85, 8, 29, 0.12)" />
                                <XAxis dataKey="label" stroke="#75656b" />
                                <YAxis stroke="#75656b" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: "#fffdfa", border: "1px solid rgba(85, 8, 29, 0.12)", borderRadius: 12 }}
                                    labelStyle={{ color: "#35252b" }}
                                />
                                <Legend />
                                {showAbordado && (
                                    <Line type="monotone" dataKey="abordado" name="Abordado" stroke="#55081d" strokeWidth={3} dot={{ r: 3 }} />
                                )}
                                {showResposta && (
                                    <Line type="monotone" dataKey="resposta" name="Resposta" stroke="#286b8a" strokeWidth={3} dot={{ r: 3 }} />
                                )}
                                {showPositiva && (
                                    <Line type="monotone" dataKey="positivo" name="Positiva" stroke="#357844" strokeWidth={3} dot={{ r: 3 }} />
                                )}
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </Card>
            </Painel>
        </Container>
    );
}
