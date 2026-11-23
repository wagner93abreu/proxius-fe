import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Usuarios from "./pages/Usuarios";
import PaginaBase from "./pages/PaginaBase";
import PaginaBaseFormulario from "./pages/PaginaBaseFormulario";
import Login from "./pages/Login";
import Cadastro from "./pages/Cadastro";
import RotaPrivada from "./utils/RotaPrivada";
import Home from "./pages/Home";
import PainelDeControle from "./pages/PaineldeControle";
import GestaoBibliotecas from "./pages/GestaoBibliotecas";
import GestaoModelosArquivo from "./pages/GestaoModelosArquivo";
import MeuPerfil from "./pages/MeuPerfil";
import Clifor from "./pages/Clifor";
import Checkout from "./pages/checkout";
import Vendas from "./pages/Vendas";
import Precificacao from "./pages/Precificacao";
import Financeiro from "./pages/Financeiro";
import CategoriasFinanceiro from "./pages/CategoriasFinanceiro";
import Produtos from "./pages/Produto";
import Taxas from "./pages/Taxas";
import Meta from "./pages/Meta";
import Comissao from "./pages/Comissao";
import PainelNF from "./pages/PainelNF";
import Crm from "./pages/Crm";
import DashBoardResumo from "./pages/DashBoardResumo";
import MetricasVendas from "./pages/MetricasVendas";
import AreaCliente from "./pages/AreaCliente";
import AreaClienteAtendente from "./pages/AreaClienteAtendente";
import Precrm from "./pages/Precrm";
import ContractTemplate from "./pages/ContractTemplate";
import RedefinirSenha from "./pages/RedefinirSenha";
import WcmAdmin from "./pages/WcmAdmin";
import PlataformaInicial from "./pages/PlataformaInicial";
import IntegracaoAsaas from "./pages/IntegracaoAsaas";
import Armazenamento from "./pages/Armazenamento";



function AppRoutes(){
    if (window.location.hostname === "localhost") {
        return <BrowserRouter><Routes>
            <Route path="/" element={<PlataformaInicial />} />
            <Route path="/wcmadmin" element={<WcmAdmin />} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes></BrowserRouter>;
    }
    return(
        <BrowserRouter>
        <Routes>
            <Route path="/wcmadmin" element={<WcmAdmin />} />
            <Route path="/" element={<PlataformaInicial />} />
            <Route path="/" element={<PaginaBase/>}>
                <Route element={<RotaPrivada />}>
                    <Route path="/usuarios" element={<Usuarios />} />
                    <Route path="/home" element={<Home />} />
                    <Route path="/dashboardResumo" element={<DashBoardResumo />} />
                    <Route path="/metricasVendas" element={<MetricasVendas />} />
                    <Route path="/painelDeControle" element={<PainelDeControle />} />
                    <Route path="/painelDeControle/integracoes/asaas" element={<IntegracaoAsaas />} />
                    <Route path="/painelDeControle/armazenamento" element={<Armazenamento />} />
                    <Route path="/painelDeControle/bibliotecas" element={<GestaoBibliotecas />} />
                    <Route path="/painelDeControle/modelos-arquivo" element={<GestaoModelosArquivo />} />
                    <Route path="/meuPerfil" element={<MeuPerfil />} />
                    <Route path="/clifor" element={<Clifor />} />
                    <Route path="/precificacao" element={<Precificacao idProd={''}/>} />
                    <Route path="/financeiro" element={<Financeiro />} />
                    <Route path="/categoriasFinanceiro" element={<CategoriasFinanceiro />} />
                    <Route path="/vendas" element={<Vendas />} />
                    <Route path="/produtos" element={<Produtos />} />
                    <Route path="/templatesContrato" element={<ContractTemplate />} />
                    <Route path="/taxas" element={<Taxas />} />
                    <Route path="/meta" element={<Meta />} />
                    <Route path="/comissao" element={<Comissao />} />
                    <Route path="/painelNF" element={<PainelNF />} />
                    <Route path="/crm" element={<Crm />} />
                    <Route path="/precrm" element={<Precrm />} />
                    <Route path="/areaCliente" element={<AreaCliente />} />
                    <Route path="/AreaClienteAtendente/:codCliente" element={<AreaClienteAtendente />} />
                </Route>
            </Route>
            <Route path="/" element={<PaginaBaseFormulario/>}>
                <Route path="/login" element={<Login />} />
                <Route path="/redefinir-senha" element={<RedefinirSenha />} />
                {/* <Route path="/cadastro" element={<Cadastro />} />    */}             
            </Route>    
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/checkout/:salesProcessUuid" element={<Checkout />} />                
        </Routes>
        </BrowserRouter>
    )
}

export default AppRoutes;

/* function AppRoutes(){
    return(
        <BrowserRouter>
        <Routes>
            <Route path="/" element={<PaginaBase/>}>
                <Route index element={<PaginaInicial />} />
                <Route element={<RotaPrivada />}>
                    <Route path="/Usuarios" element={<Usuarios />} />
                </Route>
            </Route>
            <Route path="/" element={<PaginaBaseFormulario/>}>
                <Route path="/login" element={<Login />} />
                <Route path="/cadastro" element={<Cadastro />} />                
            </Route>    
        </Routes>
        </BrowserRouter>
    )
} */