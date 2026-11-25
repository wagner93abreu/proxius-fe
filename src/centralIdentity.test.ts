import { centralPreviewEnabled, centralRegistrationPreviewEnabled, centralRootOrigin, invitationPreviewEnabled, isLocalTenant, tenantOrigin } from "./centralIdentity";

const originalLocation = window.location;
const originalFlag = process.env.REACT_APP_CENTRAL_IDENTITY_PREVIEW;
const originalInvitationFlag = process.env.REACT_APP_CENTRAL_INVITATION_PREVIEW;
const originalRegistrationFlag = process.env.REACT_APP_CENTRAL_REGISTRATION_PREVIEW;
afterEach(() => {
    Object.defineProperty(window, "location", { configurable: true, value: originalLocation });
    process.env.REACT_APP_CENTRAL_IDENTITY_PREVIEW = originalFlag;
    process.env.REACT_APP_CENTRAL_INVITATION_PREVIEW = originalInvitationFlag;
    process.env.REACT_APP_CENTRAL_REGISTRATION_PREVIEW = originalRegistrationFlag;
});

test("user registration preview requires explicit flags and a local tenant host", () => {
    process.env.REACT_APP_CENTRAL_IDENTITY_PREVIEW = "true";
    process.env.REACT_APP_CENTRAL_REGISTRATION_PREVIEW = "true";
    Object.defineProperty(window, "location", { configurable: true, value: { ...originalLocation, protocol: "http:", hostname: "rhsc.localhost" } });
    expect(centralRegistrationPreviewEnabled()).toBe(true);
    Object.defineProperty(window, "location", { configurable: true, value: { ...originalLocation, protocol: "http:", hostname: "localhost" } });
    expect(centralRegistrationPreviewEnabled()).toBe(false);
    Object.defineProperty(window, "location", { configurable: true, value: { ...originalLocation, protocol: "https:", hostname: "rhsc.localhost" } });
    expect(centralRegistrationPreviewEnabled()).toBe(false);
    process.env.REACT_APP_CENTRAL_REGISTRATION_PREVIEW = "false";
    Object.defineProperty(window, "location", { configurable: true, value: { ...originalLocation, protocol: "http:", hostname: "rhsc.localhost" } });
    expect(centralRegistrationPreviewEnabled()).toBe(false);
});

test("invitation preview requires both flags and the local root over HTTP", () => {
    process.env.REACT_APP_CENTRAL_IDENTITY_PREVIEW = "true";
    process.env.REACT_APP_CENTRAL_INVITATION_PREVIEW = "true";
    Object.defineProperty(window, "location", { configurable: true, value: { ...originalLocation, protocol: "http:", hostname: "localhost" } });
    expect(invitationPreviewEnabled()).toBe(true);
    Object.defineProperty(window, "location", { configurable: true, value: { ...originalLocation, protocol: "http:", hostname: "a.localhost" } });
    expect(invitationPreviewEnabled()).toBe(false);
    Object.defineProperty(window, "location", { configurable: true, value: { ...originalLocation, protocol: "https:", hostname: "localhost" } });
    expect(invitationPreviewEnabled()).toBe(false);
    Object.defineProperty(window, "location", { configurable: true, value: { ...originalLocation, protocol: "http:", hostname: "localhost" } });
    process.env.REACT_APP_CENTRAL_IDENTITY_PREVIEW = "false";
    expect(invitationPreviewEnabled()).toBe(false);
    process.env.REACT_APP_CENTRAL_IDENTITY_PREVIEW = "true";
    process.env.REACT_APP_CENTRAL_INVITATION_PREVIEW = "false";
    expect(invitationPreviewEnabled()).toBe(false);
});

test("preview requires an explicit flag and an HTTP local host", () => {
    process.env.REACT_APP_CENTRAL_IDENTITY_PREVIEW = "true";
    Object.defineProperty(window, "location", { configurable: true, value: { ...originalLocation, protocol: "http:", hostname: "rhsc.localhost" } });
    expect(centralPreviewEnabled()).toBe(true);
    Object.defineProperty(window, "location", { configurable: true, value: { ...originalLocation, protocol: "https:", hostname: "rhsc.localhost" } });
    expect(centralPreviewEnabled()).toBe(false);
    Object.defineProperty(window, "location", { configurable: true, value: { ...originalLocation, protocol: "http:", hostname: "example.com" } });
    expect(centralPreviewEnabled()).toBe(false);
    process.env.REACT_APP_CENTRAL_IDENTITY_PREVIEW = "false";
    Object.defineProperty(window, "location", { configurable: true, value: { ...originalLocation, protocol: "http:", hostname: "localhost" } });
    expect(centralPreviewEnabled()).toBe(false);
});

test("only constructs transfer origins for valid tenant slugs", () => {
    expect(isLocalTenant("rhsc.localhost")).toBe(true);
    expect(isLocalTenant("rhsc.localhost.evil.example")).toBe(false);
    expect(tenantOrigin("rhsc")).toBe("http://rhsc.localhost");
    expect(() => tenantOrigin("evil.example")).toThrow();
    expect(() => tenantOrigin("rhsc@evil")).toThrow();
});

test("builds the central root origin using the current local frontend port", () => {
    Object.defineProperty(window, "location", { configurable: true, value: { ...originalLocation, port: "3001" } });
    expect(centralRootOrigin()).toBe("http://localhost:3001");
    Object.defineProperty(window, "location", { configurable: true, value: { ...originalLocation, port: "" } });
    expect(centralRootOrigin()).toBe("http://localhost");
});
