import { useEffect } from "react";
import { Link } from "react-router-dom";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import ArrowOutwardRoundedIcon from "@mui/icons-material/ArrowOutwardRounded";
import AutoGraphRoundedIcon from "@mui/icons-material/AutoGraphRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import FolderOpenRoundedIcon from "@mui/icons-material/FolderOpenRounded";
import GridViewRoundedIcon from "@mui/icons-material/GridViewRounded";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import LayersOutlinedIcon from "@mui/icons-material/LayersOutlined";
import NorthEastRoundedIcon from "@mui/icons-material/NorthEastRounded";
import "./styles.css";

const recursos = [
    {
        numero: "01",
        titulo: "Relacionamento",
        descricao: "Reúna informações dos seus clientes e acompanhe cada relacionamento de perto.",
        icone: GroupsOutlinedIcon,
    },
    {
        numero: "02",
        titulo: "CRM e vendas",
        descricao: "Visualize oportunidades, organize seu funil e acompanhe o andamento das negociações.",
        icone: LayersOutlinedIcon,
    },
    {
        numero: "03",
        titulo: "Gestão financeira",
        descricao: "Tenha mais clareza sobre os lançamentos e as informações financeiras da operação.",
        icone: AutoGraphRoundedIcon,
    },
    {
        numero: "04",
        titulo: "Documentos",
        descricao: "Organize arquivos e modelos para manter as informações importantes por perto.",
        icone: FolderOpenRoundedIcon,
    },
];

const etapas = [
    { titulo: "Em contato", cards: ["Novas oportunidades", "Primeira conversa"] },
    { titulo: "Em andamento", cards: ["Entendendo necessidades", "Próximos passos"] },
    { titulo: "Negociação", cards: ["Proposta em análise", "Acompanhamento"] },
];

