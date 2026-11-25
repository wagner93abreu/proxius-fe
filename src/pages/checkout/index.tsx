import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Grid } from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useForm } from "react-hook-form";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import styled from "styled-components";
import InputMask from "react-input-mask";
import axios from "axios";
import http from "../../http";
import Titulo from "../../components/Titulo";
import LogoProxiUs from "../../components/LogoProxiUs";
import IClifor from "../../types/IClifor";
import { removeNotNumber } from "../../customFunctions/mascarasFormatacao";
import { mostrarMensagem } from "../../stores/mensagem.store";
import { centralRegistrationPreviewEnabled, centralRootOrigin } from "../../centralIdentity";

type SurfaceProps = {
    $light?: boolean;
};

const ContainerPrincipal = styled.div<SurfaceProps>`
    min-height: 100vh;
    padding: 32px 16px;
    background: ${({ $light }) => $light
        ? 'linear-gradient(180deg, #f6f6f6 0%, #e8e8e8 100%)'
        : 'radial-gradient(circle at top left, rgba(190, 190, 190, 0.18), transparent 34%), radial-gradient(circle at top right, rgba(45, 45, 45, 0.24), transparent 28%), linear-gradient(180deg, #171717 0%, #222222 48%, #141414 100%)'};
    color: ${({ $light }) => $light ? '#141414' : '#fff'};
`;

const Layout = styled.div`
    width: min(1160px, 100%);
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 24px;
`;

const Hero = styled.section<SurfaceProps>`
    background: ${({ $light }) => $light
        ? 'linear-gradient(180deg, rgba(255,255,255,0.7), rgba(255,255,255,0.5))'
        : 'linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))'};
    border: 1px solid ${({ $light }) => $light ? 'rgba(20, 20, 20, 0.14)' : 'rgba(190, 190, 190, 0.18)'};
    border-radius: 20px;
    padding: 32px;
    color: ${({ $light }) => $light ? '#141414' : '#fff'};
`;

const HeroHeader = styled.div`
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    min-height: 64px;

    @media (max-width: 700px) {
        flex-direction: column;
        align-items: center;
    }
`;

const HeroLogo = styled.div`
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    border-radius: 12px;
    background: #141414;
    color: #fff;
    flex-shrink: 0;
`;

const HeroTitleBlock = styled.div<SurfaceProps>`
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);

    h2 {
        color: ${({ $light }) => $light ? '#141414' : 'var(--cinza-claro)'};
        margin: 0;
    }

    @media (max-width: 700px) {
        position: static;
        transform: none;
    }
`;

const HeroToggleButton = styled.button<SurfaceProps>`
    border: 1px solid ${({ $light }) => $light ? 'rgba(20, 20, 20, 0.18)' : 'rgba(190, 190, 190, 0.28)'};
    background: ${({ $light }) => $light ? 'rgba(20, 20, 20, 0.08)' : 'rgba(190, 190, 190, 0.12)'};
    color: ${({ $light }) => $light ? '#141414' : '#dedede'};
    border-radius: 999px;
    padding: 10px 16px;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    transition: background 0.2s ease, transform 0.2s ease;

    &:hover {
        background: ${({ $light }) => $light ? 'rgba(20, 20, 20, 0.14)' : 'rgba(190, 190, 190, 0.2)'};
        transform: translateY(-1px);
    }

    @media (max-width: 700px) {
        width: 100%;
    }
`;

const HeroContent = styled.div`
    margin-top: 20px;

`;

const Panel = styled.section<SurfaceProps>`
    background: ${({ $light }) => $light ? 'rgba(255,255,255,0.62)' : 'rgba(255,255,255,0.04)'};
    border: 1px solid ${({ $light }) => $light ? 'rgba(20, 20, 20, 0.12)' : 'rgba(255,255,255,0.08)'};
    border-radius: 20px;
    padding: 28px;
    box-shadow: ${({ $light }) => $light ? '0 24px 60px rgba(20, 20, 20, 0.12)' : '0 24px 60px rgba(0,0,0,0.25)'};
    color: ${({ $light }) => $light ? '#141414' : '#fff'};
`;

const SectionTitle = styled.h3<SurfaceProps>`
    margin: 24px 0 10px;
    color: ${({ $light }) => $light ? '#141414' : '#eeeeee'};
    font-size: 18px;
`;

const Badge = styled.div<SurfaceProps>`
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border-radius: 999px;
    background: ${({ $light }) => $light ? 'rgba(20, 20, 20, 0.08)' : 'rgba(190, 190, 190, 0.14)'};
    color: ${({ $light }) => $light ? '#141414' : '#dedede'};
    font-size: 13px;
    margin-bottom: 16px;
`;

const SuccessBox = styled.div<SurfaceProps>`
    margin-top: 20px;
    padding: 16px;
    border-radius: 14px;
    background: ${({ $light }) => $light ? 'rgba(150, 150, 150, 0.16)' : 'rgba(110, 110, 110, 0.16)'};
    border: 1px solid ${({ $light }) => $light ? 'rgba(110, 110, 110, 0.28)' : 'rgba(110, 110, 110, 0.35)'};
    color: ${({ $light }) => $light ? '#333333' : '#eeeeee'};
`;

const ErrorBox = styled.div<SurfaceProps>`
    margin-top: 20px;
    padding: 16px;
    border-radius: 14px;
    background: ${({ $light }) => $light ? 'rgba(65, 65, 65, 0.08)' : 'rgba(80, 80, 80, 0.18)'};
    border: 1px solid ${({ $light }) => $light ? 'rgba(65, 65, 65, 0.22)' : 'rgba(130, 130, 130, 0.35)'};
    color: ${({ $light }) => $light ? '#333333' : '#eeeeee'};
`;

const InfoBox = styled.div<SurfaceProps>`
    margin-top: 18px;
    padding: 16px;
    border-radius: 16px;
    background: ${({ $light }) => $light ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.05)'};
    border: 1px solid ${({ $light }) => $light ? 'rgba(20, 20, 20, 0.12)' : 'rgba(255,255,255,0.08)'};
    color: ${({ $light }) => $light ? '#141414' : 'inherit'};
`;

const AsaasBrandRow = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
`;

// Selo textual (nao reproduz a arte oficial da marca) so para identificar visualmente o Asaas como destino do link.
const AsaasLogoBadge = styled.span`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 6px 14px;
    border-radius: 999px;
    background: #ffffff;
    color: #555555;
    font-weight: 800;
    font-size: 15px;
    font-style: italic;
    letter-spacing: 0.02em;
`;

const LoadingShell = styled.div<SurfaceProps>`
    min-height: 420px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: 16px;
    color: ${({ $light }) => $light ? 'rgba(20, 20, 20, 0.82)' : 'rgba(255,255,255,0.76)'};
`;

const ContractHeader = styled.div<SurfaceProps>`
    display: flex;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 20px;
    flex-wrap: wrap;
    color: ${({ $light }) => $light ? '#141414' : '#fff'};

    h2 {
        color: ${({ $light }) => $light ? '#141414' : 'var(--cinza-claro)'};
    }
`;

const ContractMeta = styled.div`
    display: grid;
    grid-template-columns: repeat(2, minmax(180px, 1fr));
    gap: 12px;
    margin-top: 18px;

    @media (max-width: 700px) {
        grid-template-columns: 1fr;
    }
`;

const MetaCard = styled.div<SurfaceProps>`
    padding: 14px;
    border-radius: 16px;
    background: ${({ $light }) => $light ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.04)'};
    border: 1px solid ${({ $light }) => $light ? 'rgba(20, 20, 20, 0.1)' : 'rgba(255,255,255,0.07)'};

    strong {
        display: block;
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: ${({ $light }) => $light ? 'rgba(20, 20, 20, 0.62)' : 'rgba(255,255,255,0.55)'};
        margin-bottom: 8px;
    }

    span {
        color: ${({ $light }) => $light ? '#141414' : '#fff'};
        line-height: 1.5;
    }
`;

const ContractDocument = styled.article<SurfaceProps>`
    margin-top: 20px;
    padding: 28px;
    border-radius: 20px;
    background: ${({ $light }) => $light
        ? 'linear-gradient(180deg, rgba(255,255,255,0.58), rgba(255,255,255,0.42))'
        : 'linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))'};
    border: 1px solid ${({ $light }) => $light ? 'rgba(20, 20, 20, 0.1)' : 'rgba(255,255,255,0.08)'};
    color: ${({ $light }) => $light ? '#141414' : 'rgba(255,255,255,0.9)'};
    line-height: 1.7;
    overflow: hidden;

    h2 {
        margin: 0 0 8px;
        font-size: 28px;
        color: ${({ $light }) => $light ? '#141414' : '#fff'};
    }

    h3 {
        margin: 24px 0 10px;
        font-size: 16px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: ${({ $light }) => $light ? '#333333' : '#dedede'};
    }

    p {
        margin: 0 0 12px;
    }

    ul {
        margin: 0 0 12px;
        padding-left: 20px;
    }

    li {
        margin-bottom: 8px;
    }
`;

const ContractFrameShell = styled.div`
    width: 100%;
    max-width: 920px;
    margin: 0 auto;
    border-radius: 18px;
    overflow: hidden;
    background: #fff;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.22);
`;

const ContractIframe = styled.iframe`
    width: 100%;
    border: 0;
    display: block;
    background: #fff;
`;

const RichBlock = styled.div`
    white-space: pre-wrap;
    word-break: break-word;
`;

const AcceptanceBox = styled.div<SurfaceProps>`
    margin-top: 24px;
    padding: 20px;
    border-radius: 18px;
    background: ${({ $light }) => $light ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.04)'};
    border: 1px solid ${({ $light }) => $light ? 'rgba(20, 20, 20, 0.1)' : 'rgba(255,255,255,0.08)'};
`;

const CheckboxRow = styled.label<SurfaceProps>`
    display: flex;
    align-items: flex-start;
    gap: 12px;
    cursor: pointer;
    color: ${({ $light }) => $light ? '#141414' : 'rgba(255,255,255,0.88)'};
    line-height: 1.5;

    input {
        margin-top: 4px;
        width: 18px;
        height: 18px;
    }
