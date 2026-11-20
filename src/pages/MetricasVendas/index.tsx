import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import Select from "react-select";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import Container from "../../components/Container";
import autenticaStore from "../../stores/autentica.store";
import http from "../../http";
import IBodyRequest from "../../types/IBodyRequest";
import ICard from "../../types/ICard";
import IMeta from "../../types/IMeta";
import IPrecrm from "../../types/IPrecrm";
import ITask from "../../types/ITask";
import IVenda from "../../types/IVenda";
import { formataMoeda } from "../../customFunctions/mascarasFormatacao";
import createCrmSelectStyles from "../../styles/crmSelectStyles";
import { FilterAltOutlined } from "@mui/icons-material";
import { mostrarMensagem } from "../../stores/mensagem.store";

type Option = {
    value: string | number;
    label: string;
};

type FunnelMetric = {
    leadsTotal: number;
    aquecimento: number;
    sessaoGratuita: number;
    tomadaDecisao: number;
    venda: number;
};

type SalesTotals = {
    valorComprador: number;
    valorBase: number;
    comissao: number;
};

type ChannelChartItem = {
    name: string;
    value: number;
};

const Page = styled(Container)`
    display: flex;
    flex-direction: column;
    gap: 24px;
`;

const Header = styled.section`
    background: linear-gradient(120deg, #fffdfa 0%, #f7f1e9 100%);
    border-radius: 18px;
    padding: 18px 28px;
    border: 1px solid rgba(85, 8, 29, 0.12);
    box-shadow: 0 4px 20px rgba(85, 8, 29, 0.04);
`;

const Title = styled.h1`
    margin: 0;
    color: #55081d;
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 2.2rem;
    letter-spacing: -0.025em;
    font-weight: 700;

    @media (max-width: 768px) {
        font-size: 1.7rem;
    }
`;

const FiltersRow = styled.section`
    display: flex;
    justify-content: center;
    gap: 12px;
    flex-wrap: wrap;
`;

const PanelGrid = styled.section`
    display: grid;
    grid-template-columns: minmax(0, 1.2fr) minmax(320px, 1fr);
    gap: 24px;

    @media (max-width: 1100px) {
        grid-template-columns: 1fr;
    }
`;

const BottomGrid = styled.section`
    display: grid;
    grid-template-columns: minmax(0, 1.2fr) minmax(280px, 1fr);
    gap: 24px;
    align-items: start;

    @media (max-width: 1100px) {
        grid-template-columns: 1fr;
    }
`;

const Card = styled.section`
    background: #fffdfa;
    border-radius: 14px;
    padding: 18px;
    box-shadow: 0 4px 20px rgba(85, 8, 29, 0.04);
    border: 1px solid rgba(85, 8, 29, 0.12);
    min-width: 0;
    overflow-x: auto;
`;

const CardTitle = styled.div`
    width: fit-content;
    min-width: 220px;
    margin: 0 0 18px;
    padding: 6px 22px;
    border-radius: 10px;
    background: #f7f1e9;
    color: #55081d;
    font-size: 0.95rem;
    font-weight: 700;
    text-align: center;
    text-transform: uppercase;
`;

const FunnelLayout = styled.div`
    display: grid;
    grid-template-columns: minmax(0, 1fr) 72px;
    gap: 12px;
    align-items: stretch;
`;

const FunnelRows = styled.div`
    display: flex;
    flex-direction: column;
    gap: 10px;
`;

const FunnelRow = styled.div`
    display: grid;
    grid-template-columns: 140px minmax(0, 1fr);
    gap: 10px;
    align-items: center;

    @media (max-width: 768px) {
        grid-template-columns: 110px minmax(0, 1fr);
    }
`;

const FunnelLabel = styled.div`
    color: #35252b;
    font-weight: 600;
    font-size: 0.98rem;
`;

const FunnelBarWrap = styled.div`
    display: flex;
    align-items: center;
    min-height: 60px;
    border-top: 1px solid rgba(85, 8, 29, 0.12);
`;