export default function PlataformaInicial() {
    const acessoEmpresa = `${window.location.protocol}//rhsc.localhost${window.location.port ? `:${window.location.port}` : ""}/login`;

    useEffect(() => {
        const tituloAnterior = document.title;
        document.title = "ProxiUs | Gestão mais próxima";
        return () => { document.title = tituloAnterior; };
    }, []);

    return (
        <div className="proxius-landing">
            <header className="landing-header">
                <div className="landing-container landing-nav">
                    <a className="landing-logo" href="#inicio" aria-label="ProxiUs, início">ProxiUs<span>.</span></a>
                    <nav className="landing-nav-links" aria-label="Navegação principal">
                        <a href="#plataforma">Plataforma</a>
                        <a href="#recursos">Recursos</a>
                        <a href="#como-funciona">Como funciona</a>
                    </nav>
                    <a className="landing-nav-cta" href={acessoEmpresa}>Acessar sistema <ArrowOutwardRoundedIcon fontSize="inherit" /></a>
                </div>
            </header>

            <main id="inicio">
                <section className="landing-hero landing-container" aria-labelledby="hero-title">
                    <div className="landing-hero-copy">
                        <div className="landing-eyebrow"><span className="landing-eyebrow-dot" /> UMA NOVA FORMA DE ORGANIZAR</div>
                        <h1 id="hero-title">Seu negócio,<br /><span>mais próximo</span><br />do que importa.</h1>
                        <p>Clientes, vendas e informações em um só lugar. Mais clareza para o seu dia a dia, mais espaço para o seu negócio crescer.</p>
                        <div className="landing-actions">
                            <a className="landing-button landing-button-dark" href={acessoEmpresa}>Acessar sistema <ArrowForwardRoundedIcon fontSize="inherit" /></a>
                            <a className="landing-button landing-button-light" href="#plataforma">Conheça a plataforma <span aria-hidden="true">↓</span></a>
                        </div>
                        <div className="landing-hero-note"><span className="landing-note-icon"><CheckRoundedIcon fontSize="inherit" /></span> Gestão descomplicada, do seu jeito.</div>
                    </div>
                    <div className="landing-hero-visual">
                        <div className="landing-visual-label"><span>UMA VISÃO MAIS CLARA</span><span>✳</span></div>
                        <div className="landing-preview" aria-hidden="true">
                            <div className="preview-sidebar">
                                <span className="preview-logo">P<span>.</span></span>
                                <GridViewRoundedIcon />
                                <LayersOutlinedIcon />
                                <GroupsOutlinedIcon />
                                <InsightsRoundedIcon />
                                <span className="preview-sidebar-bottom">●</span>
                            </div>
                            <div className="preview-content">
                                <div className="preview-top"><span>Seu espaço de trabalho <span className="preview-separator">/</span> CRM</span><span>···</span></div>
                                <div className="preview-heading"><div><span className="preview-kicker">VISÃO GERAL</span><h2>Pipeline de vendas</h2><p>Acompanhe suas oportunidades</p></div><span className="preview-add">+</span></div>
                                <div className="preview-tabs"><span>Visão geral</span><span>Atividades</span><span>Clientes</span></div>
                                <div className="preview-board">
                                    {etapas.map((etapa, indice) => (
                                        <div className="preview-column" key={etapa.titulo}>
                                            <div className="preview-column-title"><span><i className={`preview-dot preview-dot-${indice}`} />{etapa.titulo}</span><span>2</span></div>
                                            {etapa.cards.map((card, cardIndice) => (
                                                <div className="preview-card" key={card}>
                                                    <span className="preview-card-icon">{indice + cardIndice + 1}</span>
                                                    <strong>{card}</strong>
                                                    <span className="preview-card-line" />
                                                    <span className="preview-card-footer"><span className="preview-avatar">P</span><span>Ver detalhes ↗</span></span>
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="landing-visual-caption"><span>MENOS COMPLEXIDADE. MAIS CONEXÃO.</span><span>ILUSTRAÇÃO DA PLATAFORMA</span></div>
                    </div>
                </section>

                <div className="landing-ticker" aria-label="Áreas da plataforma">
                    <div className="landing-container landing-ticker-inner"><span>UMA PLATAFORMA.</span><span>CLIENTES</span><i>✳</i><span>VENDAS</span><i>✳</i><span>GESTÃO</span><i>✳</i><span>DOCUMENTOS</span></div>
                </div>

                <section id="plataforma" className="landing-intro landing-container">
                    <div className="landing-section-label"><span>01 / A PLATAFORMA</span><span className="landing-label-line" /></div>
                    <div className="landing-intro-grid">
                        <h2>O trabalho flui melhor quando <span>tudo está conectado.</span></h2>
                        <div><p>Boas relações começam com organização. O ProxiUs aproxima as informações que sua equipe precisa para acompanhar clientes e cuidar do negócio.</p><a className="landing-text-link" href="#recursos">Explore os recursos <ArrowForwardRoundedIcon fontSize="inherit" /></a></div>
                    </div>
                </section>

                <section id="recursos" className="landing-resources">
                    <div className="landing-container">
                        <div className="landing-section-label"><span>02 / RECURSOS</span><span className="landing-label-line" /></div>
                        <div className="landing-section-heading"><div><h2>Mais organização.<br /><span>Menos complicação.</span></h2><p>As ferramentas para acompanhar o que move o seu negócio.</p></div><span className="landing-heading-mark" aria-hidden="true">✳</span></div>
                        <div className="landing-feature-grid">
                            {recursos.map(({ numero, titulo, descricao, icone: Icone }) => (
                                <article className="landing-feature-card" key={numero}>
                                    <div className="landing-feature-top"><span className="landing-feature-icon"><Icone fontSize="inherit" /></span><span>{numero} / 04</span></div>
                                    <div><h3>{titulo}</h3><p>{descricao}</p></div>
                                    <span className="landing-feature-arrow" aria-hidden="true"><NorthEastRoundedIcon fontSize="inherit" /></span>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>

                <section id="como-funciona" className="landing-workflow landing-container">
                    <div className="landing-section-label"><span>03 / COMO FUNCIONA</span><span className="landing-label-line" /></div>
                    <div className="landing-workflow-grid">
                        <div><h2>Da primeira conversa<br /><span>ao próximo passo.</span></h2><p>Uma rotina mais organizada começa com uma visão clara do que precisa de atenção.</p><a className="landing-text-link" href={acessoEmpresa}>Acessar meu ambiente <ArrowForwardRoundedIcon fontSize="inherit" /></a></div>
                        <div className="landing-steps">
                            <div><span>01</span><div><h3>Reúna seus contatos</h3><p>Mantenha os dados dos clientes acessíveis para sua equipe.</p></div><ArrowOutwardRoundedIcon fontSize="small" /></div>
                            <div><span>02</span><div><h3>Acompanhe oportunidades</h3><p>Visualize as etapas e dê continuidade às negociações.</p></div><ArrowOutwardRoundedIcon fontSize="small" /></div>
                            <div><span>03</span><div><h3>Tenha uma visão do negócio</h3><p>Consulte informações para apoiar suas decisões.</p></div><ArrowOutwardRoundedIcon fontSize="small" /></div>
                        </div>
                    </div>
                </section>

                <section className="landing-final">
                    <div className="landing-container landing-final-inner">
                        <div className="landing-final-star" aria-hidden="true">✳</div>
                        <div><span className="landing-final-label">FEITO PARA ESTAR MAIS PERTO</span><h2>Vamos organizar<br />o próximo passo?</h2><p>Mais proximidade com seus clientes. Mais clareza para o seu negócio.</p></div>
                        <a className="landing-button landing-button-white" href={acessoEmpresa}>Acessar sistema <ArrowForwardRoundedIcon fontSize="inherit" /></a>
                    </div>
                </section>
            </main>

            <footer className="landing-footer">
                <div className="landing-container">
                    <div className="landing-footer-main"><div><a className="landing-logo" href="#inicio">ProxiUs<span>.</span></a><p>Conectando pessoas, negócios<br />e possibilidades.</p></div><div className="landing-footer-links"><a href="#plataforma">Plataforma</a><a href="#recursos">Recursos</a><a href="#como-funciona">Como funciona</a><Link to="/wcmadmin">Administração da plataforma</Link></div></div>
                    <div className="landing-footer-bottom"><span>© {new Date().getFullYear()} ProxiUs.</span><span>FEITO PARA ESTAR MAIS PERTO.</span></div>
                </div>
            </footer>
        </div>
    );
}
