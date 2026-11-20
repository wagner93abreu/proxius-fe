import { isRhscLocalSharePoint, isRhscSharePointTestEnabled } from "./localSharePoint";

describe("SharePoint local da RHSC", () => {
    const original = window.location;
    const originalSharePointEnabled = process.env.REACT_APP_SHAREPOINT_ENABLED;
    const originalSharePointTestEnabled = process.env.REACT_APP_SHAREPOINT_TEST_ENABLED;
    afterEach(() => {
        Object.defineProperty(window, "location", { configurable: true, value: original });
        if (originalSharePointEnabled === undefined) delete process.env.REACT_APP_SHAREPOINT_ENABLED;
        else process.env.REACT_APP_SHAREPOINT_ENABLED = originalSharePointEnabled;
        if (originalSharePointTestEnabled === undefined) delete process.env.REACT_APP_SHAREPOINT_TEST_ENABLED;
        else process.env.REACT_APP_SHAREPOINT_TEST_ENABLED = originalSharePointTestEnabled;
    });

    test.each([
        ["rhsc.localhost", true], ["a.localhost", false], ["b.localhost", false],
        ["localhost", false], ["rhsc.localhost.example.com", false],
        ["rhsc.rhintegrado.com.br", false],
    ])("identifica %s sem habilitar outras empresas", (hostname, enabled) => {
        Object.defineProperty(window, "location", { configurable: true, value: { hostname } });
        expect(isRhscLocalSharePoint()).toBe(enabled);
    });

    test("requires explicit SharePoint and TEST flags for RHSC local", () => {
        Object.defineProperty(window, "location", { configurable: true, value: { hostname: "rhsc.localhost" } });
        process.env.REACT_APP_SHAREPOINT_ENABLED = "true";
        expect(isRhscSharePointTestEnabled()).toBe(false);
        process.env.REACT_APP_SHAREPOINT_TEST_ENABLED = "true";
        expect(isRhscSharePointTestEnabled()).toBe(true);
    });

    test.each(["a.localhost", "b.localhost", "localhost"])("never enables TEST Graph at %s", hostname => {
        Object.defineProperty(window, "location", { configurable: true, value: { hostname } });
        process.env.REACT_APP_SHAREPOINT_ENABLED = "true";
        process.env.REACT_APP_SHAREPOINT_TEST_ENABLED = "true";
        expect(isRhscSharePointTestEnabled()).toBe(false);
    });
});
