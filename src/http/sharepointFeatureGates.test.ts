import { isLibraryEnabled } from "./bibliotecas";
import { isModelCatalogEnabled } from "./modelosArquivo";
import { isSharePointEnabled } from "./sharepoint";

describe("SharePoint UI feature gates", () => {
    const originalLocation = window.location;
    const originalFlags = {
        sharepoint: process.env.REACT_APP_SHAREPOINT_ENABLED,
        test: process.env.REACT_APP_SHAREPOINT_TEST_ENABLED,
        library: process.env.REACT_APP_LIBRARY_ENABLED,
        catalog: process.env.REACT_APP_MODEL_CATALOG_ENABLED,
    };

    afterEach(() => {
        Object.defineProperty(window, "location", { configurable: true, value: originalLocation });
        Object.entries({
            REACT_APP_SHAREPOINT_ENABLED: originalFlags.sharepoint,
            REACT_APP_SHAREPOINT_TEST_ENABLED: originalFlags.test,
            REACT_APP_LIBRARY_ENABLED: originalFlags.library,
            REACT_APP_MODEL_CATALOG_ENABLED: originalFlags.catalog,
        }).forEach(([key, value]) => {
            if (value === undefined) delete process.env[key];
            else process.env[key] = value;
        });
    });

    function host(hostname: string) {
        Object.defineProperty(window, "location", { configurable: true, value: { hostname } });
    }

    function enableFeatures() {
        process.env.REACT_APP_SHAREPOINT_ENABLED = "true";
        process.env.REACT_APP_SHAREPOINT_TEST_ENABLED = "true";
        process.env.REACT_APP_LIBRARY_ENABLED = "true";
        process.env.REACT_APP_MODEL_CATALOG_ENABLED = "true";
    }

    test("requires explicit opt-in and permits it only on the RHSC local host", () => {
        enableFeatures();
        host("a.localhost");
        expect(isSharePointEnabled()).toBe(false);
        expect(isLibraryEnabled()).toBe(false);
        expect(isModelCatalogEnabled()).toBe(false);

        host("rhsc.localhost");
        expect(isSharePointEnabled()).toBe(true);
        expect(isLibraryEnabled()).toBe(true);
        expect(isModelCatalogEnabled()).toBe(true);

        host("localhost");
        expect(isSharePointEnabled()).toBe(false);
        expect(isLibraryEnabled()).toBe(false);
        expect(isModelCatalogEnabled()).toBe(false);
    });

    test("keeps local test features disabled when the explicit TEST gate is absent", () => {
        process.env.REACT_APP_SHAREPOINT_ENABLED = "true";
        process.env.REACT_APP_LIBRARY_ENABLED = "true";
        process.env.REACT_APP_MODEL_CATALOG_ENABLED = "true";
        host("rhsc.localhost");
        expect(isSharePointEnabled()).toBe(false);
        expect(isLibraryEnabled()).toBe(false);
        expect(isModelCatalogEnabled()).toBe(false);
    });

    test("preserves existing non-local feature flag behavior", () => {
        enableFeatures();
        host("rhsc.rhintegrado.com.br");
        expect(isSharePointEnabled()).toBe(true);
        expect(isLibraryEnabled()).toBe(true);
        expect(isModelCatalogEnabled()).toBe(true);
    });
});
