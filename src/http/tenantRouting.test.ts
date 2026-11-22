import http from ".";

test.each([
    ["localhost", "http://localhost:8080/"],
    ["rhsc.localhost", "http://rhsc.localhost:8080/"],
    ["a.localhost", "http://a.localhost:8080/"],
    ["nova-empresa.localhost", "http://nova-empresa.localhost:8080/"],
    ["rhintegrado.com.br", "https://api.rhintegrado.com.br/"],
])("routes %s to its expected API without changing production behavior", (hostname, expected) => {
    const original = window.location;
    Object.defineProperty(window, "location", { configurable: true, value: { ...original, hostname } });
    try {
        jest.isolateModules(() => {
            const client: typeof http = require(".").default;
            expect(client.defaults.baseURL).toBe(expected);
        });

    } finally {
        Object.defineProperty(window, "location", { configurable: true, value: original });
    }
});

test("rejects operational requests at the local root even with an old session", async () => {
    const original = window.location;
    Object.defineProperty(window, "location", { configurable: true, value: { ...original, hostname: "localhost" } });
    try {
        let client = http;
        jest.isolateModules(() => { client = require(".").default; });
        await expect(client.get("/usuarios/1", { headers: { Authorization: "Bearer legacy-token" } }))
            .rejects.toThrow("O dominio raiz local nao possui acesso operacional.");
    } finally {
        Object.defineProperty(window, "location", { configurable: true, value: original });
    }
});
