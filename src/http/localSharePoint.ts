export function isRhscLocalSharePoint(): boolean {
    return window.location.hostname.toLowerCase() === "rhsc.localhost";
}

export function isLocalHost(): boolean {
    const hostname = window.location.hostname.toLowerCase();
    return hostname === "localhost" || hostname.endsWith(".localhost");
}

export function isRhscSharePointTestEnabled(): boolean {
    return isRhscLocalSharePoint()
        && process.env.REACT_APP_SHAREPOINT_TEST_ENABLED === "true"
        && process.env.REACT_APP_SHAREPOINT_ENABLED === "true";
}
