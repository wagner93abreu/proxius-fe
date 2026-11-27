import { publicLoginPreviewTenant } from "./publicLoginPreview";

test.each([
    ["https:", "proxius.com.br", "proxius"],
    ["https:", "www.proxius.com.br", "proxius"],
    ["https:", "automatizego.proxius.com.br", "automatizego"],
    ["http:", "proxius.com.br", null],
    ["https:", "other.proxius.com.br", null],
])("restricts preview to approved HTTPS host %s %s", (protocol, hostname, expected) => {
    const original = window.location;
    const previousFlag = process.env.REACT_APP_PUBLIC_LOGIN_PREVIEW;
    Object.defineProperty(window, "location", { configurable: true, value: { ...original, protocol, hostname } });
    process.env.REACT_APP_PUBLIC_LOGIN_PREVIEW = "true";
    try {
        expect(publicLoginPreviewTenant()).toBe(expected);
        delete process.env.REACT_APP_PUBLIC_LOGIN_PREVIEW;
        expect(publicLoginPreviewTenant()).toBeNull();
    } finally {
        Object.defineProperty(window, "location", { configurable: true, value: original });
        if (previousFlag === undefined) delete process.env.REACT_APP_PUBLIC_LOGIN_PREVIEW;
        else process.env.REACT_APP_PUBLIC_LOGIN_PREVIEW = previousFlag;
    }
});
