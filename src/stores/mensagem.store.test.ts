import { formatarMensagem } from "./mensagem.store";

test.each(["message", "error", "erro"])("extracts backend messages from %s without displaying object serialization", key => {
    expect(formatarMensagem({
        isAxiosError: true,
        response: { data: { [key]: "Confira seus dados." } },
    })).toBe("Confira seus dados.");
});

test("extracts string responses and standard errors", () => {
    expect(formatarMensagem({ isAxiosError: true, response: { data: "Acesso negado." } })).toBe("Acesso negado.");
    expect(formatarMensagem(new Error("Falha de rede."))).toBe("Falha de rede.");
    expect(formatarMensagem({ message: "Falha na operação." })).toBe("Falha na operação.");
    expect(formatarMensagem("Mensagem original.")).toBe("Mensagem original.");
    expect(formatarMensagem(42)).toBe("42");
});

test.each([null, undefined, {}, "", "   "])("uses an explicit error message for unsupported values: %p", value => {
    expect(formatarMensagem(value)).toBe("Não foi possível concluir a operação. Tente novamente.");
});