const FunnelBar = styled.div<{ $width: number; $color: string }>`
    width: ${({ $width }) => `${$width}%`};
    min-width: 22px;
    height: 54px;
    margin: 0 auto;
    background: ${({ $color }) => $color};
    clip-path: polygon(0% 0, 100% 0, 90% 90%, 10% 90%);
    transition: width 0.2s ease;
`;

const FunnelValues = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding-top: 6px;
`;

const FunnelValue = styled.div`
    min-height: 60px;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    color: #75656b;
    font-weight: 700;
    border-top: 1px solid rgba(85, 8, 29, 0.12);
`;

const MetaWrapper = styled.div`
    display: grid;
    grid-template-rows: auto auto;
    gap: 22px;
`;

const MetaGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 16px;

    @media (max-width: 768px) {
        grid-template-columns: 1fr;
    }
`;

const MetaCard = styled.div`
    background: #f7f1e9;
    color: #55081d;
    border-radius: 22px;
    min-height: 108px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.25);
`;

const MetaPercent = styled.span`
    font-size: 1.4rem;
    font-weight: 700;
`;

const MetaValue = styled.span`
    font-size: clamp(1.15rem, 1.8vw, 1.9rem);
    font-weight: 700;
`;

const RealizadoCard = styled.div`
    background: linear-gradient(120deg, #55081d 0%, #6f102a 100%);
    min-height: 120px;
    border-radius: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fffdfa;
    font-size: 2rem;
    font-weight: 700;
    text-align: center;
    padding: 24px;
`;

const Table = styled.table`
    width: 100%;
    border-collapse: collapse;
    background: #fffdfa;

    th,
    td {
        border: 1px solid rgba(85, 8, 29, 0.12);
        padding: 12px 14px;
        text-align: center;
        color: #35252b;
    }

    th {
        background: #f7f1e9;
        color: #55081d;
        font-size: 1rem;
    }

    td:first-child,
    th:first-child {
        text-align: left;
        font-weight: 700;
    }
`;

const ChartBox = styled.div`
    height: 340px;
`;

const Summary = styled.div`
    color: #75656b;
    font-size: 0.92rem;
    margin-top: 12px;
    display: flex;
    justify-content: center;
    gap: 18px;
    flex-wrap: wrap;
`;

const LoadingText = styled.div`
    color: #35252b;
    font-weight: 700;
    text-align: center;
`;

const EmptyChart = styled.div`
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #75656b;
    text-align: center;
`;

const lightSelectStyles = createCrmSelectStyles();
const selectStyles = {
    ...lightSelectStyles,
    control: (base: Parameters<typeof lightSelectStyles.control>[0], state: Parameters<typeof lightSelectStyles.control>[1]) => ({
        ...lightSelectStyles.control(base, state),
        minWidth: 150,
    }),
};

const monthOptions: Option[] = [
    { value: 1, label: "MES" },
    { value: 2, label: "FEVEREIRO" },
    { value: 3, label: "MARCO" },
    { value: 4, label: "ABRIL" },
    { value: 5, label: "MAIO" },
    { value: 6, label: "JUNHO" },
    { value: 7, label: "JULHO" },
    { value: 8, label: "AGOSTO" },
    { value: 9, label: "SETEMBRO" },
    { value: 10, label: "OUTUBRO" },
    { value: 11, label: "NOVEMBRO" },
    { value: 12, label: "DEZEMBRO" },
];

const funnelColors = ["#990000", "#c24607", "#f7a400", "#ffca57", "#ffd98a"];
const funnelFixedWidths = [100, 82, 64, 46, 28];
const chartColors = ["#55081d", "#286b8a", "#357844", "#9b7028", "#b78c9a"];

const extractList = <T,>(data: unknown): T[] => {
    if (Array.isArray(data)) return data as T[];
    if (data && typeof data === "object" && Array.isArray((data as IBodyRequest<T>).content)) {
        return (data as IBodyRequest<T>).content;
    }
    if (data && typeof data === "object" && Array.isArray((data as { tasks: T[] }).tasks)) {
        return (data as { tasks: T[] }).tasks;
    }
    return [];
};

