export function publicLoginPreviewTenant(): string | null {
    if (process.env.REACT_APP_PUBLIC_LOGIN_PREVIEW !== "true" || window.location.protocol !== "https:") {
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
