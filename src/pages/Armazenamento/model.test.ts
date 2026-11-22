import { measuredUsage, StorageSummary } from "./model";

const real: StorageSummary = {
    tenantId: "rhsc", slug: "rhsc", name: "RHSC", tenantStatus: "ACTIVE", simulated: false,
    state: "FAILED", usedBytes: null, knownBytes: 0, expectedContainers: 0, collectedContainers: 0,
    collectedAt: null, lastCompleteAt: null, lastCompleteBytes: null, stale: true,
};

it("does not display empty real inventory or failed measurements as zero", () => {
    expect(measuredUsage(real)).toContain("Nenhum container Microsoft TEST validado");
    expect(measuredUsage({ ...real, expectedContainers: 1 })).toContain("Falha na coleta");
    expect(measuredUsage({ ...real, expectedContainers: 1, state: "PARTIAL", knownBytes: 42 }))
        .toContain("não é o total");
});

it("allows explicitly measured zero for a real container", () => {
    expect(measuredUsage({ ...real, state: "COMPLETE", expectedContainers: 1, collectedContainers: 1, usedBytes: 0 }))
        .toContain("0 bytes");
});