const formatDateOnly = (date: Date) => date.toISOString().slice(0, 10);

const getPeriodBounds = (year: number, month: number) => {
    const start = new Date(year, month - 1, 1, 0, 0, 0);
    const end = new Date(year, month, 0, 23, 59, 59);
    return {
        startDate: formatDateOnly(start),
        endDate: formatDateOnly(end),
        startDateTime: `${formatDateOnly(start)}T00:00:00`,
        endDateTime: `${formatDateOnly(end)}T23:59:59`,
    };
};

const parseDate = (value?: string | null) => {
    if (!value) return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const inRange = (value: Date | null, start: Date, end: Date) => {
    if (!value) return false;
    return value >= start && value <= end;
};

const sumQtdAbordado = (items: IPrecrm[]) =>
    items.reduce((total, item) => total + Number(item.qtdAbordado || 0), 0);

const sumSalesTotals = (vendas: IVenda[]): SalesTotals => {
    return vendas.reduce(
        (acc, venda) => {
            (venda.pagamento || []).forEach((pagamento) => {
                acc.valorComprador += Number(pagamento.valorcomprador || 0);
                acc.valorBase += Number(pagamento.valorbase || 0);
                acc.comissao += Number(pagamento.comissao || 0);
            });
            return acc;
        },
        { valorComprador: 0, valorBase: 0, comissao: 0 }
    );
};

const isRelevantSale = (venda: IVenda) => {
    const produto = (venda.produto || "").toUpperCase();
    return !produto.includes("GRATUITO") && !produto.includes("CONSULTORIA");
};

const getConversion = (current: number, previous: number) => {
    if (!previous) return "-";
    return `${((current / previous) * 100).toFixed(1)}%`;
};

export default function MetricasVendas() {
    const { usuario } = autenticaStore;
    const currentDate = new Date();
    const [year, setYear] = useState(currentDate.getFullYear());
    const [month, setMonth] = useState(currentDate.getMonth() + 1);
    const [prospeccao, setProspeccao] = useState<string>("");
    const [meta, setMeta] = useState<IMeta | null>(null);
    const [loading, setLoading] = useState(false);
    const [funnelMetrics, setFunnelMetrics] = useState<FunnelMetric>({
        leadsTotal: 0,
        aquecimento: 0,
        sessaoGratuita: 0,
        tomadaDecisao: 0,
        venda: 0,
    });
    const [salesTotals, setSalesTotals] = useState<SalesTotals>({ valorComprador: 0, valorBase: 0, comissao: 0 });
    const [channelChartData, setChannelChartData] = useState<ChannelChartItem[]>([]);
    const [prospeccaoOptions, setProspeccaoOptions] = useState<Option[]>([{ value: "", label: "PROSPECCAO" }]);

    const axiosConfig = useMemo(
        () => ({
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${usuario.token}`,
            },
        }),
        [usuario.token]
    );

    useEffect(() => {
        const { startDate, endDate, startDateTime, endDateTime } = getPeriodBounds(year, month);
        const periodStart = new Date(startDateTime);
        const periodEnd = new Date(endDateTime);

        const fetchData = async () => {
            setLoading(true);
            try {
                const [precrmResponse, cardResponse, createdTaskResponse, concludedTaskResponse, vendaResponse, metaResponse] = await Promise.all([
                    http.get<IBodyRequest<IPrecrm>>("precrm?page=0&size=500&sort=dataHora,desc", axiosConfig),
                    http.get<ICard[] | IBodyRequest<ICard>>(
                        `card/filter-by-created-at?startCreatedAt=${startDateTime}&endCreatedAt=${endDateTime}`,
                        axiosConfig
                    ),
                    http.get<ITask[] | IBodyRequest<ITask>>(
                        `task/filter-by-created-at?visible=2&startCreatedAt=${startDateTime}&endCreatedAt=${endDateTime}`,
                        axiosConfig
                    ),
                    http.get<ITask[] | IBodyRequest<ITask>>(
                        `task/filter-by-conclusion-date?visible=2&startConclusionDate=${startDateTime}&endConclusionDate=${endDateTime}`,
                        axiosConfig
                    ),
                    http.get<IVenda[]>(`venda/filterByDate?dateAttribute=datavenda&startDate=${startDate}&endDate=${endDate}`, axiosConfig),
                    http.get<IMeta[]>(`meta/filter?attribute=data&value=${startDate}`, axiosConfig),
                ]);

                const precrmList = extractList<IPrecrm>(precrmResponse.data);
                const precrmPeriodo = precrmList.filter((item) => {
                    const dataHora = parseDate(item.dataHora);
                    return inRange(dataHora, periodStart, periodEnd);
                });

                const canais = Array.from(new Set(precrmPeriodo.map((item) => (item.canal || "").trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b));
                const nextOptions: Option[] = [{ value: "", label: "PROSPECCAO" }, ...canais.map((canal) => ({ value: canal, label: canal.toUpperCase() }))];
                setProspeccaoOptions(nextOptions);
                if (prospeccao && !canais.includes(prospeccao)) {
                    setProspeccao("");
                }

                const precrmFiltrado = prospeccao ? precrmPeriodo.filter((item) => (item.canal || "").trim() === prospeccao) : precrmPeriodo;

                const channelMap = precrmFiltrado.reduce((acc, item) => {
                    const canal = (item.canal || "Nao informado").trim() || "Nao informado";
                    acc.set(canal, (acc.get(canal) || 0) + Number(item.qtdAbordado || 0));
                    return acc;
                }, new Map<string, number>());

                const channelData = Array.from(channelMap.entries()).map(([name, value]) => ({ name, value })).filter((item) => item.value > 0);
                setChannelChartData(channelData);

                const createdTasks = extractList<ITask>(createdTaskResponse.data);
                const concludedTasks = extractList<ITask>(concludedTaskResponse.data);
                const cards = extractList<ICard>(cardResponse.data);
                const vendas = (vendaResponse.data || []).filter(isRelevantSale);

                setFunnelMetrics({
                    leadsTotal: sumQtdAbordado(precrmFiltrado),
                    aquecimento: cards.length,
                    sessaoGratuita: createdTasks.length,
                    tomadaDecisao: concludedTasks.length,
                    venda: vendas.length,
                });

                setSalesTotals(sumSalesTotals(vendas));
                setMeta(metaResponse.data?.[0] || null);
            } catch (erro) {
                mostrarMensagem(erro, "error");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [axiosConfig, month, prospeccao, year]);

    const yearOptions: Option[] = useMemo(
        () =>
            Array.from({ length: 10 }, (_, index) => {
                const optionYear = currentDate.getFullYear() - index;
                return { value: optionYear, label: String(optionYear) };
            }),
        [currentDate]
    );

    const funnelStages = useMemo(
        () => [
            { label: "Leads Total", value: funnelMetrics.leadsTotal },
            { label: "Aquecimento", value: funnelMetrics.aquecimento },
            { label: "Sessão Gratuita Agendada", value: funnelMetrics.sessaoGratuita },
            { label: "Tomada de Decisão", value: funnelMetrics.tomadaDecisao },
            { label: "Venda", value: funnelMetrics.venda },
        ],
        [funnelMetrics]
    );

    const conversionRows = useMemo(
        () =>
            funnelStages.map((stage, index) => ({
                ...stage,
                conversion: index === 0 ? "-" : getConversion(stage.value, funnelStages[index - 1].value),
                width: funnelFixedWidths[index] ?? funnelFixedWidths[funnelFixedWidths.length - 1],
            })),
        [funnelStages]
    );

    const metaCards = [
        { label: "80%", value: meta?.valorMinimo || 0 },
        { label: "100%", value: meta?.valorPadrao || 0 },
        { label: "120%", value: meta?.valorMaximo || 0 },
    ];

    return (
        <Page>
            <Header>
                <Title><FilterAltOutlined aria-hidden="true" />FUNIL DE VENDAS</Title>
            </Header>

            <FiltersRow>
                <Select
                    value={yearOptions.find((option) => option.value === year) || null}
                    onChange={(option) => setYear(Number(option?.value || currentDate.getFullYear()))}
                    options={yearOptions}
                    isSearchable={false}
                    styles={selectStyles}
                />
                <Select
                    value={monthOptions.find((option) => option.value === month) || null}
                    onChange={(option) => setMonth(Number(option?.value || currentDate.getMonth() + 1))}
                    options={monthOptions}
                    isSearchable={false}
                    styles={selectStyles}
                />
                <Select
                    value={prospeccaoOptions.find((option) => option.value === prospeccao) || prospeccaoOptions[0]}
                    onChange={(option) => setProspeccao(String(option?.value || ""))}
                    options={prospeccaoOptions}
                    isSearchable={false}
                    styles={selectStyles}
                />
            </FiltersRow>

            {loading ? (
                <LoadingText>Carregando metricas...</LoadingText>
            ) : (
                <>
                    <PanelGrid>
                        <Card>
                            <CardTitle>Funil Comercial</CardTitle>
                            <FunnelLayout>
                                <FunnelRows>
                                    {conversionRows.map((stage, index) => (
                                        <FunnelRow key={stage.label}>
                                            <FunnelLabel>{stage.label}</FunnelLabel>
                                            <FunnelBarWrap>
                                                <FunnelBar $width={stage.width} $color={funnelColors[index % funnelColors.length]} />
                                            </FunnelBarWrap>
                                        </FunnelRow>
                                    ))}
                                </FunnelRows>
                                <FunnelValues>
                                    {conversionRows.map((stage) => (
                                        <FunnelValue key={stage.label}>{stage.value}</FunnelValue>
                                    ))}
                                </FunnelValues>
                            </FunnelLayout>
                            <Summary>
                                {conversionRows.slice(1).map((stage) => (
                                    <span key={stage.label}>{stage.label}: {stage.conversion}</span>
                                ))}
                            </Summary>
                        </Card>

                        <MetaWrapper>
                            <Card>
                                <CardTitle>Meta Mensal</CardTitle>
                                <MetaGrid>
                                    {metaCards.map((item) => (
                                        <MetaCard key={item.label}>
                                            <MetaPercent>{item.label}</MetaPercent>
                                            <MetaValue>{formataMoeda(item.value, "REAL")}</MetaValue>
                                        </MetaCard>
                                    ))}
                                </MetaGrid>
                            </Card>

                            <Card>
                                <CardTitle>Realizado</CardTitle>
                                <RealizadoCard>{formataMoeda(salesTotals.valorBase, "REAL")}</RealizadoCard>
                            </Card>
                        </MetaWrapper>
                    </PanelGrid>

                    <BottomGrid>
                        <Card>
                            <Table>
                                <thead>
                                    <tr>
                                        <th>ETAPA</th>
                                        <th>VOLUME</th>
                                        <th>CONVERSAO</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {conversionRows.map((stage) => (
                                        <tr key={stage.label}>
                                            <td>{stage.label}</td>
                                            <td>{stage.value}</td>
                                            <td>{stage.conversion}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </Card>

                        <Card>
                            <CardTitle>Tipo de Prospeccao</CardTitle>
                            <ChartBox>
                                {channelChartData.length === 0 ? (
                                    <EmptyChart>Nenhum dado de prospeccao no periodo selecionado.</EmptyChart>
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={channelChartData}
                                                dataKey="value"
                                                nameKey="name"
                                                innerRadius={58}
                                                outerRadius={92}
                                                paddingAngle={2}
                                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                                            >
                                                {channelChartData.map((entry, index) => (
                                                    <Cell key={`${entry.name}-${index}`} fill={chartColors[index % chartColors.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value: number) => value.toLocaleString("pt-BR")} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                )}
                            </ChartBox>
                        </Card>
                    </BottomGrid>
                </>
            )}
        </Page>
    );
}