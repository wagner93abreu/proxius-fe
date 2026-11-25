export const isLocalTenant = (host: string) =>
    /^[a-z0-9](?:[a-z0-9-]{0,48}[a-z0-9])?\.localhost$/.test(host);

export const centralPreviewEnabled = () =>
    process.env.REACT_APP_CENTRAL_IDENTITY_PREVIEW === "true"
    && window.location.protocol === "http:"
    && (window.location.hostname === "localhost" || isLocalTenant(window.location.hostname));

export const invitationPreviewEnabled = () =>
    centralPreviewEnabled()
    && window.location.hostname === "localhost"
    && process.env.REACT_APP_CENTRAL_INVITATION_PREVIEW === "true";

export const centralRegistrationPreviewEnabled = () =>
    centralPreviewEnabled()
    && isLocalTenant(window.location.hostname)
    && process.env.REACT_APP_CENTRAL_REGISTRATION_PREVIEW === "true";

export const tenantOrigin = (slug: string) => {
    if (!/^[a-z0-9](?:[a-z0-9-]{0,48}[a-z0-9])?$/.test(slug)) {
        throw new Error("Empresa inválida.");
    }
    return `http://${slug}.localhost${window.location.port ? `:${window.location.port}` : ""}`;
};

export const centralRootOrigin = () =>
    `http://localhost${window.location.port ? `:${window.location.port}` : ""}`;
