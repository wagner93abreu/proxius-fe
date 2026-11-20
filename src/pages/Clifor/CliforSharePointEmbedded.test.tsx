import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import http from "../../http";
import IClifor from "../../types/IClifor";
import ModalCadastro from "./ModalCadastro";
import ModalEditar from "./ModalEditar";

jest.mock("../../http", () => ({
    __esModule: true, default: { post: jest.fn(), put: jest.fn() },
}));
jest.mock("../../stores/autentica.store", () => ({
    __esModule: true, default: { usuario: { token: "test-token" } },
}));

const customer: IClifor = {
    id: 197, active: true, nomesocial: "Cliente", nomecomercial: "Teste",
    cpfcnpj: "12345678000100", inscricaoestadual: null, inscricaomunicipal: null,
    email: "cliente@example.org", telefone: "(11) 99999-9999", datanascimento: "",
    genero: "M", escolaridade: null, formacaoacademica: null, estadocivil: null,
    ocupacao: null, linkedinlink: null, linkedinfotolink: null, clifor: "CLIENTE",
    idusuario: "9",
    endereco: { pais: "BRASIL", uf: "SP", cidade: "São Paulo", cep: "12345678",
        bairro: "Centro", logradouro: "Rua", numero: "1", complemento: "" },
};

beforeEach(() => {
    jest.clearAllMocks();
    (http.post as jest.Mock).mockResolvedValue({});
    (http.put as jest.Mock).mockResolvedValue({});
    jest.spyOn(window, "alert").mockImplementation(() => undefined);
});
afterEach(() => jest.restoreAllMocks());

function fill(name: string, value: string) {
    fireEvent.change(document.querySelector(`[name="${name}"]`)!, { target: { value } });
}

test.each([false, true])("creation defaults to false and sends an explicit boolean (%s)", async (enabled) => {
    render(<ModalCadastro open handleClose={jest.fn()} />);
    const checkbox = screen.getByRole("checkbox", { name: "Usar SharePoint Embedded" });
    expect(checkbox).not.toBeChecked();
    if (enabled) fireEvent.click(checkbox);
    fill("nomesocial", "Cliente");
    fill("nomecomercial", "Teste");
    fill("cpfcnpj", "123.456.789-00");
    fill("email", "cliente@example.org");
    fill("telefone", "(11) 99999-9999");
    fill("tipoGenero", "M");
    fireEvent.click(screen.getByRole("button", { name: "Cadastrar" }));
    await waitFor(() => expect(http.post).toHaveBeenCalledWith("clifor",
        expect.objectContaining({ sharePointEmbeddedEnabled: enabled }), expect.any(Object)));
});

test.each([undefined, false, true])("editing loads the stored flag and submits its opposite (%s)", async (enabled) => {
    render(<ModalEditar editaOpen editaHandleClose={jest.fn()}
        clientefornecedor={[{ ...customer, sharePointEmbeddedEnabled: enabled }]} id={[197]} />);
    const checkbox = screen.getByRole("checkbox", { name: "Usar SharePoint Embedded" });
    if (enabled === true) expect(checkbox).toBeChecked();
    else expect(checkbox).not.toBeChecked();
    fireEvent.click(checkbox);
    fill("nomesocial", "Cliente");
    fill("nomecomercial", "Teste");
    const cnpj = document.querySelector('[name="cpfcnpj"]')!;
    userEvent.clear(cnpj);
    userEvent.type(cnpj, "12345678000100");
    fill("email", "cliente@example.org");
    fill("telefone", "(11) 99999-9999");
    fill("cep", "12.345-678");
    fireEvent.click(screen.getByRole("button", { name: "Atualizar" }));
    await waitFor(() => expect(http.put).toHaveBeenCalledWith("clifor",
        expect.objectContaining({ id: 197, sharePointEmbeddedEnabled: enabled !== true }), expect.any(Object)));
});

test("reopening edit for a legacy record clears the previous opt-in", () => {
    const { rerender } = render(<ModalEditar editaOpen editaHandleClose={jest.fn()}
        clientefornecedor={[{ ...customer, sharePointEmbeddedEnabled: true }]} id={[197]} />);
    expect(screen.getByRole("checkbox", { name: "Usar SharePoint Embedded" })).toBeChecked();
    rerender(<ModalEditar editaOpen={false} editaHandleClose={jest.fn()} clientefornecedor={[customer]} id={[197]} />);
    rerender(<ModalEditar editaOpen editaHandleClose={jest.fn()} clientefornecedor={[customer]} id={[197]} />);
    expect(screen.getByRole("checkbox", { name: "Usar SharePoint Embedded" })).not.toBeChecked();
});
