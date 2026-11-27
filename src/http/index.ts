import axios from "axios";
import { publicLoginPreviewTenant, publicRoutingTenant } from "../publicLoginPreview";

// Verifica se está no ambiente de produção ou desenvolvimento
const hostname = window.location.hostname;
const isTenantPoc = /^[a-z0-9](?:[a-z0-9-]{0,48}[a-z0-9])?\.localhost$/.test(hostname);
const isProduction = hostname !== 'localhost' && !isTenantPoc;

// Define a URL base da API com base no ambiente
const baseURL = isTenantPoc
    ? `http://${hostname}:8080/`
    : isProduction ? 'https://api.proxius.com.br/' : 'http://localhost:8080/';

export const localApiURL = hostname === 'localhost' || isTenantPoc || publicRoutingTenant()
    ? baseURL : 'http://localhost:8080/';

export function tenantRequestHeaders(): Record<string, string> {
    const tenant = publicRoutingTenant() || publicLoginPreviewTenant();
    return tenant ? { "X-Tenant-Slug": tenant } : {};
}

const http = axios.create({
    baseURL: baseURL
});

http.interceptors.request.use(config => {
    if (hostname === 'localhost') {
        return Promise.reject(new Error("O dominio raiz local nao possui acesso operacional. Use o subdominio da empresa."));
    }
    for (const [name, value] of Object.entries(tenantRequestHeaders())) {
        config.headers.set(name, value);
    }
    return config;
});

export default http;