`;

const PaymentOptionCard = styled.label<SurfaceProps & { $selected?: boolean }>`
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 16px;
    border-radius: 14px;
    cursor: pointer;
    margin-bottom: 12px;
    color: ${({ $light }) => $light ? '#141414' : '#fff'};
    background: ${({ $light, $selected }) => $selected
        ? ($light ? 'rgba(20, 20, 20, 0.12)' : 'rgba(190, 190, 190, 0.16)')
        : ($light ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.04)')};
    border: 1px solid ${({ $light, $selected }) => $selected
        ? ($light ? 'rgba(20, 20, 20, 0.35)' : 'rgba(190, 190, 190, 0.5)')
        : ($light ? 'rgba(20, 20, 20, 0.12)' : 'rgba(255,255,255,0.08)')};

    input {
        margin-top: 4px;
    }
`;

const Campo = styled.input<SurfaceProps>`
    color: ${({ $light }) => $light ? '#141414' : 'rgb(255, 255, 255)'};
    font-size: 15px;
    background: ${({ $light }) => $light ? 'rgba(255, 255, 255, 0.78)' : 'rgba(240, 240, 240, 0.08)'};
    margin-top: 3px;
    margin-bottom: 0px;
    box-sizing: border-box;
    box-shadow: ${({ $light }) => $light ? '0 8px 24px rgba(20, 20, 20, 0.08)' : '2px 2px 6px rgba(0,0,0,0.25)'};
    border-radius: 3px;
    border: ${({ $light }) => $light ? '1px solid rgba(20, 20, 20, 0.12)' : 'none'};
    width: 100%;
    padding: 10px;
    &::placeholder {
        color: ${({ $light }) => $light ? 'rgba(20, 20, 20, 0.45)' : '#aaa'};
    }
`;

const CampoSelect = styled.select<SurfaceProps>`
    background: ${({ $light }) => $light ? 'rgba(255, 255, 255, 0.78)' : 'rgba(240, 240, 240, 0.08)'};
    color: ${({ $light }) => $light ? '#141414' : '#fff'};
    margin-top: 3px;
    margin-bottom: 0px;
    box-sizing: border-box;
    box-shadow: ${({ $light }) => $light ? '0 8px 24px rgba(20, 20, 20, 0.08)' : '2px 2px 6px rgba(0,0,0,0.25)'};
    border-radius: 3px;
    border: ${({ $light }) => $light ? '1px solid rgba(20, 20, 20, 0.12)' : 'none'};
    width: 100%;
    padding: 10px;
`;

const ValorTotalTexto = styled.div<SurfaceProps>`
    color: ${({ $light }) => $light ? '#141414' : '#fff'};
    font-size: 15px;
    font-weight: 700;
    margin-top: 3px;
    padding: 10px 0;
`;

const InputMaskCustomizado = styled(InputMask)<SurfaceProps>`
    color: ${({ $light }) => $light ? '#141414' : 'rgb(255, 255, 255)'};
    font-size: 15px;
    background: ${({ $light }) => $light ? 'rgba(255, 255, 255, 0.78)' : 'rgba(240, 240, 240, 0.08)'};
    margin-top: 3px;
    margin-bottom: 0px;
    box-sizing: border-box;
    box-shadow: ${({ $light }) => $light ? '0 8px 24px rgba(20, 20, 20, 0.08)' : '2px 2px 6px rgba(0,0,0,0.25)'};
    border-radius: 3px;
    border: ${({ $light }) => $light ? '1px solid rgba(20, 20, 20, 0.12)' : 'none'};
    width: 100%;
    padding: 10px;
    &::placeholder {
        color: ${({ $light }) => $light ? 'rgba(20, 20, 20, 0.45)' : '#aaa'};
    }
`;

const Rotulo = styled.label<SurfaceProps>`
    display: block;
    font-weight: 700;
    font-size: 16px;
    line-height: 19px;
    color: ${({ $light }) => $light ? '#141414' : '#eeeeee'};
`;

const ContainerInput = styled.div`
    width: 100%;
`;

const SpanErro = styled.span<SurfaceProps>`
    display: block;
    color: ${({ $light }) => $light ? '#444444' : '#dddddd'};
    font-size: 13px;
    margin-top: 6px;
`;

type CadastroEtapa = 'cpf' | 'email' | 'codigo' | 'identificacao' | 'endereco';

type CheckoutFormValues = {
    cpfcnpj: string;
    nomesocial: string;
    nomecomercial: string;
    email: string;
    telefone?: string;
    cep?: string;
    logradouro?: string;
    bairro?: string;
    cidade?: string;
    uf?: string;
    numero?: string;
    complemento?: string;
};

type SalesProcessCheckoutItem = {
    product: string;
    quantity: number;
    finalPrice: number;
};

type SalesProcessCheckoutPagamento = {
    id?: number;
    tipopagamento: string;
    parcelas?: number | null;
    tipoDesconto?: string | null;
    valorDesconto?: number | null;
    parcelaMaxDesconto?: number | null;
    status?: string | null;
    cobrancaUrl?: string | null;
    pixQrcode?: string | null;
};

type SalesProcessCheckoutResponse = {
    id: number;
    uuid: string;
    cardId: string;
    productId?: number;
    productName?: string;
    pricingId?: number;
    productValue?: number;
    itens?: SalesProcessCheckoutItem[];
    pagamento?: SalesProcessCheckoutPagamento[];
    status: string;
    coupon: string | null;
    temporaryLinkExpiresAt: string;
    temporaryAccessUrl: string;
    createdCustomerId: number | null;
    createdUserId?: number | null;
    cliente: IClifor | null;
    htmlTemplate?: string | null;
};

type CheckoutInvitationStatus = {
    status: string;
    invitationSent: boolean;
    pendingAcceptance: boolean;
};

type DadosCriacaoCobrancaSalesProcess = {
    salesProcessId: number;
    pagamentoId: number;
    parcelas: number;
};

type DadosCobrancaSalesProcess = {
    pagamentoId: number;
    asaasPaymentId: string;
    status: string;
    valorTotal: number;
    parcelas: number;
    cobrancaUrl: string | null;
    pixQrcode: string | null;
};

type CobrancaAtiva = {
    pagamentoId?: number;
    cobrancaUrl: string | null;
    pixQrcode: string | null;
};

const buildInitialMessage = (searchParams: URLSearchParams) => {
    const cardId = searchParams.get('cardId');
    const produtoId = searchParams.get('produtoId');
    const precoId = searchParams.get('precoId');
    const produto = searchParams.get('produto');
    const preco = searchParams.get('preco');

    return {
        cardId,
        produtoId,
        precoId,
        produto,
        preco,
        resumo: [produto, preco].filter(Boolean).join(' • '),
    };
};

const formatCurrency = (moeda?: string | null, valor?: string | number | null) => {
    if (valor === undefined || valor === null || valor === '') {
        return '-';
    }

    const numericValue = typeof valor === 'number' ? valor : Number(String(valor).replace(',', '.'));

    if (Number.isNaN(numericValue)) {
        return String(valor);
    }

    const normalizedCurrency = (moeda || 'BRL').toUpperCase() === 'REAL' ? 'BRL' : (moeda || 'BRL').toUpperCase();

    try {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: normalizedCurrency,
        }).format(numericValue);
    } catch {
        return new Intl.NumberFormat('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(numericValue);
    }
};

const formatDocument = (tipoCadastro: 'FISICA' | 'JURIDICA', documento?: string | null) => {
    if (!documento) {
        return '-';
    }

    const onlyNumbers = removeNotNumber(documento);

    if (tipoCadastro === 'JURIDICA' && onlyNumbers.length === 14) {
        return onlyNumbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }

    if (onlyNumbers.length === 11) {
        return onlyNumbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }

    return documento;
};

const formatPhone = (telefone?: string | null) => {
    if (!telefone) {
        return '-';
    }

    const onlyNumbers = removeNotNumber(telefone);

    if (onlyNumbers.length === 11) {
        return onlyNumbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }

    if (onlyNumbers.length === 10) {
        return onlyNumbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }

    return telefone;
};

const buildPhone = (clifor?: IClifor | null) => {
    if (!clifor) {
        return '-';
    }

    const telefoneDigits = removeNotNumber(clifor.telefone ?? '');

    // O telefone ja pode vir com o ddd embutido (ex.: "(31) 98363-3643"); so concatena o ddd separado quando faltar.
    if (telefoneDigits.length === 10 || telefoneDigits.length === 11) {
        return formatPhone(telefoneDigits);
    }

    const combinedPhone = [clifor.ddd, clifor.telefone].filter(Boolean).join('');

    if (combinedPhone) {
        return formatPhone(combinedPhone);
    }

    return formatPhone(clifor.telefone);
};

const formatAddress = (clifor?: IClifor | null) => {
    if (!clifor?.endereco) {
        return '-';
    }

    const { logradouro, numero, complemento, bairro, cidade, uf, cep, pais } = clifor.endereco;

    return [
        [logradouro, numero].filter(Boolean).join(', '),
        complemento,
        bairro,
        [cidade, uf].filter(Boolean).join(' - '),
        cep,
        pais,
    ].filter(Boolean).join(' | ');
};

const getTipoCadastro = (clifor?: IClifor | null): 'FISICA' | 'JURIDICA' => {
    const documento = removeNotNumber(clifor?.cpfcnpj ?? '');
    return documento.length > 11 ? 'JURIDICA' : 'FISICA';
};

// CREDITO / CREDITO - CLIENTE / CREDITO - FORNECEDOR sao sempre exibidos como Cartao de Credito no contrato.
const formatTipoPagamento = (tipopagamento?: string | null) => {
    const tipo = (tipopagamento || '').trim().toUpperCase();

    if (tipo === 'CREDITO' || tipo === 'CREDITO - CLIENTE' || tipo === 'CREDITO - FORNECEDOR') {
        return 'Cartão de Crédito';
    }

    switch (tipo) {
        case 'PIX':
            return 'PIX';
        case 'BOLETO':
            return 'Boleto';
        case 'DEBITO':
            return 'Cartão de Débito';
        case 'GRATUITO':
            return 'Gratuito';
        default:
            return tipopagamento || '-';
    }
};

const formatDesconto = (tipoDesconto?: string | null, valorDesconto?: number | null) => {
    if (!valorDesconto) {
        return '-';
    }

    const tipo = (tipoDesconto || '').trim().toUpperCase();

    if (tipo === 'PERCENT' || tipo === 'PERCENTAGE') {
        return `${valorDesconto}%`;
    }

    return formatCurrency('BRL', valorDesconto);
};

const buildItensPlaceholder = (itens: SalesProcessCheckoutItem[]) => {
    if (itens.length === 0) {
        return '-';
    }

    return itens.map((item) => item.product).join('<br />');
};

const buildPagamentoPlaceholder = (pagamentos: SalesProcessCheckoutPagamento[]) => {
    if (pagamentos.length === 0) {
        return '-';
    }

    return pagamentos
        .map((pagamento) => {
            const linhas = [
                `Tipo de pagamento: ${formatTipoPagamento(pagamento.tipopagamento)}`,
                `Parcelas: ${pagamento.parcelas ? `${pagamento.parcelas}x` : '-'}`,
                `Desconto: ${formatDesconto(pagamento.tipoDesconto, pagamento.valorDesconto)}`,
            ];

            if (pagamento.parcelaMaxDesconto) {
                linhas.push(`Desconto aplicado no parcelamento até: ${pagamento.parcelaMaxDesconto}x`);
            }

            return linhas.join('<br />');
        })
        .join('<br /><br />');
};

type OpcaoParcela = {
    parcela: number;
    valorParcela: number;
    valorTotal: number;
};

const getParcelaConfig = (pagamento: SalesProcessCheckoutPagamento) => {
    const maxParcelas = pagamento.parcelas && pagamento.parcelas > 0 ? pagamento.parcelas : 1;
    const tipoDesconto = (pagamento.tipoDesconto || '').trim().toUpperCase();
    const valorDesconto = pagamento.valorDesconto ?? 0;
    const limiteParcelasDesconto = pagamento.parcelaMaxDesconto && pagamento.parcelaMaxDesconto > 0 ? pagamento.parcelaMaxDesconto : maxParcelas;

    return { maxParcelas, tipoDesconto, valorDesconto, limiteParcelasDesconto };
};

// Replica o parcelamento/desconto ja configurado no Asaas para o cliente escolher a condicao antes do redirecionamento.
const buildParcelaOpcoes = (pagamento: SalesProcessCheckoutPagamento, totalContrato: number): OpcaoParcela[] => {
    const { maxParcelas, tipoDesconto, valorDesconto, limiteParcelasDesconto } = getParcelaConfig(pagamento);
    const opcoes: OpcaoParcela[] = [];

    for (let parcela = 1; parcela <= maxParcelas; parcela += 1) {
        const aplicaDesconto = valorDesconto > 0 && parcela <= limiteParcelasDesconto;
        const valorTotal = aplicaDesconto
            ? (tipoDesconto === 'PERCENT' || tipoDesconto === 'PERCENTAGE'
                ? totalContrato * (1 - valorDesconto / 100)
                : Math.max(totalContrato - valorDesconto, 0))
            : totalContrato;

        opcoes.push({
            parcela,
            valorParcela: valorTotal / parcela,
            valorTotal,
        });
    }

    return opcoes;
};

// Ex.: "Cartao de Credito (5% de desconto em ate 3 parcelas)" ou "PIX (10% de desconto)".
const buildDescontoLabel = (pagamento: SalesProcessCheckoutPagamento): string => {
    const { maxParcelas, tipoDesconto, valorDesconto, limiteParcelasDesconto } = getParcelaConfig(pagamento);

    if (!valorDesconto) {
        return '';
    }

    const valorLabel = tipoDesconto === 'PERCENT' || tipoDesconto === 'PERCENTAGE'
        ? `${valorDesconto}%`
        : formatCurrency('BRL', valorDesconto);

    return maxParcelas <= 1
        ? `${valorLabel} de desconto`
        : `${valorLabel} de desconto em até ${limiteParcelasDesconto} parcelas`;
};

const applyContractPlaceholders = (template: string, placeholders: Record<string, string>) => {
    return Object.entries(placeholders).reduce((processedTemplate, [token, value]) => {
        return processedTemplate.split(token).join(value);
    }, template);
};

export default function Checkout() {
    const { salesProcessUuid } = useParams<{ salesProcessUuid: string }>();
    const [searchParams] = useSearchParams();
    const { cardId, produto, preco, resumo } = useMemo(() => buildInitialMessage(searchParams), [searchParams]);
    const salesProcessToken = searchParams.get('token');
    const navigate = useNavigate();
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [loadingContext, setLoadingContext] = useState(false);
    const [cadastroEtapa, setCadastroEtapa] = useState<CadastroEtapa>('cpf');
    const [verificandoCpf, setVerificandoCpf] = useState(false);
    const [erroEtapaCpf, setErroEtapaCpf] = useState('');
    const [emailMascarado, setEmailMascarado] = useState('');
    const [emailVerificado, setEmailVerificado] = useState('');
    const [emailDestinoCodigo, setEmailDestinoCodigo] = useState('');
    const [codigoCpfExistente, setCodigoCpfExistente] = useState(false);
    const [retornoCodigo, setRetornoCodigo] = useState<'identificacao' | 'endereco'>('identificacao');
    const [codigoVerificacao, setCodigoVerificacao] = useState('');
    const [confirmandoCodigo, setConfirmandoCodigo] = useState(false);
    const [erroEtapaCodigo, setErroEtapaCodigo] = useState('');
    const [buscandoCep, setBuscandoCep] = useState(false);
    const [enderecoCepPesquisado, setEnderecoCepPesquisado] = useState(false);
    const [mensagemCep, setMensagemCep] = useState('');
    const [salesProcess, setSalesProcess] = useState<SalesProcessCheckoutResponse | null>(null);
    const [contractTemplate, setContractTemplate] = useState<string>('');
    const [aceiteMarcado, setAceiteMarcado] = useState(false);
    const [aceiteMensagem, setAceiteMensagem] = useState('');
    const [enviandoAceite, setEnviandoAceite] = useState(false);
    const [aceiteErro, setAceiteErro] = useState('');
    const [aceiteErroModalAberto, setAceiteErroModalAberto] = useState(false);
    const [loginNome, setLoginNome] = useState('');
    const [loginEmailUsuario, setLoginEmailUsuario] = useState('');
    const [loginSenha, setLoginSenha] = useState('');
    const [loginConfirmarSenha, setLoginConfirmarSenha] = useState('');
    const [loginErro, setLoginErro] = useState('');
    const [criandoLogin, setCriandoLogin] = useState(false);
    const [reenviandoConvite, setReenviandoConvite] = useState(false);
    const [convitePendenteAceite, setConvitePendenteAceite] = useState<boolean | null>(null);
    const [pagamentoSelecionadoIndex, setPagamentoSelecionadoIndex] = useState<number | null>(null);
    const [parcelasSelecionadas, setParcelasSelecionadas] = useState<Record<number, number | ''>>({});
    const [cobrancaAtual, setCobrancaAtual] = useState<CobrancaAtiva | null>(null);
    const [gerandoCobranca, setGerandoCobranca] = useState(false);
    const [alterarFormaPagamento, setAlterarFormaPagamento] = useState(false);
    const [heroCollapsed, setHeroCollapsed] = useState(false);
    const [contractFrameHeight, setContractFrameHeight] = useState(960);
    const contractFrameRef = React.useRef<HTMLIFrameElement | null>(null);
    const { register, handleSubmit, reset, trigger, setValue, getValues, formState: { errors }, watch } = useForm<CheckoutFormValues>({
        defaultValues: {
            cpfcnpj: '',
            nomesocial: '',
            nomecomercial: '',
            email: '',
            telefone: '',
        },
    });

    const maskCpfCnpj = '999.999.999-99';
    const centralCheckoutRegistration = centralRegistrationPreviewEnabled();

    const loadSalesProcessContext = useCallback(async () => {
        if (!salesProcessUuid) {
            setSalesProcess(null);
            setContractTemplate('');
            return null;
        }

        if (!salesProcessToken) {
            setErrorMessage('Token de acesso do checkout nao informado.');
            setSalesProcess(null);
            return null;
        }

        try {
            const { data } = await http.get<SalesProcessCheckoutResponse>(`sales-process/${salesProcessUuid}`, {
                headers: {
                    'X-Sales-Process-Token': salesProcessToken,
                },
            });

            setSalesProcess(data);
            if (centralCheckoutRegistration && data.createdUserId) {
                try {
                    const invitation = await http.get<CheckoutInvitationStatus>(
                        `sales-process/${salesProcessUuid}/user-registration/invitation-status`,
                        { headers: { 'X-Sales-Process-Token': salesProcessToken } }
                    );
                    setConvitePendenteAceite(invitation.data.pendingAcceptance);
                } catch {
                    setLoginErro('Não foi possível consultar o estado do convite. Atualize a página para tentar novamente.');
                }
            } else {
                setConvitePendenteAceite(false);
            }
            const normalizedStatus = (data.status || '').trim().toUpperCase();
            const templateFromProcess = typeof data.htmlTemplate === 'string' ? data.htmlTemplate : '';

            const pagamentoComCobrancaAtivo = (data.pagamento ?? []).find((pagamento) => Boolean(pagamento.cobrancaUrl));
            setCobrancaAtual(pagamentoComCobrancaAtivo ? {
                pagamentoId: pagamentoComCobrancaAtivo.id,
                cobrancaUrl: pagamentoComCobrancaAtivo.cobrancaUrl ?? null,
                pixQrcode: pagamentoComCobrancaAtivo.pixQrcode ?? null,
            } : null);

            if (normalizedStatus === 'CONTRACT_GENERATED' && templateFromProcess.trim()) {
                setContractTemplate(templateFromProcess);
            } else {
                setContractTemplate('');
            }

            return data;
        } catch {
            setErrorMessage('Nao foi possivel validar o link temporario do checkout.');
            setSalesProcess(null);
            setContractTemplate('');
            return null;
        }
    }, [centralCheckoutRegistration, salesProcessToken, salesProcessUuid]);

    useEffect(() => {
        const load = async () => {
            setLoadingContext(true);
            setErrorMessage('');
            await loadSalesProcessContext();
            setLoadingContext(false);
        };

        load();
    }, [loadSalesProcessContext]);

    const createUser = async (data: CheckoutFormValues) => {
        setErrorMessage('');
        setSuccessMessage('');
        const telefoneSomenteNumeros = removeNotNumber(data.telefone ?? '');
        const ddd = telefoneSomenteNumeros.length >= 2 ? telefoneSomenteNumeros.slice(0, 2) : null;
        // No sales process o telefone deve ser persistido formatado, ex.: (11) 97440-7154.
        const telefoneFormatado = telefoneSomenteNumeros ? formatPhone(telefoneSomenteNumeros) : null;

        const payload = {
            nomesocial: data.nomesocial ?? '',
            nomecomercial: data.nomecomercial ?? '',
            cpfcnpj: removeNotNumber(data.cpfcnpj ?? ''),
            inscricaoestadual: null,
            inscricaomunicipal: null,
            email: data.email ?? '',
            ddd,
            telefone: telefoneFormatado,
            datanascimento: null,
            genero: null,
            escolaridade: null,
            formacaoacademica: null,
            estadocivil: null,
            ocupacao: null,
            linkedinlink: null,
            linkedinfotolink: null,
            linkDrive: null,
            clifor: 'CLIENTE',
            idusuario: null,
            asaasID: null,
            endereco: {
                pais: 'Brasil',
                cep: removeNotNumber(data.cep ?? ''),
                uf: data.uf ?? '',
                cidade: data.cidade ?? '',
                bairro: data.bairro ?? null,
                logradouro: data.logradouro ?? null,
                complemento: data.complemento ?? null,
                numero: data.numero ?? null,
            },
        };

        try {
            if (salesProcessUuid && salesProcessToken) {
                await http.post(
                    `sales-process/${salesProcessUuid}/customer-registration`,
                    payload,
                    {
                        headers: {
                            'X-Sales-Process-Token': salesProcessToken,
                        },
                    }
                );
            } else {
                const resposta = await http.post<IClifor>('clifor', {
                    ...payload,
                    telefone: data.telefone ?? null,
                    linkedinfotolink: '',
                    active: true,
                });
                const clientId = resposta.data?.id ?? null;
                const resolvedCardId = salesProcess?.cardId ?? cardId;

                if (resolvedCardId) {
                    try {
                        await http.put('card', {
                            id: resolvedCardId,
                            cliente: clientId,
                        });
                    } catch {
                        // Vinculação do card é best-effort no fluxo público.
                    }
                }
            }

            setSuccessMessage('Cadastro concluído com sucesso. Revise o contrato abaixo para seguir com o aceite.');
            reset({
                cpfcnpj: '',
                nomesocial: '',
                nomecomercial: '',
                email: '',
                telefone: '',
            });
            setCadastroEtapa('cpf');
            setEmailMascarado('');
            setCodigoVerificacao('');
            setEnderecoCepPesquisado(false);
            setMensagemCep('');
            setAceiteMarcado(false);
            setAceiteMensagem('');

            await loadSalesProcessContext();
        } catch (erro) {
            mostrarMensagem(erro, "error");
        }
    };

    const handleVerificarCpf = async () => {
        const cpfValido = await trigger('cpfcnpj');
        if (!cpfValido) {
            return;
        }

        const cpfLimpo = removeNotNumber(getValues('cpfcnpj'));
        setErroEtapaCpf('');
        setVerificandoCpf(true);

        try {
            const { data } = await http.get<{ cadastrado: boolean; emailMascarado: string | null }>(`customer-verification/check-cpf?cpf=${cpfLimpo}&salesProcessUuid=${salesProcessUuid}`, {
                headers: {
                    'X-Sales-Process-Token': salesProcessToken,
                },
            });

            if (data?.cadastrado) {
                setCodigoCpfExistente(true);
                setRetornoCodigo('identificacao');
                setEmailMascarado(data.emailMascarado ?? '');
                setCodigoVerificacao('');
                setErroEtapaCodigo('');
                setCadastroEtapa('codigo');
            } else {
                setEmailVerificado('');
                setCadastroEtapa('email');
            }
        } catch (erro) {
            const mensagem = axios.isAxiosError(erro) && typeof erro.response?.data === 'string'
                ? erro.response.data : 'Não foi possível verificar o CPF informado. Tente novamente.';
            if (cadastroEtapa === 'codigo') setErroEtapaCodigo(mensagem);
            else setErroEtapaCpf(mensagem);
        } finally {
            setVerificandoCpf(false);
        }
    };

    const handleEnviarCodigoEmail = async (retorno: 'identificacao' | 'endereco') => {
        if (!(await trigger('email')) || !salesProcessUuid || !salesProcessToken) return;
        const email = getValues('email').trim();
        setVerificandoCpf(true);
        setErroEtapaCodigo('');
        try {
            await http.post('customer-verification/check-email',
                { email, salesProcessUuid },
                { headers: { 'X-Sales-Process-Token': salesProcessToken } });
            setEmailDestinoCodigo(email);
            setEmailMascarado(email);
            setCodigoCpfExistente(false);
            setRetornoCodigo(retorno);
            setCodigoVerificacao('');
            setCadastroEtapa('codigo');
        } catch (erro) {
            setErroEtapaCodigo(axios.isAxiosError(erro) && typeof erro.response?.data === 'string'
                ? erro.response.data : 'Não foi possível enviar o código. Tente novamente.');
        } finally {
            setVerificandoCpf(false);
        }
    };

    const handleConfirmarCodigoEmail = async () => {
        if (!codigoVerificacao.trim()) {
            setErroEtapaCodigo('Informe o codigo recebido por email.');
            return;
        }

        setErroEtapaCodigo('');
        setConfirmandoCodigo(true);

        try {
            const { data } = await http.post<IClifor>(
                'customer-verification/confirm-email-code',
                {
                    code: codigoVerificacao.trim(),
                    salesProcessUuid,
                },
                {
                    headers: {
                        'X-Sales-Process-Token': salesProcessToken,
                    },
                }
            );

            if (data) {
                const telefoneFormatado = buildPhone(data);
                reset({
                cpfcnpj: data.cpfcnpj ?? getValues('cpfcnpj'),
                nomesocial: data.nomesocial ?? '',
                nomecomercial: data.nomecomercial ?? '',
                email: data.email ?? '',
                telefone: telefoneFormatado !== '-' ? telefoneFormatado : '',
                cep: data.endereco?.cep ?? '',
                logradouro: data.endereco?.logradouro ?? '',
                bairro: data.endereco?.bairro ?? '',
                cidade: data.endereco?.cidade ?? '',
                uf: data.endereco?.uf ?? '',
                numero: data.endereco?.numero ?? '',
                complemento: data.endereco?.complemento ?? '',
                });
                setEnderecoCepPesquisado(Boolean(data.endereco?.cep));
            }
            setEmailVerificado((data?.email ?? emailDestinoCodigo).trim().toLowerCase());
            setCadastroEtapa(retornoCodigo);
        } catch (erro: any) {
            const status = erro?.response?.status;
            if (status === 400) {
                setErroEtapaCodigo('Codigo invalido ou expirado. Solicite um novo codigo.');
            } else if (status === 429) {
                setErroEtapaCodigo('Muitas tentativas. Aguarde antes de tentar novamente.');
            } else if (status === 404) {
                setErroEtapaCodigo('Cliente nao encontrado para este email.');
            } else {
                setErroEtapaCodigo('Nao foi possivel confirmar o codigo. Tente novamente.');
            }
        } finally {
            setConfirmandoCodigo(false);
        }
    };

    const handleAvancarIdentificacao = async () => {
        const valido = await trigger(['nomesocial', 'nomecomercial', 'email', 'telefone']);
        if (valido) {
            if (getValues('email').trim().toLowerCase() !== emailVerificado) {
                await handleEnviarCodigoEmail('endereco');
            } else {
                setCadastroEtapa('endereco');
            }
        }
    };

    const handlePesquisarCep = async () => {
        const cepLimpo = removeNotNumber(getValues('cep') ?? '');

        if (cepLimpo.length !== 8) {
            setMensagemCep('Informe um CEP válido com 8 dígitos.');
            return;
        }

        setMensagemCep('');
        setBuscandoCep(true);
        try {
            const { data } = await axios.get(`https://viacep.com.br/ws/${cepLimpo}/json/`);
            if (data?.erro) {
                setValue('logradouro', '');
                setValue('bairro', '');
                setValue('cidade', '');
                setValue('uf', '');
                setMensagemCep('CEP nao encontrado, cadastro manual liberado.');
            } else {
                setValue('logradouro', data.logradouro || '');
                setValue('bairro', data.bairro || '');
                setValue('cidade', data.localidade || '');
                setValue('uf', data.uf || '');
                setMensagemCep('');
            }
            setEnderecoCepPesquisado(true);
        } catch {
            setValue('logradouro', '');
            setValue('bairro', '');
            setValue('cidade', '');
            setValue('uf', '');
            setMensagemCep('CEP nao encontrado, cadastro manual liberado.');
            setEnderecoCepPesquisado(true);
        } finally {
            setBuscandoCep(false);
        }
    };

    const handleAceite = async () => {
        setAceiteMensagem('');
        setErrorMessage('');
        setAceiteErro('');

        if (!salesProcessUuid || !salesProcessToken) {
            setAceiteErro('Nao foi possivel identificar o processo de vendas para registrar o aceite do contrato.');
            setAceiteErroModalAberto(true);
            return;
        }

        setEnviandoAceite(true);

        try {
            await http.post(
                `sales-process/${salesProcessUuid}/contract-file`,
                {},
                {
                    headers: {
                        'X-Sales-Process-Token': salesProcessToken,
                        'Content-Type': 'application/json',
                    },
                }
            );
           
            setAceiteMensagem('Contrato aceito com sucesso.');
            // Recarrega o sales process para refletir o novo status (SELECT_PAYMENT) e avancar para a etapa de pagamento sem precisar recarregar a pagina.
            await loadSalesProcessContext();
        } catch {
            setAceiteErro('Nao foi possivel registrar o aceite do contrato neste momento.');
            setAceiteErroModalAberto(true);
        } finally {
            setEnviandoAceite(false);
        }
    };

    const handleConfirmarFormaPagamento = async () => {
        if (pagamentoSelecionadoIndex === null || !pagamentoEscolhidoContrato || !salesProcess || !salesProcessUuid || !salesProcessToken) {
            return;
        }

        if (!pagamentoEscolhidoContrato.id) {
            setErrorMessage('Nao foi possivel identificar a forma de pagamento selecionada.');
            return;
        }

        const parcelasEscolhidas = pagamentoEscolhidoRequerParcela
            ? Number(parcelasSelecionadas[pagamentoSelecionadoIndex])
            : 1;

        setErrorMessage('');
        setGerandoCobranca(true);

        try {
            const payload: DadosCriacaoCobrancaSalesProcess = {
                salesProcessId: salesProcess.id,
                pagamentoId: pagamentoEscolhidoContrato.id,
                parcelas: parcelasEscolhidas,
            };

            const { data } = await http.post<DadosCobrancaSalesProcess>(
                `sales-process/${salesProcessUuid}/payment-completed`,
                payload,
                {
                    headers: {
                        'X-Sales-Process-Token': salesProcessToken,
                    },
                }
            );

            setCobrancaAtual({
                pagamentoId: data.pagamentoId,
                cobrancaUrl: data.cobrancaUrl,
                pixQrcode: data.pixQrcode,
            });
            setAlterarFormaPagamento(false);
        } catch {
            setErrorMessage('Nao foi possivel gerar o link de cobranca. Tente novamente.');
        } finally {
            setGerandoCobranca(false);
        }
    };

    const clienteContrato = salesProcess?.cliente ?? null;
    const tipoCadastroContrato = getTipoCadastro(clienteContrato);
    const nomeCliente = [clienteContrato?.nomecomercial, clienteContrato?.nomesocial].filter(Boolean).join(' ') || '-';
    const documentoCliente = formatDocument(tipoCadastroContrato, clienteContrato?.cpfcnpj);
    const emailCliente = clienteContrato?.email || '-';
    const telefoneCliente = buildPhone(clienteContrato);
    const enderecoCliente = formatAddress(clienteContrato);
    const itensContrato = salesProcess?.itens ?? [];
    const totalItensContrato = itensContrato.reduce((soma, item) => soma + (item.finalPrice ?? 0), 0);
    const valorTotalNumerico = itensContrato.length > 0 ? totalItensContrato : (salesProcess?.productValue ?? 0);
    const precoContrato = itensContrato.length > 0
        ? formatCurrency('BRL', totalItensContrato)
        : salesProcess?.productValue !== undefined && salesProcess?.productValue !== null
        ? formatCurrency('BRL', salesProcess.productValue)
        : (preco || '-');
    const nomeProduto = salesProcess?.productName || produto || '-';
    const pagamentoContrato = salesProcess?.pagamento ?? [];
    const pagamentoEscolhidoContrato = pagamentoSelecionadoIndex !== null ? pagamentoContrato[pagamentoSelecionadoIndex] : null;
    const pagamentoEscolhidoRequerParcela = pagamentoEscolhidoContrato ? buildParcelaOpcoes(pagamentoEscolhidoContrato, valorTotalNumerico).length > 1 : false;
    const confirmarPagamentoHabilitado = pagamentoSelecionadoIndex !== null
        && (!pagamentoEscolhidoRequerParcela || Boolean(parcelasSelecionadas[pagamentoSelecionadoIndex]));
    const statusContrato = (salesProcess?.status || '').trim().toUpperCase();
    const erroCadastroAsaas = statusContrato === 'ERROR_CUSTOMER_ASAAS';
    const contratoHabilitado = statusContrato === 'CONTRACT_GENERATED';
    const etapaPagamento = statusContrato === 'SELECT_PAYMENT' || statusContrato === 'PAYMENT_CREATED';
    const etapaCriarLogin = statusContrato === 'PAID';
    const etapaConcluida = statusContrato === 'USER_REGISTRATION' || statusContrato === 'COMPLETED';
    const processoCancelado = statusContrato === 'CANCELLED' || statusContrato === 'EXPIRED';
    const contratoTemplateDisponivel = contractTemplate.trim().length > 0;
    const contractTemplateSrcDoc = useMemo(() => {
        const templateSemScripts = contractTemplate.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '');

        return applyContractPlaceholders(templateSemScripts, {
            '{{cliente_nome}}': nomeCliente,
            '{{cliente_cpf}}': documentoCliente,
            '{{cliente_email}}': emailCliente,
            '{{cliente_telefone}}': telefoneCliente,
            '{{cliente_endereco}}': enderecoCliente,
            '{{sales_process_uuid}}': salesProcess?.uuid || '-',
            '{{itens}}': buildItensPlaceholder(itensContrato),
            '{{valor_total}}': precoContrato,
            '{{pagamento}}': buildPagamentoPlaceholder(pagamentoContrato),
        });
    }, [contractTemplate, documentoCliente, emailCliente, enderecoCliente, itensContrato, nomeCliente, pagamentoContrato, precoContrato, salesProcess?.uuid, telefoneCliente]);
    const etapaContrato = contratoHabilitado || etapaPagamento || etapaCriarLogin || etapaConcluida || processoCancelado || erroCadastroAsaas || Boolean(contratoTemplateDisponivel || salesProcess?.createdCustomerId || salesProcess?.cliente);
    const exibirCadastro = !etapaContrato;
    const temaClaroCheckout = true;
    const statusLabel = processoCancelado
        ? (statusContrato === 'CANCELLED' ? 'Processo cancelado' : 'Link expirado')
        : erroCadastroAsaas
        ? 'Erro no cadastro do cliente'
        : etapaConcluida
        ? 'Cadastro concluído'
        : etapaCriarLogin
        ? 'Pagamento confirmado, aguardando criação de acesso'
        : etapaPagamento
        ? 'Aguardando confirmação da forma de pagamento'
        : contratoHabilitado
        ? 'Contrato pronto para aceite'
        : exibirCadastro
        ? 'Aguardando conclusao do cadastro'
        : 'Aguardando geração do contrato';

    useEffect(() => {
        if (!cobrancaAtual?.cobrancaUrl || etapaCriarLogin || etapaConcluida || processoCancelado) {
            return;
        }

        // Short polling: consulta o sales process a cada 4s, a partir da criacao do link de cobranca, ate o webhook do Asaas atualizar o status para PAID.
        const intervalId = window.setInterval(() => {
            loadSalesProcessContext();
        }, 4000);

        return () => window.clearInterval(intervalId);
    }, [cobrancaAtual?.cobrancaUrl, etapaCriarLogin, etapaConcluida, processoCancelado, loadSalesProcessContext]);

    const handleContractFrameLoad = useCallback(() => {
        const frame = contractFrameRef.current;

        if (!frame) {
            return;
        }

        try {
            const frameDocument = frame.contentDocument || frame.contentWindow?.document;

            if (!frameDocument) {
                return;
            }

            const nextHeight = Math.max(
                frameDocument.documentElement?.scrollHeight ?? 0,
                frameDocument.body?.scrollHeight ?? 0,
                960,
            );

            setContractFrameHeight(nextHeight);
        } catch {
            setContractFrameHeight(960);
        }
    }, []);

    useEffect(() => {
        setContractFrameHeight(960);
    }, [contractTemplateSrcDoc]);

    useEffect(() => {
        if (!etapaCriarLogin) {
            return;
        }

        // So preenche automaticamente se o usuario ainda nao tiver digitado nada.
        setLoginEmailUsuario((atual) => atual || clienteContrato?.email || '');
        setLoginNome((atual) => atual || clienteContrato?.nomecomercial || '');
    }, [etapaCriarLogin, clienteContrato]);

    const handleCriarLogin = async () => {
        setLoginErro('');

        if (!loginNome.trim() || !loginEmailUsuario.trim()) {
            setLoginErro('Preencha o nome e o email para continuar.');
            return;
        }

        if (!centralCheckoutRegistration && loginSenha.length < 8) {
            setLoginErro('A senha deve conter pelo menos 8 dígitos.');
            return;
        }

        if (!centralCheckoutRegistration && loginSenha !== loginConfirmarSenha) {
            setLoginErro('A confirmação de senha não confere.');
            return;
        }

        if (!salesProcessUuid || !salesProcessToken) {
            setLoginErro('Nao foi possivel identificar o processo de vendas para concluir o cadastro de acesso.');
            return;
        }

        setCriandoLogin(true);

        try {
            if (centralCheckoutRegistration) {
                await http.post(
                    `sales-process/${salesProcessUuid}/user-registration/invitation`,
                    {
                        login: loginEmailUsuario.trim(),
                        email: loginEmailUsuario.trim(),
                        nome: loginNome.trim(),
                    },
                    {
                        headers: {
                            'X-Sales-Process-Token': salesProcessToken,
                            'Content-Type': 'application/json',
                        },
                    }
                );
                setLoginErro('');
                await loadSalesProcessContext();
            } else {
                await http.post(
                    `sales-process/${salesProcessUuid}/user-registration`,
                    {
                        login: loginEmailUsuario.trim(),
                        email: loginEmailUsuario.trim(),
                        password: loginSenha,
                        nome: loginNome.trim(),
                    },
                    {
                        headers: {
                            'X-Sales-Process-Token': salesProcessToken,
                            'Content-Type': 'application/json',
                        },
                    }
                );
                navigate('/login');
            }
        } catch (failure) {
            if (centralCheckoutRegistration && axios.isAxiosError(failure)
                && failure.response?.status === 502
                && failure.response.data?.status === 'PENDING_DELIVERY') {
                setLoginErro('O usuário foi criado, mas o convite não foi enviado. Use “Reenviar convite”; não refaça o cadastro.');
                await loadSalesProcessContext();
            } else if (centralCheckoutRegistration && axios.isAxiosError(failure)
                && failure.response?.status === 429) {
                setLoginErro('Aguarde antes de solicitar outro envio do convite.');
            } else if (centralCheckoutRegistration && axios.isAxiosError(failure)
                && failure.response?.status === 409) {
                setLoginErro('Este processo já iniciou o cadastro. Atualize a página para conferir o estado do convite.');
                await loadSalesProcessContext();
            } else {
                setLoginErro('Nao foi possivel concluir o cadastro de acesso neste momento. Tente novamente.');
            }
        } finally {
            setCriandoLogin(false);
        }
    };

    const handleReenviarConvite = async () => {
        if (!salesProcessUuid || !salesProcessToken) return;
        setLoginErro('');
        setReenviandoConvite(true);
        try {
            await http.post(
                `sales-process/${salesProcessUuid}/user-registration/retry-invitation`,
                {},
                { headers: { 'X-Sales-Process-Token': salesProcessToken } }
            );
            setLoginErro('Convite reenviado. Verifique a caixa de entrada e o spam.');
        } catch (failure) {
            if (axios.isAxiosError(failure) && failure.response?.status === 429) {
                setLoginErro('Aguarde antes de solicitar outro envio do convite.');
            } else {
                setLoginErro('Não foi possível reenviar o convite. O cadastro permanece salvo; tente novamente mais tarde.');
            }
        } finally {
            setReenviandoConvite(false);
        }
    };
    return (
        <ContainerPrincipal $light={temaClaroCheckout}>
            <Layout>
                <Hero $light={temaClaroCheckout}>
                    <HeroHeader>
                        <HeroLogo><LogoProxiUs /></HeroLogo>
                        <HeroTitleBlock $light={temaClaroCheckout}>
                            <Badge $light={temaClaroCheckout}>{etapaPagamento ? 'Selecione a forma de pagamento' : etapaCriarLogin ? 'Pagamento confirmado' : etapaConcluida ? 'Cadastro concluído' : processoCancelado ? 'Link indisponível' : etapaContrato ? 'Aceite de contrato' : 'Cadastro publico sem autenticacao'}</Badge>
                            <Titulo>{etapaPagamento ? 'Pagamento do pedido' : etapaCriarLogin ? 'Crie seu acesso ao sistema' : etapaConcluida ? 'Cadastro concluído com sucesso' : processoCancelado ? 'Processo indisponível' : etapaContrato ? 'Contrato para aceite' : 'Cadastro de Cliente/Fornecedor'}</Titulo>
                        </HeroTitleBlock>
                        <HeroToggleButton $light={temaClaroCheckout} type="button" onClick={() => setHeroCollapsed((current) => !current)}>
                            {heroCollapsed ? 'Expandir status' : 'Ocultar status'}
                        </HeroToggleButton>
                    </HeroHeader>

                    {!heroCollapsed && (
                        <HeroContent>
                            <p style={{ color: temaClaroCheckout ? 'rgba(20, 20, 20, 0.8)' : 'rgba(255,255,255,0.78)', lineHeight: 1.6, marginTop: 8 }}>
                                {/* {etapaContrato
                                    ? 'Os dados abaixo foram carregados a partir do cadastro do cliente e das configuracoes do card do CRM.'
                                    : 'Preencha os dados abaixo para concluir seu cadastro.'} */}
                            </p>
                            {(salesProcess?.cardId || cardId) && (
                                <div style={{ display: 'none', marginTop: 18, padding: '14px 16px', borderRadius: 14, background: temaClaroCheckout ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.05)', border: temaClaroCheckout ? '1px solid rgba(20, 20, 20, 0.12)' : '1px solid rgba(255,255,255,0.08)' }}>
                                    <div style={{ fontSize: 13, color: temaClaroCheckout ? '#333333' : '#dddddd', marginBottom: 8 }}>Vinculo do cadastro</div>
                                    <div style={{ fontWeight: 700, marginBottom: 8 }}>Card {salesProcess?.cardId || cardId}</div>
                                    {resumo && <div style={{ color: temaClaroCheckout ? 'rgba(20, 20, 20, 0.72)' : 'rgba(255,255,255,0.72)' }}>{resumo}</div>}
                                </div>
                            )}
                            <ContractMeta>
                                <MetaCard $light={temaClaroCheckout}>
                                    <strong>Cliente</strong>
                                    <span>{nomeCliente}</span>
                                </MetaCard>
                                <MetaCard $light={temaClaroCheckout}>
                                    <strong>Produto(s)</strong>
                                    {itensContrato.length > 0 ? (
                                        <span>
                                            {itensContrato.map((item, indice) => (
                                                <div key={indice} style={{ marginBottom: indice < itensContrato.length - 1 ? 6 : 0 }}>
                                                    {item.product}{item.quantity > 1 ? ` x${item.quantity}` : ''}
                                                </div>
                                            ))}
                                        </span>
                                    ) : (
                                        <span>{nomeProduto}</span>
                                    )}
                                </MetaCard>
                                <MetaCard $light={temaClaroCheckout}>
                                    <strong>{itensContrato.length > 0 ? 'Valor total' : 'Precificacao'}</strong>
                                    <span>{precoContrato}</span>
                                </MetaCard>
                                <MetaCard $light={temaClaroCheckout}>
                                    <strong>Status</strong>
                                    <span>{statusLabel}{/* {salesProcess?.status ? ` (${salesProcess.status})` : ''} */}</span>
                                </MetaCard>
                            </ContractMeta>
                            {!etapaContrato && cardId && (
                                <InfoBox $light={temaClaroCheckout}>
                                    Assim que o cadastro for concluido, esta mesma tela passa a exibir o contrato preenchido com os dados do cliente e do card.
                                </InfoBox>
                            )}
                            {errorMessage && <ErrorBox $light={temaClaroCheckout}>{errorMessage}</ErrorBox>}
                            {successMessage && contratoHabilitado && <SuccessBox $light={temaClaroCheckout}>{successMessage}</SuccessBox>}
                        </HeroContent>
                    )}
                </Hero>

                <Panel $light={temaClaroCheckout}>
                    {loadingContext ? (
                        <LoadingShell $light={temaClaroCheckout}>
                            <CircularProgress sx={{ color: temaClaroCheckout ? '#333333' : '#dddddd' }} />
                            <div>Carregando dados do checkout...</div>
                        </LoadingShell>
                    ) : exibirCadastro ? (
                        <form onSubmit={handleSubmit(createUser)}>
                            {cadastroEtapa === 'cpf' && (
                                <>
                                    <SectionTitle $light={temaClaroCheckout}>Identifique-se pelo CPF</SectionTitle>
                                    <p style={{ color: temaClaroCheckout ? 'rgba(20, 20, 20, 0.72)' : 'rgba(255,255,255,0.72)' }}>
                                        Informe seu CPF para verificarmos se voce ja possui cadastro.
                                    </p>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} md={4}>
                                            <ContainerInput>
                                                <Rotulo $light={temaClaroCheckout}>CPF *</Rotulo>
                                                <InputMaskCustomizado $light={temaClaroCheckout} mask={maskCpfCnpj} maskChar={null} {...register('cpfcnpj', {
                                                    required: 'Campo obrigatório',
                                                    minLength: { value: 14, message: 'Favor preencher com um CPF válido' }
                                                })} />
                                                {errors.cpfcnpj && typeof errors.cpfcnpj.message === 'string' && <SpanErro $light={temaClaroCheckout}>{errors.cpfcnpj.message}</SpanErro>}
                                            </ContainerInput>
                                        </Grid>
                                    </Grid>
                                    {erroEtapaCpf && <ErrorBox $light={temaClaroCheckout}>{erroEtapaCpf}</ErrorBox>}
                                    <Box sx={{ mt: 2 }}>
                                        <Button type="button" variant="contained" size="large" disabled={verificandoCpf} onClick={handleVerificarCpf} sx={{ backgroundColor: '#141414', color: '#f5f5f5', fontWeight: 700, '&:hover': { backgroundColor: '#383838' } }}>
                                            {verificandoCpf ? 'Verificando...' : 'Continuar'}
                                        </Button>
                                    </Box>
                                </>
                            )}

                            {cadastroEtapa === 'email' && (
                                <>
                                    <SectionTitle $light={temaClaroCheckout}>Confirme seu e-mail</SectionTitle>
                                    <p>Informe o endereço para receber o código de verificação.</p>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} md={4}>
                                            <Rotulo $light={temaClaroCheckout}>E-mail *</Rotulo>
                                            <Campo $light={temaClaroCheckout} type="email" maxLength={100} {...register('email', {
                                                required: 'Email obrigatório',
                                                pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Favor digitar um email válido' }
                                            })} />
                                            {errors.email && <SpanErro $light={temaClaroCheckout}>{errors.email.message}</SpanErro>}
                                        </Grid>
                                    </Grid>
                                    {erroEtapaCodigo && <ErrorBox $light={temaClaroCheckout}>{erroEtapaCodigo}</ErrorBox>}
                                    <Button type="button" disabled={verificandoCpf} onClick={() => handleEnviarCodigoEmail('identificacao')}>
                                        {verificandoCpf ? 'Enviando...' : 'Enviar código'}
                                    </Button>
                                    <Button type="button" onClick={() => setCadastroEtapa('cpf')}>Voltar</Button>
                                </>
                            )}

                            {cadastroEtapa === 'codigo' && (
                                <>
                                    <SectionTitle $light={temaClaroCheckout}>Digite o codigo recebido</SectionTitle>
                                    <p style={{ color: temaClaroCheckout ? 'rgba(20, 20, 20, 0.72)' : 'rgba(255,255,255,0.72)' }}>
                                        Enviamos um codigo de 6 digitos para {emailMascarado || 'seu email cadastrado'}, valido por 5 minutos.
                                    </p>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} md={3}>
                                            <Rotulo $light={temaClaroCheckout}>Codigo *</Rotulo>
                                            <Campo
                                                $light={temaClaroCheckout}
                                                type="text"
                                                maxLength={6}
                                                value={codigoVerificacao}
                                                onChange={(event) => setCodigoVerificacao(event.target.value)}
                                            />
                                        </Grid>
                                    </Grid>
                                    {erroEtapaCodigo && <ErrorBox $light={temaClaroCheckout}>{erroEtapaCodigo}</ErrorBox>}
                                    <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                        <Button type="button" variant="contained" disabled={confirmandoCodigo} onClick={handleConfirmarCodigoEmail} sx={{ backgroundColor: '#141414', color: '#f5f5f5', fontWeight: 700, '&:hover': { backgroundColor: '#383838' } }}>
                                            {confirmandoCodigo ? 'Confirmando...' : 'Confirmar codigo'}
                                        </Button>
                                        <Button type="button" variant="outlined" disabled={verificandoCpf} onClick={() => codigoCpfExistente ? handleVerificarCpf() : handleEnviarCodigoEmail(retornoCodigo)}>
                                            Reenviar codigo
                                        </Button>
                                        <Button type="button" variant="text" onClick={() => setCadastroEtapa(codigoCpfExistente ? 'cpf' : retornoCodigo === 'endereco' ? 'identificacao' : 'email')}>
                                            Voltar
                                        </Button>
                                    </Box>
                                </>
                            )}

                            {cadastroEtapa === 'identificacao' && (
                                <>
                                    <SectionTitle $light={temaClaroCheckout}>Identificação</SectionTitle>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} md={2}>
                                            <Rotulo $light={temaClaroCheckout}>CPF</Rotulo>
                                            <InputMaskCustomizado $light={temaClaroCheckout} mask={maskCpfCnpj} maskChar={null} value={watch('cpfcnpj')} disabled />
                                            <Button
                                                type="button"
                                                variant="text"
                                                size="small"
                                                onClick={() => {
                                                    setErroEtapaCpf('');
                                                    setErroEtapaCodigo('');
                                                    setCodigoVerificacao('');
                                                    setEmailMascarado('');
                                                    setCadastroEtapa('cpf');
                                                }}
                                                sx={{ px: 0, textTransform: 'none' }}
                                            >
                                                Alterar CPF
                                            </Button>
                                        </Grid>
                                        <Grid item xs={12} md={3}>
                                            <Rotulo $light={temaClaroCheckout}>Nome *</Rotulo>
                                            <Campo $light={temaClaroCheckout} type="text" maxLength={100} {...register('nomecomercial', {
                                                required: 'Campo obrigatório',
                                                minLength: { value: 3, message: 'Deve ter no mínimo 3 caracteres' },
                                                maxLength: { value: 100, message: 'Deve ter no máximo 100 caracteres' }
                                            })} />
                                            {errors.nomecomercial && typeof errors.nomecomercial.message === 'string' && <SpanErro $light={temaClaroCheckout}>{errors.nomecomercial.message}</SpanErro>}
                                        </Grid>
                                        <Grid item xs={12} md={3}>
                                            <Rotulo $light={temaClaroCheckout}>Sobrenome *</Rotulo>
                                            <Campo $light={temaClaroCheckout} type="text" maxLength={100} {...register('nomesocial', {
                                                required: 'Campo obrigatório',
                                                minLength: { value: 3, message: 'Deve ter no mínimo 3 caracteres' },
                                                maxLength: { value: 100, message: 'Deve ter no máximo 100 caracteres' }
                                            })} />
                                            {errors.nomesocial && typeof errors.nomesocial.message === 'string' && <SpanErro $light={temaClaroCheckout}>{errors.nomesocial.message}</SpanErro>}
                                        </Grid>
                                        
                                        <Grid item xs={12} md={2}>
                                            <Rotulo $light={temaClaroCheckout}>E-mail *</Rotulo>
                                            <Campo $light={temaClaroCheckout} type="text" maxLength={100} {...register('email', {
                                                required: 'Email obrigatório',
                                                pattern: {
                                                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                                    message: 'Favor digitar um email válido'
                                                }
                                            })} />
                                            {errors.email && typeof errors.email.message === 'string' && <SpanErro $light={temaClaroCheckout}>{errors.email.message}</SpanErro>}
                                        </Grid>
                                        <Grid item xs={12} md={2}>
                                            <Rotulo $light={temaClaroCheckout}>Telefone</Rotulo>
                                            {/* value explicito eh necessario pois o InputMask nao reflete o valor definido via reset() quando usado so por ref (uncontrolled). */}
                                            <InputMaskCustomizado $light={temaClaroCheckout} mask="(99) 99999-9999" maskChar={null} {...register('telefone', {
                                                minLength: { value: 14, message: 'Favor digitar um telefone válido' }
                                            })} value={watch('telefone')} />
                                            {errors.telefone && typeof errors.telefone.message === 'string' && <SpanErro $light={temaClaroCheckout}>{errors.telefone.message}</SpanErro>}
                                        </Grid>
                                    </Grid>
                                    {erroEtapaCodigo && <ErrorBox $light={temaClaroCheckout}>{erroEtapaCodigo}</ErrorBox>}
                                    <Box sx={{ mt: 2 }}>
                                        <Button type="button" variant="contained" size="large" disabled={verificandoCpf} onClick={handleAvancarIdentificacao} sx={{ backgroundColor: '#141414', color: '#f5f5f5', fontWeight: 700, '&:hover': { backgroundColor: '#383838' } }}>
                                            Continuar
                                        </Button>
                                    </Box>
                                </>
                            )}

                            {cadastroEtapa === 'endereco' && !enderecoCepPesquisado && (
                                <>
                                    <SectionTitle $light={temaClaroCheckout}>Dados Endereço</SectionTitle>
                                    <p style={{ color: temaClaroCheckout ? 'rgba(20, 20, 20, 0.72)' : 'rgba(255,255,255,0.72)' }}>
                                        Informe seu CEP para localizarmos o seu endereço.
                                    </p>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} md={4}>
                                            <ContainerInput>
                                                <Rotulo $light={temaClaroCheckout}>CEP *</Rotulo>
                                                <InputMaskCustomizado $light={temaClaroCheckout} mask="99999-999" maskChar={null} {...register('cep')} />
                                            </ContainerInput>
                                        </Grid>
                                    </Grid>
                                    {mensagemCep && <InfoBox $light={temaClaroCheckout}>{mensagemCep}</InfoBox>}
                                    <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                        <Button type="button" variant="outlined" onClick={() => setCadastroEtapa('identificacao')}>
                                            Voltar
                                        </Button>
                                        <Button type="button" variant="contained" size="large" disabled={buscandoCep} onClick={handlePesquisarCep} sx={{ backgroundColor: '#141414', color: '#f5f5f5', fontWeight: 700, '&:hover': { backgroundColor: '#383838' } }}>
                                            {buscandoCep ? 'Pesquisando...' : 'Pesquisar CEP'}
                                        </Button>
                                    </Box>
                                </>
                            )}

                            {cadastroEtapa === 'endereco' && enderecoCepPesquisado && (
                                <>
                                    <SectionTitle $light={temaClaroCheckout}>Dados Endereço</SectionTitle>
                                    {mensagemCep && <InfoBox $light={temaClaroCheckout}>{mensagemCep}</InfoBox>}
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} md={3}>
                                            <Rotulo $light={temaClaroCheckout}>CEP</Rotulo>
                                            <InputMaskCustomizado $light={temaClaroCheckout} mask="99999-999" maskChar={null} value={watch('cep')} disabled />
                                        </Grid>
                                        <Grid item xs={12} md={5}>
                                            <Rotulo $light={temaClaroCheckout}>Logradouro</Rotulo>
                                            <Campo $light={temaClaroCheckout} type="text" maxLength={100} {...register('logradouro')} />
                                        </Grid>
                                        <Grid item xs={12} md={4}>
                                            <Rotulo $light={temaClaroCheckout}>Bairro</Rotulo>
                                            <Campo $light={temaClaroCheckout} type="text" maxLength={100} {...register('bairro')} />
                                        </Grid>
                                        <Grid item xs={12} md={4}>
                                            <Rotulo $light={temaClaroCheckout}>Cidade</Rotulo>
                                            <Campo $light={temaClaroCheckout} type="text" maxLength={100} {...register('cidade')} />
                                        </Grid>
                                        <Grid item xs={12} md={2}>
                                            <Rotulo $light={temaClaroCheckout}>UF</Rotulo>
                                            <Campo $light={temaClaroCheckout} type="text" maxLength={2} {...register('uf')} />
                                        </Grid>
                                        <Grid item xs={12} md={3}>
                                            <Rotulo $light={temaClaroCheckout}>Número</Rotulo>
                                            <Campo $light={temaClaroCheckout} type="number" {...register('numero')} />
                                        </Grid>
                                        <Grid item xs={12} md={3}>
                                            <Rotulo $light={temaClaroCheckout}>Complemento</Rotulo>
                                            <Campo $light={temaClaroCheckout} type="text" maxLength={100} {...register('complemento')} />
                                        </Grid>
                                    </Grid>

                                    <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                        <Button type="button" variant="outlined" onClick={() => setCadastroEtapa('identificacao')}>
                                            Voltar
                                        </Button>
                                        <Button type="button" variant="outlined" onClick={() => setEnderecoCepPesquisado(false)}>
                                            Alterar CEP
                                        </Button>
                                        <Button type="submit" variant="contained" size="large" sx={{ backgroundColor: '#141414', color: '#f5f5f5', fontWeight: 700, '&:hover': { backgroundColor: '#383838' } }}>
                                            Concluir cadastro
                                        </Button>
                                    </Box>
                                </>
                            )}
                        </form>
                    ) : etapaPagamento ? (
                        <>
                            <ContractHeader $light={temaClaroCheckout}>
                                <div>
                                    <div style={{ color: temaClaroCheckout ? '#333333' : '#dedede', fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
                                        Fechamento do pedido
                                    </div>
                                    <Titulo>Selecione a forma de pagamento</Titulo>
                                </div>
                            </ContractHeader>

                            
                            <InfoBox $light={temaClaroCheckout}>
                                Você será direcionado para uma página de pagamento do Asaas para concluir a compra com mais segurança.
                            </InfoBox>

                            {cobrancaAtual?.cobrancaUrl && (
                                <InfoBox $light={temaClaroCheckout} style={{ backgroundColor: '#555555', marginBottom: 12 }}>
                                    <AsaasBrandRow style={{ marginBottom: 12 }}>
                                        <AsaasLogoBadge>asaas</AsaasLogoBadge>
                                        <a
                                            href={cobrancaAtual.cobrancaUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{ color: '#f1f1f1', fontWeight: 700, fontSize: 16, textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                                        >
                                            Abrir página de pagamento do Asaas
                                            <OpenInNewIcon fontSize="small" sx={{ color: '#f1f1f1' }} />
                                        </a>
                                    </AsaasBrandRow>
                                    <div style={{ color: '#f1f1f1',display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <CircularProgress size={18} sx={{ color: '#d8d8d8' }} />
                                        <span>Aguardando pagamento para finalização do cadastro.</span>
                                    </div>
                                </InfoBox>
                            )}

                            {(!cobrancaAtual?.cobrancaUrl || alterarFormaPagamento) ? (
                                <>
                                    <SectionTitle $light={temaClaroCheckout}>Formas de pagamento disponíveis</SectionTitle>
                                    {pagamentoContrato.length === 0 ? (
                                        <InfoBox $light={temaClaroCheckout}>Nenhuma condição de pagamento foi configurada para este processo.</InfoBox>
                                    ) : (
                                        pagamentoContrato.map((pagamento, indice) => {
                                            const opcoesParcelas = buildParcelaOpcoes(pagamento, valorTotalNumerico);
                                            const permiteParcelamento = opcoesParcelas.length > 1;
                                            const selecionado = pagamentoSelecionadoIndex === indice;
                                            const parcelaSelecionada = parcelasSelecionadas[indice] ?? '';
                                            const opcaoSelecionada = parcelaSelecionada
                                                ? opcoesParcelas.find((opcao) => opcao.parcela === parcelaSelecionada)
                                                : undefined;
                                            const descontoLabel = buildDescontoLabel(pagamento);

                                            return (
                                                <PaymentOptionCard
                                                    key={indice}
                                                    $light={temaClaroCheckout}
                                                    $selected={selecionado}
                                                >
                                                    <input
                                                        type="radio"
                                                        name="formaPagamento"
                                                        checked={selecionado}
                                                        onChange={() => {
                                                            setPagamentoSelecionadoIndex(indice);
                                                        }}
                                                    />
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontWeight: 700, marginBottom: permiteParcelamento && selecionado ? 8 : 0 }}>
                                                            {formatTipoPagamento(pagamento.tipopagamento)}
                                                            {descontoLabel && <span style={{ fontWeight: 400 }}> ({descontoLabel})</span>}
                                                        </div>
                                                        {!permiteParcelamento && (
                                                            <ValorTotalTexto $light={temaClaroCheckout}>
                                                                Valor total: {formatCurrency('BRL', opcoesParcelas[0]?.valorTotal ?? valorTotalNumerico)}
                                                            </ValorTotalTexto>
                                                        )}
                                                        {permiteParcelamento && selecionado && (
                                                            <Grid container spacing={2} alignItems="center">
                                                                <Grid item xs={12} md={6}>
                                                                    <Rotulo $light={temaClaroCheckout}>Parcelas</Rotulo>
                                                                    <CampoSelect
                                                                        $light={temaClaroCheckout}
                                                                        value={parcelaSelecionada}
                                                                        onChange={(event) => {
                                                                            const valor = event.target.value;
                                                                            setParcelasSelecionadas((atual) => ({ ...atual, [indice]: valor ? Number(valor) : '' }));
                                                                        }}
                                                                    >
                                                                        <option value="">Selecione a quantidade de parcelas</option>
                                                                        {opcoesParcelas.map((opcao) => (
                                                                            <option key={opcao.parcela} value={opcao.parcela}>
                                                                                {opcao.parcela}x - {formatCurrency('BRL', opcao.valorParcela)}
                                                                            </option>
                                                                        ))}
                                                                    </CampoSelect>
                                                                </Grid>
                                                                <Grid item xs={12} md={6}>
                                                                    <Rotulo $light={temaClaroCheckout}>Valor total</Rotulo>
                                                                    <ValorTotalTexto $light={temaClaroCheckout}>
                                                                        {opcaoSelecionada ? formatCurrency('BRL', opcaoSelecionada.valorTotal) : '-'}
                                                                    </ValorTotalTexto>
                                                                </Grid>
                                                            </Grid>
                                                        )}
                                                    </div>
                                                </PaymentOptionCard>
                                            );
                                        })
                                    )}

                                    <Box sx={{ mt: 2 }}>
                                        <Button
                                            type="button"
                                            variant="contained"
                                            disabled={!confirmarPagamentoHabilitado || gerandoCobranca}
                                            onClick={handleConfirmarFormaPagamento}
                                            sx={{ backgroundColor: '#141414', color: '#f5f5f5', fontWeight: 700, '&:hover': { backgroundColor: '#383838' }, '&.Mui-disabled': { backgroundColor: 'rgba(255,255,255,0.16)', color: 'rgba(255,255,255,0.45)' } }}
                                        >
                                            {gerandoCobranca ? 'Gerando cobrança...' : 'Confirmar forma de pagamento'}
                                        </Button>
                                    </Box>
                                </>
                            ) : (
                                <Box sx={{ mt: 2 }}>
                                    <Button
                                        type="button"
                                        variant="text"
                                        onClick={() => setAlterarFormaPagamento(true)}
                                        sx={{ color: '#141414', fontWeight: 700, textTransform: 'none' }}
                                    >
                                        Selecionar outra forma de pagamento/parcelamento
                                    </Button>
                                </Box>
                            )}
                        </>
                    ) : etapaCriarLogin ? (
                        <>
                            <ContractHeader $light={temaClaroCheckout} style={{ justifyContent: 'center' }}>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ color: temaClaroCheckout ? '#333333' : '#dedede', fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
                                        Pagamento confirmado
                                    </div>
                                    <Titulo>Crie seu acesso ao sistema</Titulo>
                                </div>
                            </ContractHeader>

                            <InfoBox $light={temaClaroCheckout} style={{ textAlign: 'center' }}>
                                {centralCheckoutRegistration
                                    ? 'Informe seu e-mail e nome. Enviaremos um convite para confirmar o endereço, definir sua senha e ativar o acesso.'
                                    : 'Defina um nome de exibição, e-mail e senha para acessar sua área de cliente.'}
                            </InfoBox>

                            <Box sx={{ width: { xs: '100%', md: '33.3333%' }, mx: { xs: 0, md: 'auto' } }}>
                                <Grid container spacing={2} sx={{ mt: 0.5 }}>
                                    <Grid item xs={12}>
                                        <Rotulo $light={temaClaroCheckout}>E-mail para login no sistema *</Rotulo>
                                        <Campo
                                            $light={temaClaroCheckout}
                                            type="email"
                                            value={loginEmailUsuario}
                                            onChange={(event) => setLoginEmailUsuario(event.target.value)}
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Rotulo $light={temaClaroCheckout}>Nome de Exibição *</Rotulo>
                                        <Campo
                                            $light={temaClaroCheckout}
                                            type="text"
                                            placeholder="Como gostaria de ser chamado"
                                            value={loginNome}
                                            onChange={(event) => setLoginNome(event.target.value)}
                                        />
                                    </Grid>
                                    {!centralCheckoutRegistration && <Grid item xs={12}>
                                        <Rotulo $light={temaClaroCheckout}>Senha *</Rotulo>
                                        <Campo
                                            $light={temaClaroCheckout}
                                            type="password"
                                            minLength={8}
                                            value={loginSenha}
                                            onChange={(event) => setLoginSenha(event.target.value)}
                                        />
                                        <SpanErro $light={temaClaroCheckout}>É necessário ter pelo menos 8 caracteres.</SpanErro>
                                    </Grid>}
                                    {!centralCheckoutRegistration && <Grid item xs={12}>
                                        <Rotulo $light={temaClaroCheckout}>Confirmar senha *</Rotulo>
                                        <Campo
                                            $light={temaClaroCheckout}
                                            type="password"
                                            minLength={8}
                                            value={loginConfirmarSenha}
                                            onChange={(event) => setLoginConfirmarSenha(event.target.value)}
                                        />
                                    </Grid>}
                                </Grid>
                            </Box>

                            <Box sx={{ width: { xs: '100%', md: '33.3333%' }, mx: { xs: 0, md: 'auto' } }}>
                                {loginErro && <ErrorBox $light={temaClaroCheckout}>{loginErro}</ErrorBox>}

                                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                                    <Button
                                        type="button"
                                        variant="contained"
                                        disabled={criandoLogin}
                                        onClick={handleCriarLogin}
                                        startIcon={criandoLogin ? <CircularProgress size={16} sx={{ color: 'inherit' }} /> : undefined}
                                        sx={{ backgroundColor: '#141414', color: '#f5f5f5', fontWeight: 700, '&:hover': { backgroundColor: '#383838' }, '&.Mui-disabled': { backgroundColor: 'rgba(20, 20, 20, 0.3)', color: 'rgba(20, 20, 20, 0.65)' } }}
                                    >
                                        {criandoLogin ? 'Processando...' : centralCheckoutRegistration ? 'Enviar convite' : 'Criar login e senha'}
                                    </Button>
                                </Box>
                            </Box>
                        </>
                    ) : etapaConcluida ? (
                        centralCheckoutRegistration ? (
                            <>
                                <InfoBox $light={temaClaroCheckout}>
                                    {convitePendenteAceite === null
                                        ? 'Estamos consultando o estado do convite. Atualize esta página se a mensagem não aparecer.'
                                        : convitePendenteAceite
                                            ? 'O acesso está pendente. Confira seu e-mail e siga as instruções para confirmar o endereço, definir ou usar sua senha e aceitar o convite da empresa.'
                                            : <>O acesso à empresa foi ativado. Entre pelo <a href={`${centralRootOrigin()}/login`} style={{ color: '#141414', fontWeight: 700 }}>login central</a> com sua conta.</>}
                                </InfoBox>
                                {convitePendenteAceite && (
                                    <Box sx={{ width: { xs: '100%', md: '33.3333%' }, mx: { xs: 0, md: 'auto' }, mt: 2 }}>
                                        {loginErro && <ErrorBox $light={temaClaroCheckout}>{loginErro}</ErrorBox>}
                                        <Button
                                            type="button"
                                            variant="contained"
                                            disabled={reenviandoConvite}
                                            onClick={handleReenviarConvite}
                                            startIcon={reenviandoConvite ? <CircularProgress size={16} sx={{ color: 'inherit' }} /> : undefined}
                                            sx={{ backgroundColor: '#141414', color: '#f5f5f5', fontWeight: 700, '&:hover': { backgroundColor: '#383838' }, '&.Mui-disabled': { backgroundColor: 'rgba(20, 20, 20, 0.3)', color: 'rgba(20, 20, 20, 0.65)' } }}
                                        >
                                            {reenviandoConvite ? 'Enviando...' : 'Reenviar convite'}
                                        </Button>
                                    </Box>
                                )}
                            </>
                        ) : (
                            <InfoBox $light={temaClaroCheckout}>
                                Cadastro de acesso já concluído. Acesse o <a href="/login" style={{ color: '#141414', fontWeight: 700 }}>login do sistema</a> com o e-mail e senha cadastrados.
                            </InfoBox>
                        )
                    ) : processoCancelado ? (
                        <ErrorBox $light={temaClaroCheckout}>
                            {statusContrato === 'CANCELLED' ? 'Este processo de vendas foi cancelado.' : 'Este link de checkout expirou.'} Entre em contato para gerar um novo link.
                        </ErrorBox>
                    ) : (
                        <>
                            <ContractHeader $light={temaClaroCheckout}>
                                <div>
                                    <div style={{ color: temaClaroCheckout ? '#333333' : '#dedede', fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
                                        Documento comercial
                                    </div>
                                    <Titulo>{contratoHabilitado ? 'Contrato em HTML para aceite digital' : 'Contrato pendente de liberação'}</Titulo>
                                </div>
                                <div style={{ textAlign: 'right', color: temaClaroCheckout ? 'rgba(20, 20, 20, 0.75)' : 'rgba(255,255,255,0.75)' }}>
                                    <div>Data de emissao</div>
                                    <strong style={{ color: temaClaroCheckout ? '#141414' : '#fff' }}>{new Date().toLocaleDateString('pt-BR')}</strong>
                                </div>
                            </ContractHeader>

                            {!contratoHabilitado && (
                                <ErrorBox $light={temaClaroCheckout}>
                                    {erroCadastroAsaas
                                        ? 'Nao foi possivel concluir o registro do cliente no Asaas. Entre em contato com o suporte para regularizar o cadastro.'
                                        : 'O template do contrato so fica disponivel depois que o sales process atingir o status CONTRACT_GENERATED.'}
                                </ErrorBox>
                            )}

                            <ContractDocument $light={temaClaroCheckout}>
                                {contratoHabilitado && contratoTemplateDisponivel ? (
                                    <ContractFrameShell>
                                        <ContractIframe
                                            ref={contractFrameRef}
                                            title="Contrato para aceite"
                                            srcDoc={contractTemplateSrcDoc}
                                            scrolling="no"
                                            onLoad={handleContractFrameLoad}
                                            style={{ height: `${contractFrameHeight}px` }}
                                        />
                                    </ContractFrameShell>
                                ) : (
                                    <InfoBox $light={temaClaroCheckout}>
                                        O template do contrato sera exibido aqui quando o backend retornar o documento para este sales process.
                                    </InfoBox>
                                )}
                            </ContractDocument>

                            <AcceptanceBox $light={temaClaroCheckout}>
                                <CheckboxRow $light={temaClaroCheckout}>
                                    <input
                                        type="checkbox"
                                        checked={aceiteMarcado}
                                        onChange={(event) => {
                                            setAceiteMarcado(event.target.checked);
                                            setAceiteMensagem('');
                                        }}
                                    />
                                    <span>Li o contrato, confirmo que os dados exibidos estao corretos e autorizo o prosseguimento do fluxo comercial.</span>
                                </CheckboxRow>

                                <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                    <Button
                                        type="button"
                                        variant="contained"
                                        disabled={!aceiteMarcado || !contratoHabilitado || !contratoTemplateDisponivel || enviandoAceite}
                                        onClick={handleAceite}
                                        startIcon={enviandoAceite ? <CircularProgress size={16} sx={{ color: 'inherit' }} /> : undefined}
                                        sx={{ backgroundColor: '#141414', color: '#f5f5f5', fontWeight: 700, '&:hover': { backgroundColor: '#383838' }, '&.Mui-disabled': { backgroundColor: temaClaroCheckout ? 'rgba(20, 20, 20, 0.3)' : 'rgba(255,255,255,0.16)', color: temaClaroCheckout ? 'rgba(20, 20, 20, 0.65)' : 'rgba(255,255,255,0.45)' } }}
                                    >                                        
                                        {enviandoAceite ? 'Enviando aceite...' : 'Aceitar contrato'}
                                    </Button>
                                </Box>

                                {aceiteMensagem && <SuccessBox $light={temaClaroCheckout}>{aceiteMensagem}</SuccessBox>}

                                <Dialog open={aceiteErroModalAberto} onClose={() => setAceiteErroModalAberto(false)}>
                                    <DialogTitle sx={{ color: '#141414', fontWeight: 700 }}>Erro ao aceitar contrato</DialogTitle>
                                    <DialogContent>{aceiteErro}</DialogContent>
                                    <DialogActions>
                                        <Button onClick={() => setAceiteErroModalAberto(false)} sx={{ color: '#141414' }}>
                                            Fechar
                                        </Button>
                                    </DialogActions>
                                </Dialog>
                            </AcceptanceBox>
                        </>
                    )}
                </Panel>
            </Layout>
        </ContainerPrincipal>
    );
}
