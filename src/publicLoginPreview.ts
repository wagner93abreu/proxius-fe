function publicTenant(): string | null {
    if (window.location.protocol !== "https:") {
        return null;
    }
    switch (window.location.hostname) {
        case "proxius.com.br":
        case "www.proxius.com.br":
            return "proxius";
        case "automatizego.proxius.com.br":
            return "automatizego";
        default:
            return null;
    }
}

export function publicLoginPreviewTenant(): string | null {
    return process.env.REACT_APP_PUBLIC_LOGIN_PREVIEW === "true" ? publicTenant() : null;
}

export function publicRoutingTenant(): string | null {
    return process.env.REACT_APP_PUBLIC_TENANT_ROUTING === "true" ? publicTenant() : null;
}
